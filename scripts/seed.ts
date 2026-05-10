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

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

// Hand-picked Unsplash photos that actually show the relevant clothing.
// Each pool gets rotated per-product so different products in a category
// don't all show the same hero shot.
const u = (id: string) =>
  `https://images.unsplash.com/${id}?w=800&h=800&fit=crop&q=80`
const uPlus = (id: string) =>
  `https://plus.unsplash.com/${id}?w=800&h=800&fit=crop&q=80`

const photoPools: Record<string, string[]> = {
  'vintage-tees': [
    u('photo-1647664856968-880b8eccd588'),       // rack of vintage shirts
    u('photo-1708589794486-7767e6062c29'),       // tees + jeans store display
    uPlus('premium_photo-1671198905435-20f8d166efb2'), // shirt rack
    uPlus('premium_photo-1718913936342-eaafff98834b'), // white tee on wall
    u('photo-1647058551618-3c836c6045d2'),       // person in vintage tee
    u('photo-1773932545962-1566371d30cc'),       // black tee, model
  ],
  'designer-denim': [
    u('photo-1603202577997-003d15cfc20b'),       // jeans flat-lay on white
    u('photo-1775946477600-3616edfc6c26'),       // denim jackets on rack
    u('photo-1763686745848-612259e8897d'),       // denim jacket label closeup
    u('photo-1750000051292-9e951fff46a0'),       // jeans on retail rack
    u('photo-1741941171881-40832346c7fe'),       // patchwork denim
    u('photo-1656514588471-028c2d0972de'),       // jeans detail
  ],
  'y2k-streetwear': [
    uPlus('premium_photo-1673356302169-574db56b52cd'), // colored sweatshirts on rack
    u('photo-1776122090121-a3435870a860'),       // grey hoodie w/ patch
    uPlus('premium_photo-1673356301340-4522591be5f7'), // hoodie on hanger
    u('photo-1771950014791-9a9771724369'),       // red patterned hoodie
    u('photo-1772311993942-872095c6a227'),       // white hoodie, model
    u('photo-1632682582909-2b3a2581eef7'),       // hoodie streetwear
  ],
  sportswear: [
    u('photo-1655089131279-8029e8a21ac6'),       // group of sports jerseys
    u('photo-1773355579207-4bc7a0915e74'),       // jerseys on retail shelves
    u('photo-1764116679127-dc9d2c1138a7'),       // orange soccer jersey
    u('photo-1759447916905-5e3f5cc863d4'),       // white Adidas jersey
    u('photo-1765791277994-33e886a83a9d'),       // soccer jersey pattern
    u('photo-1662096909714-e2f206d0a636'),       // athletic shirts pair
  ],
  'luxury-heritage': [
    u('photo-1551028719-00167b16eac5'),          // black leather jacket on white
    u('photo-1727515546577-f7d82a47b51d'),       // leather jacket flat-lay
    u('photo-1559551409-dadc959f76b8'),          // leather jackets on brick wall
    u('photo-1521223890158-f9f7c3d5d504'),       // brown leather jacket display
    u('photo-1727524366429-27de8607d5f6'),       // leather jacket styled
    u('photo-1578198576866-7e0ba6078128'),       // brown zip leather jacket
  ],
}

const hashSlug = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const photosForProduct = (categorySlug: string, productSlug: string, count = 4) => {
  const pool = photoPools[categorySlug]
  if (!pool) throw new Error(`no photo pool for category ${categorySlug}`)
  const start = hashSlug(productSlug) % pool.length
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length])
}

const heroForCategory = (categorySlug: string) => {
  const pool = photoPools[categorySlug]
  if (!pool) throw new Error(`no photo pool for category ${categorySlug}`)
  return pool[0]
}

// ----------------------------------------------------------------------------
// Reference data
// ----------------------------------------------------------------------------

