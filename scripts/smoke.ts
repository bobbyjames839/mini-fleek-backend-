/**
 * End-to-end smoke test against a running backend.
 *
 *   npm run dev      # in another terminal
 *   npm run smoke
 *
 * Provisions throwaway test users via the Supabase admin API (bypasses
 * signup rate limits + email confirmation), then walks the full buyer
 * funnel via the public HTTP API. Tests /auth/signup once with a fresh
 * email to keep that endpoint covered.
 */
import { createClient } from '@supabase/supabase-js'
import { env } from '../src/config/env'

const BASE = process.env.SMOKE_BASE_URL || `http://localhost:${env.port}`
const TEST_EMAIL_DOMAIN = 'mailinator.com'

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  console.error('Smoke test needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.')
  process.exit(1)
}

const admin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---- Result tracking ------------------------------------------------------

let passed = 0
const failures: string[] = []
const createdUserIds: string[] = []

const ok = (msg: string) => {
  passed++
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`)
}
const fail = (msg: string, detail?: unknown) => {
  failures.push(msg)
  const d = detail === undefined ? '' : ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`
  console.log(`  \x1b[31m✗\x1b[0m ${msg}${d}`)
}
const section = (name: string) => console.log(`\n── ${name} ──`)

// ---- HTTP helper ----------------------------------------------------------

type ReqOpts = { token?: string; body?: unknown }
type Resp = { status: number; body: any }

async function req(method: string, path: string, opts: ReqOpts = {}): Promise<Resp> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
  let body: any
  const text = await res.text()
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  return { status: res.status, body }
}

const assertStatus = (label: string, r: Resp, expected: number) => {
  if (r.status === expected) ok(`${label} → ${expected}`)
  else fail(label, `got ${r.status} ${JSON.stringify(r.body)}`)
}

// ---- User helpers (service role) -----------------------------------------

