'use client'
import { useState } from 'react'

export default function TrackPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function track() {
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch(`/api/track?code=${encodeURIComponent(code)}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Not found'); setLoading(false); return }
      setData(json.confession)
    } catch { setError('Network error') }
    setLoading(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this confession?')) return
    setDeleting(true)
    try {
      const res = await fetch('/api/track', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trace_code: code }) })
      const json = await res.json()
      if (!res.ok) { setError(json.error); setDeleting(false); return }
      setData(null); setCode(''); alert('Deleted')
    } catch { setError('Network error') }
    setDeleting(false)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Track / Delete</h1>
      <p className="mt-2 text-sm text-zinc-400">Enter full trace code FC-XXX-XXXX</p>
      <div className="mt-6 flex gap-2">
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="FC-XXX-XXXX" className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm font-mono" />
        <button onClick={track} disabled={loading || !code} className="px-5 py-3 rounded-xl bg-gradient-to-br from-[#7a1212] to-[#a31a1a] text-white text-sm font-medium disabled:opacity-50">{loading ? '...' : 'Track'}</button>
      </div>
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      {data && (
        <div className="mt-6 rounded-[16px] border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex justify-between items-center">
            <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[11px]">#{data.category}</span>
            <span className={`px-2.5 py-1 rounded-full text-[11px] ${data.status==='pending' ? 'bg-yellow-500/10 text-yellow-400' : data.status==='approved' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{data.status}</span>
          </div>
          <p className="mt-4 text-[15px] whitespace-pre-wrap">{data.content}</p>
          {data.status==='pending' && <button onClick={handleDelete} disabled={deleting} className="mt-5 w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm disabled:opacity-50">{deleting ? 'Deleting...' : 'Delete'}</button>}
        </div>
      )}
    </div>
  )
}