const categories = [
  { slug: 'vintage-tees',    name: 'Vintage Tees',    image_url: heroForCategory('vintage-tees') },
  { slug: 'designer-denim',  name: 'Designer Denim',  image_url: heroForCategory('designer-denim') },
  { slug: 'y2k-streetwear',  name: 'Y2K Streetwear',  image_url: heroForCategory('y2k-streetwear') },
  { slug: 'sportswear',      name: 'Sportswear',      image_url: heroForCategory('sportswear') },
  { slug: 'luxury-heritage', name: 'Luxury Heritage', image_url: heroForCategory('luxury-heritage') },
]

const vendors = [
  {
    slug: 'karachi-threads',
    name: 'Karachi Threads',
    country: 'PK',
    rating: 4.7,
    about:
      'Karachi-based wholesaler specialising in graded vintage tees and 90s denim. Hand-sorted bundles, AAA-A grading, ships globally.',
    image_url: u('photo-1708589794486-7767e6062c29'),
  },
  {
    slug: 'lahore-vintage-co',
    name: 'Lahore Vintage Co',
    country: 'PK',
    rating: 4.5,
    about:
      'Family-run sourcing operation in Lahore. Mixed-grade bundles with strong brand mix — Nike, Adidas, Carhartt regular features.',
    image_url: u('photo-1775946477600-3616edfc6c26'),
  },
  {
    slug: 'istanbul-wholesale',
    name: 'Istanbul Wholesale',
    country: 'TR',
    rating: 4.8,
    about:
      'Premium European-sourced vintage. Strong on luxury heritage, leather, and 80s/90s designer denim. Lower volume, higher grade.',
    image_url: u('photo-1727515546577-f7d82a47b51d'),
  },
  {
    slug: 'delhi-bundles',
    name: 'Delhi Bundles',
    country: 'IN',
    rating: 4.6,
    about:
      'High-volume wholesaler in Delhi. Specialises in Y2K streetwear and US college sportswear bundles for European resellers.',
    image_url: u('photo-1776122090121-a3435870a860'),
  },
  {
    slug: 'east-london-sourcing',
    name: 'East London Sourcing',
    country: 'GB',
    rating: 4.4,
    about:
      'UK-based hand-pickers. Smaller curated lots aimed at boutique vintage stores. Premium grading with photographed inventory.',
    image_url: u('photo-1773932545962-1566371d30cc'),
  },
]

const grading = (mix: Array<[string, number]>) =>
  mix.map(([grade, pct]) => ({ grade, pct }))

// Public catalog only exposes Grade A/B/C. Collapse the richer internal
// AAA/AA/A/B/C scale used in the seed data: AAA & AA → A, A → B, B & C → C.
const GRADE_COLLAPSE: Record<string, string> = {
  AAA: 'A', AA: 'A', A: 'B', B: 'C', C: 'C',
}
const GRADE_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 }

const collapseBreakdown = (
  rows: Array<{ grade: string; pct: number }>,
): Array<{ grade: string; pct: number }> => {
  const acc: Record<string, number> = {}
  for (const { grade, pct } of rows) {
    const g = GRADE_COLLAPSE[grade] ?? grade
    acc[g] = (acc[g] ?? 0) + pct
  }
  return Object.entries(acc)
    .sort(([a], [b]) => (GRADE_ORDER[a] ?? 9) - (GRADE_ORDER[b] ?? 9))
    .map(([grade, pct]) => ({ grade, pct }))
}

const headlineGrade = (rows: Array<{ grade: string; pct: number }>) => {
  const collapsed = collapseBreakdown(rows)
  const top = [...collapsed].sort((a, b) => b.pct - a.pct)[0]
  return `Grade ${top.grade}`
}
const brandMix = (mix: Array<[string, number]>) =>
  mix.map(([brand, pct]) => ({ brand, pct }))
const sizeSplit = (mix: Array<[string, number]>) =>
  mix.map(([size, pct]) => ({ size, pct }))

