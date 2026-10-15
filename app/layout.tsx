import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FC Confessions - Fergusson College',
  description: 'Anonymous confessions from Fergusson College',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen">
        <div className="min-h-screen flex flex-col">
          <nav className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#7a1212] to-[#a31a1a] flex items-center justify-center font-bold text-sm">FC</div>
                <span className="font-semibold tracking-tight">FC Confessions</span>
              </a>
              <div className="flex items-center gap-2">
                <a href="/confessions" className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm transition">Feed</a>
                <a href="/track" className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm transition">Track</a>
              </div>
            </div>
          </nav>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
            Made for Fergusson College • Anonymous & Secure • made by Gaurav • {new Date().getFullYear()}
          </footer>
        </div>
      </body>
    </html>
  )
}
