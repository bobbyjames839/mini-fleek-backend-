import express from 'express'
import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAuth, type AuthedRequest } from '../middleware/auth'

const router = express.Router()

interface CartRow {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    photos: string[] | null
    piece_count: number
    price_per_piece: number
    total_price: number
    status: 'active' | 'sold_out'
    vendor: { name: string; slug: string } | null
  } | null
}

const CART_SELECT = `
  id, quantity,
  product:products!inner(
    id, name, slug, photos, piece_count, price_per_piece, total_price, status,
    vendor:vendors!inner(name, slug)
  )
`

async function loadCart(supa: SupabaseClient, userId: string) {
  const { data, error } = await supa
    .from('cart_items')
    .select(CART_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error

  const items = ((data ?? []) as unknown as CartRow[])
    .filter((row) => row.product !== null)
    .map((row) => {
      const product = row.product!
      const lineTotal = product.total_price * row.quantity
      return {
        id: row.id,
        quantity: row.quantity,
        unit_price: product.total_price,
        line_total: lineTotal,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          primary_photo: product.photos?.[0] ?? null,
          piece_count: product.piece_count,
          price_per_piece: product.price_per_piece,
          vendor: product.vendor,
        },
      }
    })

  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return { items, subtotal, item_count: itemCount }
}

router.use(requireAuth)

router.get('/', async (req, res) => {
  const { supa, user } = req as unknown as AuthedRequest
  try {
    const cart = await loadCart(supa, user.id)
    return res.json({ cart })
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message })
  }
})

router.post('/items', async (req, res) => {
  const { supa, user } = req as unknown as AuthedRequest
  const { product_id, quantity } = (req.body ?? {}) as { product_id?: string; quantity?: number }

  if (!product_id || typeof product_id !== 'string') {
    return res.status(400).json({ error: 'product_id is required.' })
  }
  const qty = Number.isFinite(quantity) ? Math.floor(quantity as number) : 1
  if (qty < 1) {
    return res.status(400).json({ error: 'quantity must be at least 1.' })
  }

  const { data: product, error: prodErr } = await supa
    .from('products')
    .select('id, status')
    .eq('id', product_id)
    .maybeSingle()
  if (prodErr) return res.status(500).json({ error: prodErr.message })
  if (!product) return res.status(404).json({ error: 'Product not found.' })
  if (product.status === 'sold_out') {
    return res.status(400).json({ error: 'Product is sold out.' })
  }

  const { data: existing, error: existingErr } = await supa
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', product_id)
    .maybeSingle()
  if (existingErr) return res.status(500).json({ error: existingErr.message })

  if (existing) {
    const { error: updErr } = await supa
      .from('cart_items')
      .update({ quantity: existing.quantity + qty, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (updErr) return res.status(500).json({ error: updErr.message })
  } else {
    const { error: insErr } = await supa
      .from('cart_items')
      .insert({ user_id: user.id, product_id, quantity: qty })
    if (insErr) return res.status(500).json({ error: insErr.message })
  }

  const cart = await loadCart(supa, user.id)
  return res.status(200).json({ cart })
})

router.patch('/items/:itemId', async (req, res) => {
  const { supa, user } = req as unknown as AuthedRequest
  const { itemId } = req.params
  const { quantity } = (req.body ?? {}) as { quantity?: number }

  if (!Number.isFinite(quantity) || (quantity as number) < 1) {
    return res.status(400).json({ error: 'quantity must be an integer >= 1.' })
  }

  const { data, error } = await supa
    .from('cart_items')
    .update({ quantity: Math.floor(quantity as number), updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select('id')
    .maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Cart item not found.' })

  const cart = await loadCart(supa, user.id)
  return res.json({ cart })
})

router.delete('/items/:itemId', async (req, res) => {
  const { supa, user } = req as unknown as AuthedRequest
  const { itemId } = req.params

  const { data, error } = await supa
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .select('id')
    .maybeSingle()
  if (error) return res.status(500).json({ error: error.message })
  if (!data) return res.status(404).json({ error: 'Cart item not found.' })

  const cart = await loadCart(supa, user.id)
  return res.json({ cart })
})

export { loadCart }
export default router
