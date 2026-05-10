export const PRODUCT_SUMMARY_SELECT = `
  id, name, slug, brand, photos, piece_count, total_price, price_per_piece,
  original_total_price, status,
  vendor:vendors!inner(id, name, slug),
  category:categories!inner(id, name, slug)
`

export interface ProductRow {
  id: string
  name: string
  slug: string
  description?: string | null
  brand: string
  photos: string[] | null
  piece_count: number
  total_price: number
  price_per_piece: number
  original_total_price: number | null
  status: 'active' | 'sold_out'
  grade?: string | null
  grading_breakdown?: unknown
  brand_mix?: unknown
  size_split?: unknown
  vendor: {
    id: string
    name: string
    slug: string
    country?: string
    rating?: number
    about?: string | null
  } | null
  category: { id: string; name: string; slug: string } | null
}

export function discountPct(total: number, original: number | null): number | null {
  if (!original || original <= total) return null
  return Math.round((1 - total / original) * 100)
}

export function mapProductSummary(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    primary_photo: row.photos?.[0] ?? null,
    piece_count: row.piece_count,
    total_price: row.total_price,
    price_per_piece: row.price_per_piece,
    original_total_price: row.original_total_price,
    discount_pct: discountPct(row.total_price, row.original_total_price),
    status: row.status,
    vendor: row.vendor,
    category: row.category,
  }
}
