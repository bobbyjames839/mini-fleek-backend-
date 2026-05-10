import express from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { loadCart } from './cart'

const router = express.Router()

router.use(requireAuth)

interface ShippingAddressInput {
  full_name?: unknown
  line1?: unknown
  line2?: unknown
  city?: unknown
  postcode?: unknown
  country?: unknown
}

function validateAddress(input: ShippingAddressInput) {
  const errors: string[] = []
  const required: Array<keyof ShippingAddressInput> = [
    'full_name', 'line1', 'city', 'postcode', 'country',
  ]
  for (const key of required) {
    const value = input[key]
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`shipping_address.${String(key)} is required`)
    }
  }
  if (input.line2 !== undefined && input.line2 !== null && typeof input.line2 !== 'string') {
    errors.push('shipping_address.line2 must be a string or null')
  }
  return errors
}

function shapeOrder(order: any, items: any[]) {
  return {
    id: order.id,
    status: order.status,
    created_at: order.created_at,
    shipping_address: {
      full_name: order.shipping_full_name,
      line1: order.shipping_line1,
      line2: order.shipping_line2 ?? null,
      city: order.shipping_city,
      postcode: order.shipping_postcode,
      country: order.shipping_country,
    },
    items: items.map((it) => ({
      id: it.id,
      product_id: it.product_id,
      product_name: it.product_name,
      product_slug: it.product_slug,
      primary_photo: it.primary_photo,
      vendor_name: it.vendor_name,
      piece_count: it.piece_count,
      quantity: it.quantity,
      unit_price: it.unit_price,
      line_total: it.line_total,
    })),
    subtotal: order.subtotal,
    total: order.total,
  }
}

// ---- Checkout --------------------------------------------------------------

router.post('/checkout', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({
      error: 'Checkout is unavailable. Configure SUPABASE_SERVICE_ROLE_KEY in backend/.env.',
    })
  }

  const { supa, user } = req as unknown as AuthedRequest
  const address = (req.body?.shipping_address ?? {}) as ShippingAddressInput
  const addressErrors = validateAddress(address)
  if (addressErrors.length > 0) {
    return res.status(400).json({ error: 'Invalid request.', details: addressErrors })
  }

  const cart = await loadCart(supa, user.id)
  if (cart.items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty.' })
  }

  const subtotal = cart.subtotal
  const total = subtotal

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'placed',
      subtotal,
      total,
      item_count: cart.item_count,
      shipping_full_name: (address.full_name as string).trim(),
      shipping_line1: (address.line1 as string).trim(),
      shipping_line2: typeof address.line2 === 'string' ? address.line2.trim() || null : null,
      shipping_city: (address.city as string).trim(),
      shipping_postcode: (address.postcode as string).trim(),
      shipping_country: (address.country as string).trim(),
    })
    .select()
    .single()
  if (orderErr) return res.status(500).json({ error: orderErr.message })

  const orderItemRows = cart.items.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_slug: item.product.slug,
    primary_photo: item.product.primary_photo,
    vendor_name: item.product.vendor?.name ?? '',
    piece_count: item.product.piece_count,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total,
  }))

  const { data: insertedItems, error: itemsErr } = await supabaseAdmin
    .from('order_items')
    .insert(orderItemRows)
    .select()
  if (itemsErr) return res.status(500).json({ error: itemsErr.message })

  const { error: clearErr } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)
  if (clearErr) return res.status(500).json({ error: clearErr.message })

  return res.status(201).json({ order: shapeOrder(order, insertedItems ?? []) })
})

// ---- Orders list -----------------------------------------------------------

router.get('/orders', async (req, res) => {
  const { supa, user } = req as unknown as AuthedRequest

  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '20'), 10) || 20, 1), 60)
  const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0)

  const { data, count, error } = await supa
    .from('orders')
    .select('id, status, subtotal, total, item_count, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) return res.status(500).json({ error: error.message })

  return res.json({ orders: data, total: count ?? 0, limit, offset })
})

// ---- Order detail ----------------------------------------------------------

router.get('/orders/:id', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({
      error: 'Orders are unavailable. Configure SUPABASE_SERVICE_ROLE_KEY in backend/.env.',
    })
  }
  const { user } = req as unknown as AuthedRequest
  const { id } = req.params

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (orderErr) return res.status(500).json({ error: orderErr.message })
  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.user_id !== user.id) return res.status(403).json({ error: 'Forbidden.' })

  const { data: items, error: itemsErr } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: true })
  if (itemsErr) return res.status(500).json({ error: itemsErr.message })

  return res.json({ order: shapeOrder(order, items ?? []) })
})

export default router
