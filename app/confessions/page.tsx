'use client'
import { useEffect, useState } from 'react'
import { getSupabaseAnon } from '@/lib/supabase/client'

function shortTrace(code: string) { return `FC-XXX-${code?.slice(-4) || 'XXXX'}` }
function formatAbsolute(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) + ' IST'
}

export default function ConfessionsPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<any>(null)
  const [deleteCode, setDeleteCode] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function fetchFeed() {
    setLoading(true)
    try {
      const supabase = getSupabaseAnon()
      const { data } = await supabase.from('confessions').select('*').eq('status','approved').order('created_at', { ascending: false }).limit(100)
      setList(data || [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { fetchFeed() }, [])

  async function handleDelete() {
    setDeleteLoading(true); setDeleteError('')
    try {
      const res = await fetch('/api/track', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trace_code: deleteCode, confession_id: deleteModal.id }) })
      const data = await res.json()
      if (!res.ok) { setDeleteError(data.error || 'Invalid code'); setDeleteLoading(false); return }
      setList(prev => prev.filter(c => c.id !== deleteModal.id))
      setDeleteModal(null); setDeleteCode('')
    } catch { setDeleteError('Network error') }
    setDeleteLoading(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Public Feed</h1>
        <span className="text-xs text-zinc-500">{list.length} approved</span>
      </div>
      {loading ? <div className="py-16 text-center text-zinc-500 text-sm">Loading...</div> :
       list.length===0 ? <div className="py-16 text-center rounded-xl border border-zinc-800 bg-zinc-900"><p className="text-sm text-zinc-400">No confessions yet.</p></div> :
       <div className="space-y-3">
         {list.map(c => (
           <div key={c.id} className="rounded-[16px] border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5 hover:border-zinc-700 transition">
             <div className="flex items-start justify-between gap-3">
               <span className="inline-flex px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[11px]">#{c.category?.toLowerCase()}</span>
               <span className="font-mono text-[11px] text-zinc-500"><span className="blur-[3px] hover:blur-0 transition-all cursor-pointer">{shortTrace(c.trace_code)}</span></span>
             </div>
             <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words">{c.content}</p>
             <div className="mt-4 flex items-center justify-between">
               <div className="text-[11px] text-zinc-500">{c.show_time ? formatAbsolute(c.created_at) : ''}</div>
               <button onClick={() => setDeleteModal(c)} className="h-7 w-7 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center">🗑</button>
             </div>
           </div>
         ))}
       </div>}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="font-semibold text-sm">Delete confession?</h3>
            <p className="mt-1 text-xs text-zinc-400">Enter full trace code to delete {shortTrace(deleteModal.trace_code)}</p>
            <input value={deleteCode} onChange={e => setDeleteCode(e.target.value)} placeholder="FC-XXX-XXXX" className="mt-4 w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm font-mono" />
            {deleteError && <p className="mt-2 text-xs text-red-400">{deleteError}</p>}
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => { setDeleteModal(null); setDeleteCode('') }} className="px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-xs">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading || !deleteCode} className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs disabled:opacity-50">{deleteLoading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
