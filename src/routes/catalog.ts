import express from 'express'
import { supabase } from '../lib/supabase'
import {
  PRODUCT_SUMMARY_SELECT,
  ProductRow,
  discountPct,
  mapProductSummary,
} from '../lib/products'

const router = express.Router()

const PRODUCT_DETAIL_SELECT = `
  id, name, slug, description, brand, photos, piece_count, total_price,
  price_per_piece, original_total_price, status,
  grade, grading_breakdown, brand_mix, size_split,
  vendor:vendors!inner(id, name, slug, country, rating, about),
  category:categories!inner(id, name, slug)
`

function mapProductDetail(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    brand: row.brand,
    photos: row.photos ?? [],
    piece_count: row.piece_count,
    total_price: row.total_price,
    price_per_piece: row.price_per_piece,
    original_total_price: row.original_total_price,
    discount_pct: discountPct(row.total_price, row.original_total_price),
    status: row.status,
    grade: row.grade ?? null,
    grading_breakdown: row.grading_breakdown ?? null,
    brand_mix: row.brand_mix ?? null,
    size_split: row.size_split ?? null,
    vendor: row.vendor,
    category: row.category,
  }
}

function unavailable(res: express.Response) {
  return res.status(503).json({
    error: 'Database is unavailable. Configure SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env.',
  })
}

// ---- Categories ------------------------------------------------------------

router.get('/categories', async (_req, res) => {
  if (!supabase) return unavailable(res)
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, image_url')
    .order('name', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ categories: data })
})

// ---- Vendors ---------------------------------------------------------------

router.get('/vendors', async (_req, res) => {
  if (!supabase) return unavailable(res)
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, slug, country, rating, image_url')
    .order('name', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ vendors: data })
})

// ---- Products --------------------------------------------------------------

router.get('/products', async (req, res) => {
  if (!supabase) return unavailable(res)

  const categorySlug = typeof req.query.category === 'string' ? req.query.category : undefined
  const vendorSlug = typeof req.query.vendor === 'string' ? req.query.vendor : undefined
  const q = typeof req.query.q === 'string' ? req.query.q : undefined
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'newest'
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '24'), 10) || 24, 1), 60)
  const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0)

  let query = supabase
    .from('products')
    .select(PRODUCT_SUMMARY_SELECT, { count: 'exact' })
    .range(offset, offset + limit - 1)

  switch (sort) {
    case 'price_asc':
      query = query.order('total_price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('total_price', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  if (categorySlug) query = query.eq('category.slug', categorySlug)
  if (vendorSlug) query = query.eq('vendor.slug', vendorSlug)
  if (q) {
    const safe = q.replace(/[%_,()]/g, '').slice(0, 50)
    if (safe) {
      const pattern = `%${safe}%`
      query = query.or(`name.ilike.${pattern},brand.ilike.${pattern}`)
    }
  }

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })

  return res.json({
    products: ((data ?? []) as unknown as ProductRow[]).map(mapProductSummary),
    total: count ?? 0,
    limit,
    offset,
  })
})

router.get('/products/:id', async (req, res) => {
  if (!supabase) return unavailable(res)
  const { id } = req.params

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Product not found.' })

  return res.json({ product: mapProductDetail(data as unknown as ProductRow) })
})

export default router
