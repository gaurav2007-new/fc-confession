import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { postToChannel, deleteFromChannel } from '@/lib/telegram'
import { formatShortTrace } from '@/lib/utils'
import { requireAdmin } from '@/lib/auth'

function formatPublicMessage(
  content: string,
  category: string,
  fullCode: string,
  showTime: boolean,
  createdAt: string
) {
  const short = formatShortTrace(fullCode)

  let msg = `fc-confessio\n${content}\n\n#${category.toLowerCase()} | ${short}`

  if (showTime) {
    const d = new Date(createdAt)
    const formatted =
      d.toLocaleString('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) + ' IST'

    msg += `\n🕒 ${formatted}`
  }

  return msg
}

type Confession = {
  id: string
  content: string
  category: string
  trace_code: string
  status: string
  show_time: boolean
  created_at: string
  telegram_message_id: number | null
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const { id, action } = await req.json()

    if (!id || !action) {
      return NextResponse.json(
        { error: 'id and action required' },
        { status: 400 }
      )
    }

    console.log(`[admin-action] ${action} request for id=${id}`)

    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('confessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('[admin-action] confession not found', error)

      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      )
    }

    const confession = data as Confession

    console.log(
      `[admin-action] found confession status=${confession.status} trace=${confession.trace_code}`
    )

    if (action === 'approve') {
      if (confession.status === 'approved') {
        console.log('[admin-action] already approved')

        return NextResponse.json({
          message: 'Already approved',
          already: true,
        })
      }

      const message = formatPublicMessage(
        confession.content,
        confession.category,
        confession.trace_code,
        confession.show_time,
        confession.created_at
      )

      console.log('[admin-action] Attempting postToChannel...')

      const message_id = await postToChannel(message)

      if (!message_id) {
        console.error(
          '[admin-action] postToChannel returned null - will still approve in DB to avoid pending stuck'
        )

        const { error: updateError } = await supabaseAdmin
          .from('confessions')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            telegram_message_id: null,
          })
          .eq('id', id)

        if (updateError) {
          console.error('Supabase update failed:', updateError)

          return NextResponse.json(
            {
              error: `Telegram failed and DB update failed: ${updateError.message}`,
            },
            { status: 500 }
          )
        }

        return NextResponse.json({
          message:
            'Approved in DB but Telegram post failed - check PUBLIC_CHANNEL_ID and bot is admin in channel',
          warning: true,
          message_id: null,
        })
      }

      const { error: updateError } = await supabaseAdmin
        .from('confessions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          telegram_message_id: message_id,
        })
        .eq('id', id)

      if (updateError) {
        console.error('Supabase update failed:', updateError)

        return NextResponse.json(
          {
            error: `Telegram posted (${message_id}) but Supabase update failed: ${updateError.message}`,
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Approved & Published',
        message_id,
      })
    }

    if (action === 'reject') {
      const { error: updateError } = await supabaseAdmin
        .from('confessions')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'Rejected' })
    }

    if (action === 'delete') {
      if (confession.telegram_message_id) {
        await deleteFromChannel(confession.telegram_message_id)
      }

      const { error: delError } = await supabaseAdmin
        .from('confessions')
        .delete()
        .eq('id', id)

      if (delError) {
        return NextResponse.json(
          { error: delError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: 'Deleted' })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (e: any) {
    console.error('admin-action error', e)

    if (e?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized - login via admin route' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}