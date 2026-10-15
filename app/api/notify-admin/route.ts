import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendToAdmin } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const { confessionId } = await req.json()
    if (!confessionId) return NextResponse.json({ error: 'confessionId required' }, { status: 400 })
    const supabaseAdmin = getSupabaseAdmin()
    const { data: confession } = await supabaseAdmin.from('confessions').select('*').eq('id', confessionId).single()
    if (!confession) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const text = `🚨 <b>NEW CONFESSION PENDING</b>\n\n<b>Code:</b> <code>${confession.trace_code}</code>\n<b>Category:</b> ${confession.category}\n<b>Show Time:</b> ${confession.show_time ? 'Yes' : 'No'}\n<b>Content:</b>\n${confession.content}\n\nIP Logged`
    const keyboard = {
      inline_keyboard: [
        [{ text: '✅ Approve', callback_data: `approve_${confession.id}` }, { text: '❌ Reject', callback_data: `reject_${confession.id}` }],
        [{ text: '🗑 Delete', callback_data: `delete_${confession.id}` }]
      ]
    }

    await sendToAdmin(text, keyboard)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
