import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.from('confessions').select('*').eq('trace_code', code).single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ confession: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { trace_code, confession_id } = await req.json()
    if (!trace_code) return NextResponse.json({ error: 'trace_code required' }, { status: 400 })
    const supabaseAdmin = getSupabaseAdmin()
    let query = supabaseAdmin.from('confessions').select('*').eq('trace_code', trace_code)
    if (confession_id) query = query.eq('id', confession_id)
    const { data: confession, error } = await query.single()
    if (error || !confession) return NextResponse.json({ error: 'Invalid trace code' }, { status: 404 })

    if (confession.telegram_message_id) {
      const token = process.env.TELEGRAM_BOT_TOKEN
      const channel = process.env.PUBLIC_CHANNEL_ID
      if (token && channel) {
        await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: channel, message_id: confession.telegram_message_id })
        }).catch(() => {})
      }
    }

    await supabaseAdmin.from('confessions').delete().eq('id', confession.id)
    return NextResponse.json({ message: 'Deleted' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
