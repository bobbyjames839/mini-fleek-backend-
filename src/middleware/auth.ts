import type { NextFunction, Request, Response } from 'express'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { env } from '../config/env'

export interface AuthedRequest extends Request {
  user: { id: string; email?: string }
  supa: SupabaseClient
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!supabase) {
    return res.status(503).json({
      error: 'Auth is unavailable. Configure SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env.',
    })
  }

  const authHeader = req.header('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Missing bearer token.' })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return res.status(401).json({ error: 'Invalid or expired token.' })

  const scoped = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  ;(req as AuthedRequest).user = { id: data.user.id, email: data.user.email }
  ;(req as AuthedRequest).supa = scoped
  next()
}
