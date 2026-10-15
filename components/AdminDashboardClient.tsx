'use client'
import { useState } from 'react'

type Confession = {
  id: string
  trace_code: string
  content: string
  category: string
  status: string
  show_time: boolean
  created_at: string
  telegram_message_id?: number
}

export default function AdminDashboardClient({ initialConfessions }: { initialConfessions: Confession[] }) {
  const [confessions, setConfessions] = useState<Confession[]>(initialConfessions)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all'|'pending'|'approved'|'rejected'>('all')

  const filtered = confessions.filter(c => filter==='all' ? true : c.status===filter)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function action(id: string, act: 'approve'|'reject'|'delete') {
    if (!confirm(`${act} this confession?`)) return
    setLoadingId(id)
    try {
      const res = await fetch('/api/admin-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: act })
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Failed'); setLoadingId(null); return }
      showToast(data.message || 'Done')
      if (act==='delete') {
        setConfessions(prev => prev.filter(c => c.id!==id))
      } else {
        setConfessions(prev => prev.map(c => c.id===id ? { ...c, status: act==='approve' ? 'approved' : 'rejected' } : c))
      }
    } catch (e:any) {
      showToast(e.message)
    }
    setLoadingId(null)
  }

  return (
    <div>
      {toast && <div className="fixed bottom-4 right-4 z-50 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl text-sm shadow-xl">{toast}</div>}
      <div className="flex gap-2 mb-6">
        {(['all','pending','approved','rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-full text-xs border capitalize ${filter===f ? 'bg-zinc-100 text-black border-zinc-100' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>{f}</button>
        ))}
      </div>
      <div className="grid gap-3">
        {filtered.length===0 && <p className="text-sm text-zinc-500 text-center py-10">No confessions in {filter}</p>}
        {filtered.map(c => (
          <div key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
            <div className="flex flex-wrap gap-2 justify-between">
              <div className="flex gap-2 items-center">
                <span className="font-mono text-xs bg-zinc-950 border border-zinc-800 px-2 py-1 rounded">{c.trace_code}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800">{c.category}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${c.status==='pending' ? 'bg-yellow-500/10 text-yellow-400' : c.status==='approved' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{c.status}</span>
                {c.show_time && <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">show_time</span>}
              </div>
              <span className="text-[11px] text-zinc-500">{new Date(c.created_at).toLocaleString()} • msg:{c.telegram_message_id || '-'}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed">{c.content}</p>
            <div className="mt-3 flex gap-2">
              <button disabled={loadingId===c.id} onClick={() => action(c.id,'approve')} className="px-3 py-1.5 rounded-full bg-green-600 hover:bg-green-500 text-white text-xs disabled:opacity-50">{loadingId===c.id ? '...' : 'Approve ✅'}</button>
              <button disabled={loadingId===c.id} onClick={() => action(c.id,'reject')} className="px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs disabled:opacity-50">Reject ❌</button>
              <button disabled={loadingId===c.id} onClick={() => action(c.id,'delete')} className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs disabled:opacity-50">Delete 🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
