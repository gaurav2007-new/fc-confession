function randomChunk(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export async function generateTraceCode(supabaseAdmin: any): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = `FC-${randomChunk(3)}-${randomChunk(4)}`
    const { data } = await supabaseAdmin.from('confessions').select('id').eq('trace_code', code).limit(1)
    if (!data || data.length === 0) return code
  }
  return `FC-${randomChunk(3)}-${randomChunk(4)}`
}

export function formatShortTrace(code: string): string {
  if (!code) return 'FC-XXX-XXXX'
  return `FC-XXX-${code.slice(-4)}`
}

export function formatAbsoluteTime(dateStr: string | Date): string {
  const d = new Date(dateStr)
  return d.toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' IST'
}

export function getTodayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}
