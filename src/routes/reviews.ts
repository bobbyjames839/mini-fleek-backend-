import express from 'express'
import { supabase } from '../lib/supabase'

const router = express.Router()

interface ReviewRow {
  id: string
  reviewer_name: string
  rating: number
  title: string | null
  body: string
  created_at: string
}

function unavailable(res: express.Response) {
  return res.status(503).json({
    error: 'Database is unavailable. Configure SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env.',
  })
}

router.get('/reviews', async (_req, res) => {
  if (!supabase) return unavailable(res)

  const { data, error } = await supabase
    .from('reviews')
    .select('id, reviewer_name, rating, title, body, created_at')
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })

  const reviews = (data ?? []) as ReviewRow[]
  const count = reviews.length
  const average_rating =
    count === 0
      ? null
      : Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10

  return res.json({ reviews, summary: { count, average_rating } })
})

export default router
