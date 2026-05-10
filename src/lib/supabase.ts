import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../config/env'

export const supabase: SupabaseClient | null = env.supabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null
