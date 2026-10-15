import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json()
    if (!key) return NextResponse.json({ valid: false, error: 'Key required' }, { status: 400 })
    const today = todayIST()
    const supabaseAdmin = getSupabaseAdmin()

    const { data: existing } = await supabaseAdmin.from('daily_keys').select('*').eq('date', today).single()
    let validKey = existing?.key
    if (!existing) {
      const { data } = await supabaseAdmin.from('daily_keys').insert({ date: today, key: 'FC2026' }).select().single()
      validKey = data?.key || 'FC2026'
    }

    return NextResponse.json({ valid: key === validKey })
  } catch (e: any) {
    return NextResponse.json({ valid: false, error: e.message }, { status: 500 })
  }
}
