import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { postToChannel, deleteFromChannel, answerCallback } from '@/lib/telegram'
import { formatShortTrace } from '@/lib/utils'

function formatPublicMessage(content: string, category: string, fullCode: string, showTime: boolean, createdAt: string) {
  const short = formatShortTrace(fullCode)
  let msg = `fc-confessio\n${content}\n\n#${category.toLowerCase()} | ${short}`
  if (showTime) {
    const d = new Date(createdAt)
    const formatted = d.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) + ' IST'
    msg += `\n🕒 ${formatted}`
  }
  return msg
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.channel_post || body.edited_channel_post) {
      return NextResponse.json({ ok: true, ignored: 'channel_post' })
    }

    if (body.callback_query) {
      const cb = body.callback_query
      const data: string = cb.data || ''
      const firstUnderscore = data.indexOf('_')
      const act = data.slice(0, firstUnderscore)
      const confId = data.slice(firstUnderscore + 1)

      if (!confId) {
        await answerCallback(cb.id, 'Invalid')
        return NextResponse.json({ ok: true })
      }

      const supabaseAdmin = getSupabaseAdmin()
      const { data: confession } = await supabaseAdmin.from('confessions').select('*').eq('id', confId).single()
      if (!confession) {
        await answerCallback(cb.id, 'Not found')
        return NextResponse.json({ ok: true })
      }

      if (act === 'approve') {
        if (confession.status === 'approved') {
          await answerCallback(cb.id, 'Already approved')
          return NextResponse.json({ ok: true })
        }
        const msg = formatPublicMessage(confession.content, confession.category, confession.trace_code, confession.show_time, confession.created_at)
        console.log(`[webhook] approve ${confId} attempting postToChannel`)
        const message_id = await postToChannel(msg)
        
        if (!message_id) {
          console.error('[webhook] postToChannel failed, but approving in DB anyway')
          await supabaseAdmin.from('confessions').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', confId)
          await answerCallback(cb.id, 'Approved in DB but Telegram post failed - check channel')
          return NextResponse.json({ ok: true, warning: 'telegram_failed' })
        }

        console.log(`[webhook] Supabase update with message_id: ${message_id}`)
        const { error } = await supabaseAdmin.from('confessions').update({ status: 'approved', approved_at: new Date().toISOString(), telegram_message_id: message_id }).eq('id', confId)
        if (error) console.error('Supabase update failed:', error)
        else console.log('Supabase update success')
        await answerCallback(cb.id, error ? `DB fail: ${error.message}` : 'Approved & Published!')
        return NextResponse.json({ ok: true })
      }

      if (act === 'reject') {
        await supabaseAdmin.from('confessions').update({ status: 'rejected' }).eq('id', confId)
        await answerCallback(cb.id, 'Rejected')
        return NextResponse.json({ ok: true })
      }

      if (act === 'delete') {
        if (confession.telegram_message_id) await deleteFromChannel(confession.telegram_message_id)
        await supabaseAdmin.from('confessions').delete().eq('id', confId)
        await answerCallback(cb.id, 'Deleted')
        return NextResponse.json({ ok: true })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('webhook error', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
