import express, { type Response } from 'express'
import { type SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { requireAuth, type AuthedRequest } from '../middleware/auth'

interface AuthBody {
  email?: string
  password?: string
}

const router = express.Router()

const getSupabaseClient = (res: Response): SupabaseClient | null => {
  if (supabase) {
    return supabase
  }

  res.status(503).json({
    error: 'Auth is unavailable. Configure SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env.',
  })
  return null
}

router.post('/signup', async (req, res) => {
  const supabaseClient = getSupabaseClient(res)
  if (!supabaseClient) {
    return
  }

  const { email, password } = (req.body || {}) as AuthBody

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required.',
    })
  }

  const { data, error } = await supabaseClient.auth.signUp({ email, password })

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.status(201).json({
    user: data.user,
    session: data.session,
  })
})

router.post('/login', async (req, res) => {
  const supabaseClient = getSupabaseClient(res)
  if (!supabaseClient) {
    return
  }

  const { email, password } = (req.body || {}) as AuthBody

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required.',
    })
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password })

  if (error) {
    return res.status(401).json({ error: error.message })
  }

  return res.status(200).json({
    user: data.user,
    session: data.session,
  })
})

router.post('/logout', requireAuth, async (req, res) => {
  const { error } = await (req as AuthedRequest).supa.auth.signOut()
  if (error) {
    return res.status(400).json({ error: error.message })
  }
  return res.status(200).json({ success: true })
})

export default router
