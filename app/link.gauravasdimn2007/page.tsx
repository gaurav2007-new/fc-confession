import { notFound, redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { isAdminAuthenticated, setAdminCookie, clearAdminCookie } from '@/lib/auth'
import AdminDashboardClient from '@/components/AdminDashboardClient'

export const dynamic = 'force-dynamic'

async function loginAction(formData: FormData) {
  'use server'
  const input = formData.get('password') as string
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) throw new Error('ADMIN_PASSWORD not set in .env.local / Vercel')
  if (input !== expected) {
    notFound()
  }
  await setAdminCookie()
  redirect(`/${process.env.ADMIN_ROUTE}`)
}

async function logoutAction() {
  'use server'
  await clearAdminCookie()
  redirect('/')
}

export default async function AdminPage() {
  const isAuth = await isAdminAuthenticated()

  if (!isAuth) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h1 className="text-sm font-semibold">Restricted - FC Admin</h1>
          <p className="mt-1 text-xs text-zinc-500">Enter admin password. Wrong = 404 to hide existence.</p>
          <form action={loginAction} className="mt-4">
            <input name="password" type="password" placeholder="Admin password" className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-sm" required />
            <button type="submit" className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-br from-[#7a1212] to-[#a31a1a] text-white text-sm font-medium">Enter</button>
          </form>
        </div>
      </div>
    )
  }

  // Check env
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return <div className="p-8 text-sm text-red-400">Missing Supabase env - check .env.local and Vercel env vars</div>
  }

  const supabaseAdmin = getSupabaseAdmin()
  const { data: confessions, error } = await supabaseAdmin.from('confessions').select('*').order('created_at', { ascending: false }).limit(200)
  const { data: ipLogs } = await supabaseAdmin.from('ip_logs').select('*').order('created_at', { ascending: false }).limit(200)

  if (error) {
    return <div className="p-8 text-sm text-red-400">Supabase error: {error.message}</div>
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">FC Admin • {confessions?.length || 0} confessions</h1>
        <form action={logoutAction}>
          <button className="px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-xs">Logout</button>
        </form>
      </div>

      <div className="mt-6">
        <AdminDashboardClient initialConfessions={confessions || []} />
      </div>

      <details className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900">
        <summary className="cursor-pointer p-4 text-sm font-semibold">🛡 Security Logs - Secret IP List (Private)</summary>
        <div className="p-4 border-t border-zinc-800 overflow-auto max-h-[400px]">
          <table className="w-full text-xs">
            <thead><tr className="text-zinc-500 text-left"><th className="py-1">Time</th><th>IP</th><th>Trace</th><th>UA</th></tr></thead>
            <tbody>
              {ipLogs?.map((log: any) => (
                <tr key={log.id} className="border-t border-zinc-800/50"><td className="py-1.5 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td><td className="font-mono">{log.ip_address}</td><td className="font-mono">{log.trace_code}</td><td className="max-w-[300px] truncate">{log.user_agent}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
