import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { generateTraceCode } from '@/lib/utils'

function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}
function getIP(req: NextRequest) {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

export async function POST(req: NextRequest) {
  try {
    const { content, category, dailyKey, showTime } = await req.json()
    if (!content || content.length < 10 || content.length > 500) return NextResponse.json({ error: 'Content must be 10-500 chars' }, { status: 400 })
    if (!['Crush','Rant','Academic','Other'].includes(category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    if (!dailyKey) return NextResponse.json({ error: 'Daily key required' }, { status: 400 })

    const today = todayIST()
    const supabaseAdmin = getSupabaseAdmin()
    const { data: keyRow } = await supabaseAdmin.from('daily_keys').select('key').eq('date', today).single()
    const validKey = keyRow?.key || 'FC2026'
    if (dailyKey !== validKey) return NextResponse.json({ error: 'Invalid daily key' }, { status: 401 })

    const ip = getIP(req)
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
    const { data: recent } = await supabaseAdmin.from('ip_logs').select('id').eq('ip_address', ip).gt('created_at', twoMinAgo).limit(1)
    if (recent && recent.length > 0) return NextResponse.json({ error: 'Wait 2 mins before posting again' }, { status: 429 })

    const trace_code = await generateTraceCode(supabaseAdmin)

    const { data: confession, error: insertErr } = await supabaseAdmin.from('confessions').insert({
      trace_code, content, category, status: 'pending', show_time: !!showTime,
    }).select().single()

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    await supabaseAdmin.from('ip_logs').insert({
      ip_address: ip, confession_id: confession.id, trace_code, user_agent: req.headers.get('user-agent') || ''
    })

    try {
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : req.nextUrl.origin
      await fetch(`${baseUrl}/api/notify-admin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confessionId: confession.id })
      })
    } catch (e) { console.error('notify failed', e) }

    return NextResponse.json({ trace_code })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
