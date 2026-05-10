import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../config/env'

export const supabaseAdmin: SupabaseClient | null =
  env.supabaseUrl && env.supabaseServiceRoleKey
    ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null
