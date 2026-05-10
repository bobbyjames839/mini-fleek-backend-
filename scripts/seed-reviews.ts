import { createClient } from '@supabase/supabase-js'
import { env } from '../src/config/env'

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  console.error(
    'Seed requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.',
  )
  process.exit(1)
}

const admin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const reviews = [
  {
    reviewer_name: 'Maya R.',
    rating: 5,
    title: 'Grading is honest',
    body: 'Bundles arrive as described. Grading matches the listings — no surprises, no padding with unsellable pieces. Fleek has become our default sourcing platform.',
  },
  {
    reviewer_name: 'Tom B.',
    rating: 4,
    title: 'Solid mix, fast ship',
    body: 'Good variety in everything we have ordered. Shipping is consistently quicker than quoted. The vendor communication through Fleek is the best I have seen on a wholesale platform.',
  },
  {
    reviewer_name: 'Priya S.',
    rating: 5,
    title: 'Sold through in two weeks',
    body: 'We cleared most of our last lot in our boutique within a fortnight. Margins were healthy at our price points. Fleek has genuinely changed how we buy.',
  },
  {
    reviewer_name: 'Jake M.',
    rating: 4,
    title: 'Great platform, fair pricing',
    body: 'Pricing is transparent, the per-piece economics are easy to model, and the photos in the listings are representative. A couple of bundles leaned a touch lower on grade than I expected, but support sorted it.',
  },
  {
    reviewer_name: 'Léa D.',
    rating: 5,
    title: 'Strong vendor mix',
    body: 'Fleek has a deeper bench of European and Asian vendors than the platforms we used before. Brand mix on bundles consistently matches the listing percentages.',
  },
  {
    reviewer_name: 'Ahmed K.',
    rating: 4,
    title: 'Good for online resale',
    body: 'Photographing and listing pieces from a Fleek bundle is fast — the grading and size split data save us a sorting step. Recommended for online resellers.',
  },
  {
    reviewer_name: 'Sasha P.',
    rating: 5,
    title: 'The best wholesale experience',
    body: 'Buyer protection actually works. We had one issue with a bundle and it was resolved in 48 hours. That is the difference between Fleek and every other wholesaler we have tried.',
  },
  {
    reviewer_name: 'Daniel O.',
    rating: 4,
    title: 'Worth it',
    body: 'The site is fast, search is good, and the per-piece pricing makes it easy to forecast margins. We come back every season.',
  },
]

async function run() {
  console.log('→ wiping existing reviews')
  await admin.from('reviews').delete().not('id', 'is', null)

  console.log(`→ inserting ${reviews.length} site-wide reviews`)
  const { error } = await admin.from('reviews').insert(reviews)
  if (error) throw error

  console.log('✓ review seed complete')
}

run().catch((err) => {
  console.error('review seed failed:', err)
  process.exit(1)
})