// ----------------------------------------------------------------------------
// Products (25). Prices in GBP pence.
// ----------------------------------------------------------------------------

type SeedProduct = {
  slug: string
  name: string
  description: string
  brand: string
  vendor_slug: string
  category_slug: string
  piece_count: number
  total_price: number
  original_total_price: number | null
  grade: string
  grading_breakdown: Array<{ grade: string; pct: number }>
  brand_mix: Array<{ brand: string; pct: number }>
  size_split: Array<{ size: string; pct: number }>
  status?: 'active' | 'sold_out'
}

const products: SeedProduct[] = [
  // --- Vintage Tees ---
  {
    slug: 'mixed-90s-graphic-tees-50pc',
    name: 'Mixed 90s Graphic Tees — 50pc Bundle',
    description:
      'A hand-sorted mix of single-stitch and 90s graphic tees. Heavy on tour merch, college prints, and faded blockbuster movie prints. Suited to vintage boutiques and online resellers.',
    brand: 'Mixed',
    vendor_slug: 'karachi-threads',
    category_slug: 'vintage-tees',
    piece_count: 50,
    total_price: 12500,
    original_total_price: 15000,
    grade: 'Grade A',
    grading_breakdown: grading([['AAA', 20], ['AA', 50], ['A', 30]]),
    brand_mix: brandMix([['Hanes', 30], ['Fruit of the Loom', 25], ['Screen Stars', 15], ['Mixed', 30]]),
    size_split: sizeSplit([['S', 15], ['M', 35], ['L', 30], ['XL', 20]]),
  },
  {
    slug: 'tour-band-tees-25pc',
    name: 'Vintage Tour & Band Tees — 25pc',
    description:
      'Curated lot of 90s and early 2000s tour and band tees. Includes faded prints from rock, metal, hip-hop merch runs. Higher per-piece value, lower volume.',
    brand: 'Mixed',
    vendor_slug: 'east-london-sourcing',
    category_slug: 'vintage-tees',
    piece_count: 25,
    total_price: 18750,
    original_total_price: null,
    grade: 'Premium',
    grading_breakdown: grading([['AAA', 60], ['AA', 30], ['A', 10]]),
    brand_mix: brandMix([['Mixed Tour Merch', 100]]),
    size_split: sizeSplit([['S', 10], ['M', 35], ['L', 35], ['XL', 20]]),
  },
  {
    slug: 'college-tees-100pc',
    name: 'US College Tees — 100pc Mixed Grade',
    description:
      'Bulk lot of US college and university tees. Champion, Russell Athletic, Jansport-era cuts. Good for high-turnover thrift retailers.',
    brand: 'Mixed',
    vendor_slug: 'delhi-bundles',
    category_slug: 'vintage-tees',
    piece_count: 100,
    total_price: 18000,
    original_total_price: 22000,
    grade: 'Grade A/B',
    grading_breakdown: grading([['AA', 40], ['A', 45], ['B', 15]]),
    brand_mix: brandMix([['Champion', 30], ['Russell Athletic', 25], ['Gildan', 20], ['Mixed', 25]]),
    size_split: sizeSplit([['S', 20], ['M', 35], ['L', 30], ['XL', 15]]),
  },
  {
    slug: 'single-stitch-tees-30pc',
    name: 'Single-Stitch Tees — 30pc Premium',
    description:
      'Hand-picked single-stitch tees from the 80s and early 90s. Strong fade, soft cotton, mostly USA-made. For collectors and boutique vintage stores.',
    brand: 'Mixed',
    vendor_slug: 'istanbul-wholesale',
    category_slug: 'vintage-tees',
    piece_count: 30,
    total_price: 21000,
    original_total_price: null,
    grade: 'AAA',
    grading_breakdown: grading([['AAA', 80], ['AA', 20]]),
    brand_mix: brandMix([['Hanes', 25], ['Screen Stars', 25], ['Anvil', 15], ['Mixed', 35]]),
    size_split: sizeSplit([['M', 30], ['L', 40], ['XL', 25], ['XXL', 5]]),
  },
  {
    slug: 'plain-tees-bulk-150pc',
    name: 'Plain Vintage Tees — 150pc Bulk',
    description:
      'High-volume bundle of plain and lightly-printed vintage tees. Good base inventory for dye/print resellers.',
    brand: 'Mixed',
    vendor_slug: 'lahore-vintage-co',
    category_slug: 'vintage-tees',
    piece_count: 150,
    total_price: 22500,
    original_total_price: 27000,
    grade: 'Grade B',
    grading_breakdown: grading([['A', 25], ['B', 65], ['C', 10]]),
    brand_mix: brandMix([['Hanes', 35], ['Fruit of the Loom', 30], ['Mixed', 35]]),
    size_split: sizeSplit([['S', 20], ['M', 30], ['L', 30], ['XL', 20]]),
  },

  // --- Designer Denim ---
  {
    slug: 'levis-501-vintage-25pc',
    name: 'Levi\'s 501 Vintage — 25pc Bundle',
    description:
      'Mixed-wash 501s. Real vintage cuts (USA-made and early 2000s), washes from raw indigo to heavy fade. Sized for resale across S–XL waist range.',
    brand: 'Levi\'s',
    vendor_slug: 'istanbul-wholesale',
    category_slug: 'designer-denim',
    piece_count: 25,
    total_price: 27500,
    original_total_price: 32500,
    grade: 'Grade A',
    grading_breakdown: grading([['AAA', 30], ['AA', 50], ['A', 20]]),
    brand_mix: brandMix([['Levi\'s 501', 100]]),
    size_split: sizeSplit([['28-30', 20], ['32-34', 50], ['36-38', 25], ['40+', 5]]),
  },
  {
    slug: 'carhartt-denim-30pc',
    name: 'Carhartt Workwear Denim — 30pc',
    description:
      'Carhartt double-knee, dungaree, and B01 cuts. Honest workwear wear and a strong base for repaired/distressed reseller stock.',
    brand: 'Carhartt',
    vendor_slug: 'karachi-threads',
    category_slug: 'designer-denim',
    piece_count: 30,
    total_price: 24000,
    original_total_price: null,
    grade: 'Grade A/B',
    grading_breakdown: grading([['AA', 40], ['A', 50], ['B', 10]]),
    brand_mix: brandMix([['Carhartt', 100]]),
    size_split: sizeSplit([['30-32', 25], ['34-36', 50], ['38-40', 25]]),
  },
  {
    slug: 'mixed-designer-jeans-40pc',
    name: 'Mixed Designer Jeans — 40pc',
    description:
      'Designer denim mix including Diesel, G-Star, and True Religion. Strong Y2K silhouettes — bootcut, low-rise, slight flare.',
    brand: 'Mixed',
    vendor_slug: 'lahore-vintage-co',
    category_slug: 'designer-denim',
    piece_count: 40,
    total_price: 22000,
    original_total_price: 26000,
    grade: 'Grade A',
    grading_breakdown: grading([['AA', 50], ['A', 40], ['B', 10]]),
    brand_mix: brandMix([['Diesel', 30], ['G-Star', 25], ['True Religion', 20], ['Mixed', 25]]),
    size_split: sizeSplit([['28-30', 30], ['32-34', 45], ['36+', 25]]),
  },
  {
    slug: 'wrangler-lee-vintage-50pc',
    name: 'Wrangler & Lee Vintage Denim — 50pc',
    description:
      'American heritage denim. Wrangler 13MWZ and Lee Riders dominate the lot. Vintage washes, USA-made era pieces sprinkled throughout.',
    brand: 'Mixed',
    vendor_slug: 'delhi-bundles',
    category_slug: 'designer-denim',
    piece_count: 50,
    total_price: 30000,
    original_total_price: null,
    grade: 'Grade A',
    grading_breakdown: grading([['AAA', 25], ['AA', 50], ['A', 25]]),
    brand_mix: brandMix([['Wrangler', 50], ['Lee', 50]]),
    size_split: sizeSplit([['30-32', 30], ['34-36', 40], ['38+', 30]]),
  },
  {
    slug: 'baggy-skater-jeans-30pc',
    name: 'Baggy Skater Jeans — 30pc Y2K',
    description:
      'Wide-leg, baggy and skater-cut jeans. JNCO-adjacent silhouettes for the Y2K resale wave.',
    brand: 'Mixed',
    vendor_slug: 'east-london-sourcing',
    category_slug: 'designer-denim',
    piece_count: 30,
    total_price: 25500,
    original_total_price: 30000,
    grade: 'Grade A',
    grading_breakdown: grading([['AA', 60], ['A', 35], ['B', 5]]),
    brand_mix: brandMix([['JNCO', 25], ['Mixed Skater', 75]]),
    size_split: sizeSplit([['30-32', 25], ['34-36', 50], ['38+', 25]]),
  },

  // --- Y2K Streetwear ---
  {
    slug: 'y2k-track-jackets-30pc',
    name: 'Y2K Track Jackets — 30pc',
    description:
      'Tribal-print, two-tone, and shiny nylon Y2K track jackets. Fits the early-2000s aesthetic resale buyers are paying premium for right now.',
    brand: 'Mixed',
    vendor_slug: 'delhi-bundles',
    category_slug: 'y2k-streetwear',
    piece_count: 30,
    total_price: 16500,
    original_total_price: 19500,
    grade: 'Grade A',
    grading_breakdown: grading([['AA', 55], ['A', 40], ['B', 5]]),
    brand_mix: brandMix([['Adidas', 30], ['Nike', 25], ['FUBU', 15], ['Mixed', 30]]),
    size_split: sizeSplit([['S', 20], ['M', 35], ['L', 30], ['XL', 15]]),
  },
  {
    slug: 'velour-tracksuits-20pc',
    name: 'Juicy Velour Tracksuits — 20pc',
    description:
      'Y2K velour tracksuits, mostly pink/black/grey palettes. Tops and bottoms paired where possible.',
    brand: 'Juicy Couture',
    vendor_slug: 'east-london-sourcing',
    category_slug: 'y2k-streetwear',
    piece_count: 20,
    total_price: 24000,
    original_total_price: null,
    grade: 'Premium',
    grading_breakdown: grading([['AAA', 50], ['AA', 40], ['A', 10]]),
    brand_mix: brandMix([['Juicy Couture', 80], ['Mixed', 20]]),
    size_split: sizeSplit([['XS', 10], ['S', 35], ['M', 35], ['L', 20]]),
  },
  {
    slug: 'baby-tees-y2k-50pc',
    name: 'Y2K Baby Tees — 50pc Bundle',
    description:
      'Cropped baby tees with early-2000s graphics — rhinestones, glitter prints, pop-culture motifs. High demand in womenswear resale.',
    brand: 'Mixed',
    vendor_slug: 'lahore-vintage-co',
    category_slug: 'y2k-streetwear',
    piece_count: 50,
    total_price: 11000,
    original_total_price: 13500,
    grade: 'Grade A',
    grading_breakdown: grading([['AA', 50], ['A', 40], ['B', 10]]),
    brand_mix: brandMix([['Mixed', 100]]),
    size_split: sizeSplit([['XS', 25], ['S', 50], ['M', 25]]),
  },
  {
    slug: 'graphic-hoodies-40pc',
    name: 'Graphic Hoodies — 40pc Mixed',
    description:
      'Y2K-leaning hoodies with graphic prints. Heavy on Ecko, FUBU, Sean John, and bootleg licensed prints.',
    brand: 'Mixed',
    vendor_slug: 'delhi-bundles',
    category_slug: 'y2k-streetwear',
    piece_count: 40,
    total_price: 18000,
    original_total_price: 22000,
    grade: 'Grade A/B',
    grading_breakdown: grading([['AA', 30], ['A', 50], ['B', 20]]),
    brand_mix: brandMix([['Ecko', 25], ['FUBU', 20], ['Sean John', 15], ['Mixed', 40]]),
    size_split: sizeSplit([['S', 15], ['M', 35], ['L', 30], ['XL', 20]]),
  },
  {
    slug: 'cargo-pants-y2k-30pc',
    name: 'Y2K Cargo Pants — 30pc',
    description:
      'Multi-pocket cargos in earth tones, blacks, and tonal patterns. Sized for both menswear and unisex resale.',
    brand: 'Mixed',
    vendor_slug: 'karachi-threads',
    category_slug: 'y2k-streetwear',
    piece_count: 30,
    total_price: 15000,
    original_total_price: null,
    grade: 'Grade A',
    grading_breakdown: grading([['AA', 45], ['A', 45], ['B', 10]]),
    brand_mix: brandMix([['Dickies', 30], ['Cargo Mixed', 70]]),
    size_split: sizeSplit([['30-32', 30], ['34-36', 50], ['38+', 20]]),
  },

  // --- Sportswear ---
  {
    slug: 'nike-vintage-tees-50pc',
    name: 'Nike Vintage Tees — 50pc',
    description:
      'Mixed Nike branded tees from late 90s to mid 2000s. Heavy swoosh logos, embroidered centre-chest, and team graphics.',
    brand: 'Nike',
    vendor_slug: 'karachi-threads',
    category_slug: 'sportswear',
    piece_count: 50,
    total_price: 17500,
    original_total_price: 21000,
    grade: 'Grade A',
    grading_breakdown: grading([['AA', 45], ['A', 45], ['B', 10]]),
    brand_mix: brandMix([['Nike', 100]]),
    size_split: sizeSplit([['S', 15], ['M', 35], ['L', 30], ['XL', 20]]),
  },
  {
    slug: 'adidas-trefoil-30pc',
    name: 'Adidas Trefoil Mix — 30pc',
    description:
      'Adidas Originals branded tops — tees, hoodies, and track jackets in mixed wash. Strong centre-chest trefoil branding.',
    brand: 'Adidas',
    vendor_slug: 'istanbul-wholesale',
    category_slug: 'sportswear',
    piece_count: 30,
    total_price: 19500,
    original_total_price: null,
    grade: 'Grade A',
    grading_breakdown: grading([['AAA', 25], ['AA', 50], ['A', 25]]),
    brand_mix: brandMix([['Adidas', 100]]),
    size_split: sizeSplit([['S', 20], ['M', 40], ['L', 30], ['XL', 10]]),
  },
  {
    slug: 'champion-sweats-40pc',
    name: 'Champion Reverse Weave Sweats — 40pc',
    description:
      'Champion crewnecks and hoodies, including reverse-weave classics. Mixed colourways with strong centre-chest scripts.',
    brand: 'Champion',
    vendor_slug: 'delhi-bundles',
    category_slug: 'sportswear',
    piece_count: 40,
    total_price: 24000,
    original_total_price: 28000,
    grade: 'Grade A',
    grading_breakdown: grading([['AA', 50], ['A', 40], ['B', 10]]),
    brand_mix: brandMix([['Champion', 100]]),
    size_split: sizeSplit([['S', 15], ['M', 35], ['L', 35], ['XL', 15]]),
  },
  {
    slug: 'football-jerseys-25pc',
    name: 'Vintage Football Jerseys — 25pc',
    description:
      'Mostly European league jerseys from the 90s and early 2000s. Some retro replicas, some authentic match-spec.',
    brand: 'Mixed',
    vendor_slug: 'east-london-sourcing',
    category_slug: 'sportswear',
    piece_count: 25,
    total_price: 22500,
    original_total_price: null,
    grade: 'Premium',
    grading_breakdown: grading([['AAA', 40], ['AA', 45], ['A', 15]]),
    brand_mix: brandMix([['Umbro', 30], ['Nike', 25], ['Adidas', 25], ['Mixed', 20]]),
    size_split: sizeSplit([['S', 15], ['M', 35], ['L', 35], ['XL', 15]]),
  },
  {
    slug: 'puma-reebok-mix-50pc',
    name: 'Puma & Reebok Mixed — 50pc',
    description:
      'Puma and Reebok branded tracksuits, tees, and hoodies. Strong Y2K/2010s sportswear silhouettes.',
    brand: 'Mixed',
    vendor_slug: 'lahore-vintage-co',
    category_slug: 'sportswear',
    piece_count: 50,
    total_price: 17500,
    original_total_price: 20000,
    grade: 'Grade A/B',
    grading_breakdown: grading([['AA', 35], ['A', 50], ['B', 15]]),
    brand_mix: brandMix([['Puma', 50], ['Reebok', 50]]),
    size_split: sizeSplit([['S', 20], ['M', 35], ['L', 30], ['XL', 15]]),
    status: 'sold_out',
  },

  // --- Luxury Heritage ---
  {
    slug: 'burberry-nova-check-15pc',
    name: 'Burberry Nova Check — 15pc',
    description:
      'Hand-picked Burberry pieces — shirts, scarves, and outerwear featuring the Nova check. Authenticity hand-checked at sourcing.',
    brand: 'Burberry',
    vendor_slug: 'istanbul-wholesale',
    category_slug: 'luxury-heritage',
    piece_count: 15,
    total_price: 45000,
    original_total_price: 52500,
    grade: 'AAA',
    grading_breakdown: grading([['AAA', 80], ['AA', 20]]),
    brand_mix: brandMix([['Burberry', 100]]),
    size_split: sizeSplit([['S', 15], ['M', 40], ['L', 35], ['XL', 10]]),
  },
  {
    slug: 'leather-jackets-20pc',
    name: 'Vintage Leather Jackets — 20pc',
    description:
      'Mostly genuine leather, mixed cuts (biker, bomber, racer). Hand-graded for resale-readiness; small repairs may be required on grade-B pieces.',
    brand: 'Mixed',
    vendor_slug: 'east-london-sourcing',
    category_slug: 'luxury-heritage',
    piece_count: 20,
    total_price: 36000,
    original_total_price: null,
    grade: 'Grade A',
    grading_breakdown: grading([['AA', 50], ['A', 40], ['B', 10]]),
    brand_mix: brandMix([['Schott', 20], ['Wilsons', 20], ['Mixed Leather', 60]]),
    size_split: sizeSplit([['S', 15], ['M', 35], ['L', 35], ['XL', 15]]),
  },
  {
    slug: 'ralph-lauren-polos-50pc',
    name: 'Ralph Lauren Polos — 50pc',
    description:
      'Polo Ralph Lauren shirts in mixed colours. Includes some big-pony and crest-logo variants. Strong reseller volume mover.',
    brand: 'Ralph Lauren',
    vendor_slug: 'karachi-threads',
    category_slug: 'luxury-heritage',
    piece_count: 50,
    total_price: 25000,
    original_total_price: 30000,
    grade: 'Grade A',
    grading_breakdown: grading([['AA', 55], ['A', 35], ['B', 10]]),
    brand_mix: brandMix([['Ralph Lauren', 100]]),
    size_split: sizeSplit([['S', 20], ['M', 35], ['L', 30], ['XL', 15]]),
  },
  {
    slug: 'tommy-hilfiger-30pc',
    name: 'Tommy Hilfiger Mix — 30pc',
    description:
      'Tommy Hilfiger branded tops and outerwear. Heavy on the colour-block flag motif, including 90s and early-2000s cuts.',
    brand: 'Tommy Hilfiger',
    vendor_slug: 'delhi-bundles',
    category_slug: 'luxury-heritage',
    piece_count: 30,
    total_price: 19500,
    original_total_price: 22500,
    grade: 'Grade A',
    grading_breakdown: grading([['AA', 50], ['A', 40], ['B', 10]]),
    brand_mix: brandMix([['Tommy Hilfiger', 100]]),
    size_split: sizeSplit([['S', 15], ['M', 35], ['L', 35], ['XL', 15]]),
  },
  {
    slug: 'cashmere-knitwear-20pc',
    name: 'Cashmere Knitwear — 20pc Premium',
    description:
      'Hand-picked cashmere jumpers and cardigans. Mostly neutral palette. Authenticity and pilling hand-checked.',
    brand: 'Mixed',
    vendor_slug: 'istanbul-wholesale',
    category_slug: 'luxury-heritage',
    piece_count: 20,
    total_price: 38000,
    original_total_price: null,
    grade: 'Premium',
    grading_breakdown: grading([['AAA', 60], ['AA', 35], ['A', 5]]),
    brand_mix: brandMix([['John Smedley', 15], ['Pringle', 15], ['Mixed Cashmere', 70]]),
    size_split: sizeSplit([['S', 20], ['M', 40], ['L', 30], ['XL', 10]]),
  },
]

