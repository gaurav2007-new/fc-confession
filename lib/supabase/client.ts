import { createClient } from '@supabase/supabase-js'

let cachedAnon: ReturnType<typeof createClient> | null = null

export function getSupabaseAnon() {
  if (cachedAnon) return cachedAnon

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

  if (!url || !anon) {
    throw new Error('Supabase env missing - NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set')
  }

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
  } catch {
    throw new Error(`Invalid supabaseUrl: "${url}"`)
  }

  cachedAnon = createClient(url, anon)
  return cachedAnon
}