const uniqueEmail = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@${TEST_EMAIL_DOMAIN}`

async function createTestUser(): Promise<{ email: string; password: string; userId: string; token: string }> {
  const email = uniqueEmail('smoke')
  const password = `Smoke!Pass-${Math.random().toString(36).slice(2)}`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error || !data.user) throw new Error(`admin createUser failed: ${error?.message}`)
  createdUserIds.push(data.user.id)
  // Log in via the public route to verify the login path also works.
  const login = await req('POST', '/auth/login', { body: { email, password } })
  if (login.status !== 200) throw new Error(`login failed: ${login.status} ${JSON.stringify(login.body)}`)
  return { email, password, userId: data.user.id, token: login.body.session.access_token }
}

async function cleanup() {
  for (const id of createdUserIds) {
    try { await admin.auth.admin.deleteUser(id) } catch { /* ignore */ }
  }
}

// ---- Tests ----------------------------------------------------------------

async function run() {
  section('Health')
  assertStatus('GET /health', await req('GET', '/health'), 200)

  // Fresh login via admin-created user. This covers the login path too.
  const buyer = await createTestUser()
  ok(`provisioned test user ${buyer.email}`)

  section('Auth: validation + login failures')
  assertStatus('signup missing password', await req('POST', '/auth/signup', { body: { email: buyer.email } }), 400)
  assertStatus('login wrong password', await req('POST', '/auth/login', { body: { email: buyer.email, password: 'nope-nope-nope' } }), 401)

  // One real signup against the public endpoint with a fresh email so we
  // verify it works end-to-end. May 400 if the project has hit its
  // rate limit — we tolerate that and warn.
  const signupEmail = uniqueEmail('signup')
  const signupRes = await req('POST', '/auth/signup', { body: { email: signupEmail, password: 'hunter2hunter2' } })
  if (signupRes.status === 201) {
    ok(`POST /auth/signup → 201 (${signupEmail})`)
    if (signupRes.body?.user?.id) createdUserIds.push(signupRes.body.user.id)
  } else if (signupRes.status === 400 && /rate limit/i.test(JSON.stringify(signupRes.body))) {
    fail('POST /auth/signup', 'rate limit exceeded (Supabase project setting — bump the signup rate limit in dashboard)')
  } else {
    fail('POST /auth/signup', `${signupRes.status} ${JSON.stringify(signupRes.body)}`)
  }

  section('Catalog')
  const cats = await req('GET', '/categories')
  assertStatus('GET /categories', cats, 200)
  if (cats.body?.categories?.length === 5) ok('5 categories seeded')
  else fail('category count', `got ${cats.body?.categories?.length}`)
  const catImg = cats.body?.categories?.[0]?.image_url ?? ''
  if (/unsplash\.com/.test(catImg)) ok('category image is Unsplash')
  else fail('category image not Unsplash', catImg)

  const vendors = await req('GET', '/vendors')
  assertStatus('GET /vendors', vendors, 200)
  if (vendors.body?.vendors?.length === 5) ok('5 vendors seeded')
  else fail('vendor count', `got ${vendors.body?.vendors?.length}`)

  assertStatus('GET /vendors/karachi-threads', await req('GET', '/vendors/karachi-threads'), 200)
  assertStatus('GET /vendors/does-not-exist', await req('GET', '/vendors/does-not-exist'), 404)

  const products = await req('GET', '/products')
  assertStatus('GET /products', products, 200)
  if (products.body?.total === 25) ok('25 products total')
  else fail('product total', `got ${products.body?.total}`)
  const primary = products.body?.products?.[0]?.primary_photo ?? ''
  if (/unsplash\.com/.test(primary)) ok('primary_photo is Unsplash')
  else fail('primary_photo not Unsplash', primary)

  const tees = await req('GET', '/products?category=vintage-tees')
  assertStatus('filter by category', tees, 200)
  if (tees.body?.products?.length === 5) ok('vintage-tees has 5 products')
  else fail('vintage-tees count', `got ${tees.body?.products?.length}`)

  const sorted = await req('GET', '/products?sort=price_asc&limit=5')
  const prices: number[] = sorted.body?.products?.map((p: any) => p.total_price) ?? []
  const ascending = prices.every((p, i) => i === 0 || p >= prices[i - 1])
  if (ascending && prices.length === 5) ok(`price_asc actually ascending [${prices.join(', ')}]`)
  else fail('price_asc not sorted', prices)

  const prodId = products.body?.products?.[0]?.id
  const detail = await req('GET', `/products/${prodId}`)
  assertStatus('GET /products/:id', detail, 200)
  if (detail.body?.product?.photos?.length === 4) ok('product has 4 photos')
  else fail('photos count', `got ${detail.body?.product?.photos?.length}`)
  assertStatus('GET /products/:id unknown', await req('GET', '/products/00000000-0000-0000-0000-000000000000'), 404)

  // Find a sold_out product for the cart edge case.
  const allP = await req('GET', '/products?limit=60')
  const soldOut = allP.body?.products?.find((p: any) => p.status === 'sold_out')
  if (soldOut) ok(`found sold_out product (${soldOut.slug})`)
  else fail('no sold_out product in catalog', null)

  section('Cart (auth required)')
  assertStatus('GET /cart no token', await req('GET', '/cart'), 401)
  const empty = await req('GET', '/cart', { token: buyer.token })
  assertStatus('GET /cart', empty, 200)
  if (empty.body?.cart?.item_count === 0) ok('new user has empty cart')
  else fail('cart not empty', empty.body)

  const add1 = await req('POST', '/cart/items', { token: buyer.token, body: { product_id: prodId, quantity: 2 } })
  assertStatus('POST /cart/items', add1, 200)
  const itemId = add1.body?.cart?.items?.[0]?.id
  if (add1.body?.cart?.items?.[0]?.quantity === 2) ok('cart qty=2')
  else fail('cart qty', add1.body)

  const add2 = await req('POST', '/cart/items', { token: buyer.token, body: { product_id: prodId, quantity: 1 } })
  if (add2.body?.cart?.items?.length === 1 && add2.body?.cart?.items?.[0]?.quantity === 3) {
    ok('duplicate add merges (qty 2→3)')
  } else {
    fail('duplicate add', add2.body)
  }

  const patched = await req('PATCH', `/cart/items/${itemId}`, { token: buyer.token, body: { quantity: 4 } })
  assertStatus('PATCH /cart/items/:id', patched, 200)
  if (patched.body?.cart?.items?.[0]?.quantity === 4) ok('qty set to 4')
  else fail('patch qty', patched.body)

  assertStatus(
    'POST /cart/items qty=0',
    await req('POST', '/cart/items', { token: buyer.token, body: { product_id: prodId, quantity: 0 } }),
    400,
  )
  assertStatus(
    'POST /cart/items unknown product',
    await req('POST', '/cart/items', {
      token: buyer.token,
      body: { product_id: '00000000-0000-0000-0000-000000000000', quantity: 1 },
    }),
    404,
  )
  if (soldOut) {
    assertStatus(
      'POST /cart/items sold_out',
      await req('POST', '/cart/items', { token: buyer.token, body: { product_id: soldOut.id, quantity: 1 } }),
      400,
    )
  }

  const deleted = await req('DELETE', `/cart/items/${itemId}`, { token: buyer.token })
  assertStatus('DELETE /cart/items/:id', deleted, 200)
  if (deleted.body?.cart?.items?.length === 0) ok('cart empty after delete')
  else fail('cart not empty after delete', deleted.body)

  // Re-add for checkout
  const readd = await req('POST', '/cart/items', { token: buyer.token, body: { product_id: prodId, quantity: 2 } })
  if (readd.status !== 200) fail('re-add for checkout', readd)

  section('Checkout')
  assertStatus('POST /checkout no addr', await req('POST', '/checkout', { token: buyer.token, body: {} }), 400)

  const addr = {
    shipping_address: {
      full_name: 'Smoke Buyer',
      line1: '12 Brick Lane',
      line2: null,
      city: 'London',
      postcode: 'E1 6RF',
      country: 'GB',
    },
  }
  const checkout = await req('POST', '/checkout', { token: buyer.token, body: addr })
  assertStatus('POST /checkout', checkout, 201)
  const orderId = checkout.body?.order?.id
  if (orderId) ok(`order id returned (${orderId})`)
  else fail('no order id', checkout.body)

  const cartAfter = await req('GET', '/cart', { token: buyer.token })
  if (cartAfter.body?.cart?.item_count === 0) ok('cart cleared after checkout')
  else fail('cart not cleared', cartAfter.body)

  assertStatus('POST /checkout empty cart', await req('POST', '/checkout', { token: buyer.token, body: addr }), 400)

  section('Orders')
  const orders = await req('GET', '/orders', { token: buyer.token })
  assertStatus('GET /orders', orders, 200)
  if (orders.body?.orders?.length === 1) ok('1 order listed')
  else fail('orders count', `got ${orders.body?.orders?.length}`)

  const order = await req('GET', `/orders/${orderId}`, { token: buyer.token })
  assertStatus('GET /orders/:id', order, 200)
  if (order.body?.order?.items?.[0]?.quantity === 2) ok('order line qty=2')
  else fail('order line qty', order.body)
  const linePhoto = order.body?.order?.items?.[0]?.primary_photo ?? ''
  if (/unsplash\.com/.test(linePhoto)) ok('order item primary_photo snapshotted (Unsplash)')
  else fail('order line photo not snapshotted', linePhoto)

  assertStatus('GET /orders/:id 404', await req('GET', `/orders/00000000-0000-0000-0000-000000000000`, { token: buyer.token }), 404)

  section('Cross-user isolation')
  const stranger = await req('GET', `/orders/${orderId}`, { token: (await createTestUser()).token })
  assertStatus(`other user GET /orders/${orderId}`, stranger, 403)

  section('Logout')
  assertStatus('POST /auth/logout no token', await req('POST', '/auth/logout'), 401)
  assertStatus(
    'POST /auth/logout garbage token',
    await req('POST', '/auth/logout', { token: 'xxxx.invalid.token' }),
    401,
  )
  assertStatus('POST /auth/logout valid', await req('POST', '/auth/logout', { token: buyer.token }), 200)

  // Summary
  console.log('\n════════════════════════════════════════')
  console.log(`  PASS: ${passed}`)
  console.log(`  FAIL: ${failures.length}`)
  if (failures.length > 0) {
    console.log('  Failures:')
    for (const f of failures) console.log(`    • ${f}`)
  }
  console.log('════════════════════════════════════════')
}

run()
  .catch((err) => {
    console.error('\nSmoke test crashed:', err)
    failures.push(`crashed: ${err?.message ?? err}`)
  })
  .finally(async () => {
    await cleanup()
    process.exit(failures.length > 0 ? 1 : 0)
  })