// ----------------------------------------------------------------------------
// Run
// ----------------------------------------------------------------------------

async function run() {
  console.log('→ wiping existing seed data')
  // Clear in dependency order. cart_items, orders, order_items get cleared by user
  // session lifecycle and aren't seeded here, so leave them.
  await admin.from('products').delete().not('id', 'is', null)
  await admin.from('vendors').delete().not('id', 'is', null)
  await admin.from('categories').delete().not('id', 'is', null)

  console.log(`→ inserting ${categories.length} categories`)
  const { data: catRows, error: catErr } = await admin
    .from('categories')
    .insert(categories)
    .select('id, slug')
  if (catErr) throw catErr

  console.log(`→ inserting ${vendors.length} vendors`)
  const { data: vendorRows, error: vendorErr } = await admin
    .from('vendors')
    .insert(vendors)
    .select('id, slug')
  if (vendorErr) throw vendorErr

  const catIdBySlug = new Map(catRows!.map((r) => [r.slug, r.id]))
  const vendorIdBySlug = new Map(vendorRows!.map((r) => [r.slug, r.id]))

  const productRows = products.map((p) => {
    const vendorId = vendorIdBySlug.get(p.vendor_slug)
    const categoryId = catIdBySlug.get(p.category_slug)
    if (!vendorId) throw new Error(`unknown vendor slug: ${p.vendor_slug}`)
    if (!categoryId) throw new Error(`unknown category slug: ${p.category_slug}`)
    return {
      slug: p.slug,
      name: p.name,
      description: p.description,
      brand: p.brand,
      photos: photosForProduct(p.category_slug, p.slug, 4),
      piece_count: p.piece_count,
      total_price: p.total_price,
      price_per_piece: Math.round(p.total_price / p.piece_count),
      original_total_price: p.original_total_price,
      grade: headlineGrade(p.grading_breakdown),
      grading_breakdown: collapseBreakdown(p.grading_breakdown),
      brand_mix: p.brand_mix,
      size_split: p.size_split,
      status: p.status ?? 'active',
      vendor_id: vendorId,
      category_id: categoryId,
    }
  })

  console.log(`→ inserting ${productRows.length} products`)
  const { error: prodErr } = await admin.from('products').insert(productRows)
  if (prodErr) throw prodErr

  console.log('✓ seed complete')
}

run().catch((err) => {
  console.error('seed failed:', err)
  process.exit(1)
})
