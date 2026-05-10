import express from 'express'
import { env } from '../config/env'
import { supabase } from '../lib/supabase'
import {
  PRODUCT_SUMMARY_SELECT,
  ProductRow,
  mapProductSummary,
} from '../lib/products'

const router = express.Router()

// Compact rows fed to the AI. Keep this lean — every byte goes into the prompt.
const PRODUCT_AI_SELECT = `
  id, name, brand, description, grade, piece_count, total_price, price_per_piece, status,
  vendor:vendors!inner(name, country),
  category:categories!inner(name, slug)
`

interface AiProductRow {
  id: string
  name: string
  brand: string
  description: string | null
  grade: string | null
  piece_count: number
  total_price: number
  price_per_piece: number
  status: 'active' | 'sold_out'
  vendor: { name: string; country: string } | null
  category: { name: string; slug: string } | null
}

function unavailable(res: express.Response, what: string) {
  return res.status(503).json({ error: `${what} is unavailable. Check backend/.env.` })
}

// ---- AI ranking ------------------------------------------------------------

const SYSTEM_PROMPT = `You are a search assistant for Fleek, a B2B wholesale marketplace for second-hand fashion bundles. Each bundle is sold per-bundle with per-piece pricing in GBP (prices below are in pence — divide by 100 for £).

You receive a buyer's natural-language query and the FULL product catalogue as a JSON array. Your job: pick the products that genuinely match the buyer's intent and return them in order of best fit.

Rules:
- Return STRICT JSON of shape: {"product_ids": ["<id>", "<id>", ...]}.
- Only include IDs that appear in the catalogue. Do not invent IDs.
- Order matters: the first ID is the best match.
- Be generous when the query is broad (e.g. "vintage tees") — include everything reasonably matching.
- Be strict when the query is specific (price caps, grade, country, brand, piece-count limits) — exclude items that violate the constraint.
- If the buyer specifies a price/piece-count constraint, treat it as a hard filter.
- If nothing matches, return {"product_ids": []}.
- Do not include any commentary — JSON only.`

interface RankedResult {
  product_ids: string[]
}

async function rankWithAi(query: string, products: AiProductRow[]): Promise<string[]> {
  const compact = products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    description: p.description,
    grade: p.grade,
    piece_count: p.piece_count,
    total_price_pence: p.total_price,
    price_per_piece_pence: p.price_per_piece,
    status: p.status,
    vendor: p.vendor?.name ?? null,
    vendor_country: p.vendor?.country ?? null,
    category: p.category?.name ?? null,
    category_slug: p.category?.slug ?? null,
  }))

  const userPrompt = [
    `Buyer's query: "${query}"`,
    '',
    'Catalogue:',
    JSON.stringify(compact),
  ].join('\n')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModel,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`openai ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = json.choices?.[0]?.message?.content ?? '{}'

  let raw: RankedResult
  try {
    raw = JSON.parse(content) as RankedResult
  } catch {
    throw new Error('model returned non-JSON content')
  }

  const validIds = new Set(products.map((p) => p.id))
  const ids = Array.isArray(raw.product_ids) ? raw.product_ids : []
  return ids.filter((id) => typeof id === 'string' && validIds.has(id))
}

// ---- Route -----------------------------------------------------------------

router.post('/products/search', async (req, res) => {
  if (!env.openaiApiKey) return unavailable(res, 'AI search')
  if (!supabase) return unavailable(res, 'Database')

  const body = (req.body ?? {}) as { query?: unknown; limit?: unknown }
  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 300) : ''
  if (!query) return res.status(400).json({ error: 'query must be a non-empty string.' })

  const limit = Math.min(
    Math.max(typeof body.limit === 'number' ? Math.floor(body.limit) : 24, 1),
    60,
  )

  // 1. Pull the full catalogue (compact form) for the AI.
  const { data: catalogue, error: catErr } = await supabase
    .from('products')
    .select(PRODUCT_AI_SELECT)
    .eq('status', 'active')

  if (catErr) {
    console.error('ai search catalogue error:', catErr)
    return res.status(500).json({ error: 'Could not load catalogue.' })
  }

  const aiRows = (catalogue ?? []) as unknown as AiProductRow[]
  if (aiRows.length === 0) {
    return res.json({ query, products: [], total: 0, limit })
  }

  // 2. Ask the AI which IDs match, in order.
  let rankedIds: string[]
  try {
    rankedIds = await rankWithAi(query, aiRows)
  } catch (err) {
    console.error('ai search rank error:', err)
    return res.status(502).json({ error: 'Could not understand the query.' })
  }

  if (rankedIds.length === 0) {
    return res.json({ query, products: [], total: 0, limit })
  }

  const limited = rankedIds.slice(0, limit)

  // 3. Hydrate full product summaries from the DB.
  const { data: hydrated, error: hydErr } = await supabase
    .from('products')
    .select(PRODUCT_SUMMARY_SELECT)
    .in('id', limited)

  if (hydErr) {
    console.error('ai search hydrate error:', hydErr)
    return res.status(500).json({ error: 'Could not load products.' })
  }

  const byId = new Map<string, ProductRow>()
  for (const row of (hydrated ?? []) as unknown as ProductRow[]) {
    byId.set(row.id, row)
  }
  const products = limited
    .map((id) => byId.get(id))
    .filter((r): r is ProductRow => !!r)
    .map(mapProductSummary)

  return res.json({
    query,
    products,
    total: products.length,
    limit,
  })
})

export default router
