import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { postToChannel, deleteFromChannel } from '@/lib/telegram'
import { formatShortTrace } from '@/lib/utils'
import { requireAdmin } from '@/lib/auth'

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
    await requireAdmin()
    const { id, action } = await req.json()
    if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 })

    console.log(`[admin-action] ${action} request for id=${id}`)

    const supabaseAdmin = getSupabaseAdmin() as any
    const { data: confession, error } = await supabaseAdmin.from('confessions').select('*').eq('id', id).single()

    if (error || !confession) {
      console.error('[admin-action] confession not found', error)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    console.log(`[admin-action] found confession status=${confession.status} trace=${confession.trace_code}`)

    if (action === 'approve') {
      if (confession.status === 'approved') {
        return NextResponse.json({ message: 'Already approved', already: true })
      }

      const message = formatPublicMessage(confession.content, confession.category, confession.trace_code, confession.show_time, confession.created_at)
      const message_id = await postToChannel(message)

      if (!message_id) {
        console.log('Attempting Supabase update with message_id: null (Telegram failed but approving anyway)')
        const { error: updateError } = await supabaseAdmin.from('confessions').update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          telegram_message_id: null,
        } as any).eq('id', id)

        if (updateError) {
          console.error('Supabase update failed:', updateError)
          return NextResponse.json({ error: `Telegram failed and DB update failed: ${updateError.message}` }, { status: 500 })
        }
        console.log('Supabase update success')
        return NextResponse.json({ message: 'Approved in DB but Telegram post failed - check PUBLIC_CHANNEL_ID and bot is admin', warning: true, message_id: null })
      }

      console.log(`Attempting Supabase update with message_id: ${message_id}`)
      const { error: updateError } = await supabaseAdmin.from('confessions').update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        telegram_message_id: message_id,
      } as any).eq('id', id)

      if (updateError) {
        console.error('Supabase update failed:', updateError)
        return NextResponse.json({ error: `Telegram posted (${message_id}) but Supabase update failed: ${updateError.message}` }, { status: 500 })
      }
      console.log('Supabase update success')
      return NextResponse.json({ message: 'Approved & Published', message_id })
    }

    if (action === 'reject') {
      const { error: updateError } = await supabaseAdmin.from('confessions').update({ status: 'rejected' } as any).eq('id', id)
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
      return NextResponse.json({ message: 'Rejected' })
    }

    if (action === 'delete') {
      if (confession.telegram_message_id) {
        await deleteFromChannel(confession.telegram_message_id)
      }
      const { error: delError } = await supabaseAdmin.from('confessions').delete().eq('id', id)
      if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })
      return NextResponse.json({ message: 'Deleted' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    console.error('admin-action error', e)
    if (e.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized - login via admin route' }, { status: 401 })
    }
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
