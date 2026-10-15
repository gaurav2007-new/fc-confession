import { createClient } from '@supabase/supabase-js'

let cachedAdmin: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (cachedAdmin) return cachedAdmin

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const service = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

  if (!url || !service) {
    throw new Error(
      'Supabase admin env missing - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. ' +
      'Check .env.local and Vercel > Settings > Env Variables (tick Production + Preview + Development). ' +
      `Got url=${!!url} service=${!!service}`
    )
  }

  // Validate URL format to avoid Next.js build error "Invalid supabaseUrl"
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
  } catch {
    throw new Error(`Invalid supabaseUrl: "${url}" - Must be a valid HTTP or HTTPS URL like https://xxx.supabase.co`)
  }

  cachedAdmin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  return cachedAdmin
}

// DO NOT call getSupabaseAdmin() at top-level - it breaks Vercel build when env missing
