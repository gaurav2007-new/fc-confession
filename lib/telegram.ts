function getEnv(name: string): string {
  return (process.env[name] || '').trim()
}

function getBase(): string {
  const token = getEnv('TELEGRAM_BOT_TOKEN')
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN missing - set in .env.local and Vercel')
  return `https://api.telegram.org/bot${token}`
}

type InlineKeyboard = {
  inline_keyboard: { text: string; callback_data: string }[][]
}

export async function sendToAdmin(text: string, keyboard?: InlineKeyboard) {
  try {
    const adminId = getEnv('TELEGRAM_ADMIN_ID')
    if (!adminId) {
      console.error('sendToAdmin: TELEGRAM_ADMIN_ID missing')
      return { ok: false }
    }
    const res = await fetch(`${getBase()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminId,
        text,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      }),
    })
    const json = await res.json()
    if (!json.ok) console.error('sendToAdmin failed', JSON.stringify(json))
    else console.log('sendToAdmin success ->', adminId)
    return json
  } catch (e) {
    console.error('sendToAdmin error', e)
    return { ok: false, error: e }
  }
}

export async function postToChannel(text: string): Promise<number | null> {
  try {
    const channel = getEnv('PUBLIC_CHANNEL_ID')
    if (!channel) {
      console.error('postToChannel: PUBLIC_CHANNEL_ID missing')
      return null
    }
    console.log(`Attempting postToChannel to ${channel} - length ${text.length}`)
    const res = await fetch(`${getBase()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channel, // can be @username or -100xxx
        text,
        parse_mode: 'HTML',
      }),
    })
    const json = await res.json()
    if (json.ok) {
      console.log('postToChannel success message_id:', json.result.message_id)
      return json.result.message_id as number
    }
    console.error('postToChannel failed - Telegram API returned:', JSON.stringify(json))
    // Common reasons: bot not admin, wrong channel ID, channel private
    return null
  } catch (e) {
    console.error('postToChannel error - network/exception', e)
    return null
  }
}

export async function deleteFromChannel(message_id: number) {
  try {
    const channel = getEnv('PUBLIC_CHANNEL_ID')
    console.log(`Attempting deleteFromChannel ${channel} msg ${message_id}`)
    const res = await fetch(`${getBase()}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channel,
        message_id,
      }),
    })
    const json = await res.json()
    if (!json.ok) console.error('deleteFromChannel failed', json)
    return json
  } catch (e) {
    console.error('deleteFromChannel error', e)
    return { ok: false }
  }
}

export async function answerCallback(id: string, text: string) {
  try {
    await fetch(`${getBase()}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: id, text, show_alert: false }),
    })
  } catch {}
}

export function buildPublicMessage(content: string, category: string, shortTrace: string, showTime: boolean, createdAt: Date | string): string {
  let msg = `fc-confessio\n${content}\n\n#${category.toLowerCase()} | ${shortTrace}`
  if (showTime) {
    const d = new Date(createdAt)
    const formatted = d.toLocaleString('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }) + ' IST'
    msg += `\n🕒 ${formatted}`
  }
  return msg
}
