import dotenv from 'dotenv'

dotenv.config()

const missingSupabaseEnv = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'].filter(
  (key) => !process.env[key],
)

if (missingSupabaseEnv.length > 0) {
  console.warn(
    `Supabase env vars missing: ${missingSupabaseEnv.join(', ')}. Auth endpoints will return 503 until configured.`,
  )
}

export const env = {
  port: Number(process.env.PORT || 4000),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseConfigured: missingSupabaseEnv.length === 0,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
}
