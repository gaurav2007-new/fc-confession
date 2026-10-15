'use client'
import { useState } from 'react'

export default function HomePage() {
  const [key, setKey] = useState('')
  const [keyValid, setKeyValid] = useState(false)
  const [keyLoading, setKeyLoading] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Crush')
  const [showTime, setShowTime] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ trace_code: string } | null>(null)
  const [error, setError] = useState('')

  async function validateKey() {
    setKeyLoading(true); setKeyError('')
    try {
      const res = await fetch('/api/check-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) })
      const data = await res.json()
      if (data.valid) setKeyValid(true)
      else setKeyError('Invalid daily key. Try FC2026')
    } catch { setKeyError('Failed to validate') }
    setKeyLoading(false)
  }

  async function submitConfession() {
    setSubmitting(true); setError('')
    if (content.length < 10 || content.length > 500) { setError('Content must be 10-500 chars'); setSubmitting(false); return }
    try {
      const res = await fetch('/api/confess', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category, dailyKey: key, showTime })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); setSubmitting(false); return }
      setResult(data)
    } catch { setError('Network error') }
    setSubmitting(false)
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-[20px] border border-zinc-800 bg-zinc-900 p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-2xl mb-4">✓</div>
          <h2 className="text-2xl font-semibold">Saved!</h2>
          <p className="mt-2 text-zinc-400 text-sm">Your trace code - save it securely. Shown only once.</p>
          <div className="mt-6 p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-lg tracking-wider select-all">{result.trace_code}</div>
          <p className="mt-3 text-xs text-zinc-500">Track/delete at <a href="/track" className="underline text-zinc-300">/track</a></p>
          <div className="mt-8 flex justify-center gap-3">
            <a href="/confessions" className="px-5 py-2.5 rounded-full bg-gradient-to-br from-[#7a1212] to-[#a31a1a] text-white text-sm font-medium">View Feed</a>
            <a href="/" onClick={() => { setResult(null); setContent('') }} className="px-5 py-2.5 rounded-full bg-zinc-800 border border-zinc-700 text-sm">Submit Another</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] tracking-widest text-zinc-400 mb-4">FERGUSSON COLLEGE • PUNE • EST 1885</div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">FC Confessions</h1>
        <p className="mt-3 text-zinc-400 max-w-xl mx-auto text-sm">Anonymous, secure, minimal. Your crush, rant, academic stress — say it without revealing yourself.</p>
      </div>

      <div className="rounded-[20px] border border-zinc-800 bg-zinc-900/60 backdrop-blur p-5 sm:p-7">
        <div className="flex items-center gap-3 mb-6">
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${keyValid ? 'bg-green-500 text-black' : 'bg-zinc-800 border border-zinc-700'}`}>{keyValid ? '✓' : '1'}</div>
          <h3 className="font-semibold">Daily Key Verification</h3>
        </div>
        <div className="flex gap-2">
          <input value={key} onChange={e => setKey(e.target.value)} placeholder="Enter today's key (e.g. FC2026)" className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:border-zinc-600" />
          <button onClick={validateKey} disabled={keyLoading || !key} className="px-5 py-3 rounded-xl bg-gradient-to-br from-[#7a1212] to-[#a31a1a] text-white text-sm font-medium disabled:opacity-50">{keyLoading ? '...' : 'Validate'}</button>
        </div>
        {keyError && <p className="mt-2 text-xs text-red-400">{keyError}</p>}
        {keyValid && <p className="mt-2 text-xs text-green-400">Key valid ✓ You can now post.</p>}

        {keyValid && (
          <>
            <div className="my-7 h-px bg-zinc-800" />
            <div className="flex items-center gap-3 mb-6">
              <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold">2</div>
              <h3 className="font-semibold">Your Confession</h3>
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Write anonymously..." className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm focus:outline-none focus:border-zinc-600 resize-none" />
            <div className="mt-2 flex justify-between text-[11px] text-zinc-500"><span>Min 10 chars</span><span>{content.length}/500</span></div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm">
                  <option>Crush</option><option>Rant</option><option>Academic</option><option>Other</option>
                </select>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3">
                <div><p className="text-sm font-medium">Show time on feed</p><p className="text-[11px] text-zinc-500">Display post date publicly</p></div>
                <button onClick={() => setShowTime(!showTime)} className={`h-6 w-11 rounded-full transition flex items-center px-0.5 ${showTime ? 'bg-[#7a1212]' : 'bg-zinc-800'}`}><div className={`h-5 w-5 rounded-full bg-white transition-all ${showTime ? 'translate-x-5' : 'translate-x-0'}`} /></button>
              </div>
            </div>
            {error && <p className="mt-4 text-xs text-red-400">{error}</p>}
            <button onClick={submitConfession} disabled={submitting} className="mt-6 w-full py-3 rounded-xl bg-gradient-to-br from-[#7a1212] to-[#a31a1a] text-white font-medium text-sm disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Anonymously'}</button>
          </>
        )}
      </div>
    </div>
  )
}
