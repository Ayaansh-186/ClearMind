import type { Metadata } from 'next'
import Link from 'next/link'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarity-delta-two.vercel.app'

export const metadata: Metadata = {
  title: 'Second Brain App — ClearMind | AI-Powered Knowledge System',
  description: 'Build your second brain with ClearMind. AI automatically organises everything you capture into a searchable, connected knowledge system. Free second brain app.',
  alternates: { canonical: `${siteUrl}/second-brain` },
  openGraph: {
    title: 'Second Brain App — ClearMind | AI-Powered Knowledge System',
    description: 'Your second brain, actually organised. ClearMind captures and connects your knowledge automatically using AI.',
    url: `${siteUrl}/second-brain`,
    type: 'website',
  },
}

export default function SecondBrain() {
  return (
    <>
      <main style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}>

        <nav style={{ borderBottom: '1px solid var(--card-border)' }}>
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
                </svg>
              </div>
              <span className="font-bold text-sm">Clear<span className="brand-gradient">Mind</span></span>
            </Link>
            <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              Try free →
            </Link>
          </div>
        </nav>

        <div className="mx-auto max-w-4xl px-6 py-16">

          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1' }}>
              Second Brain
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Your second brain<br /><span className="brand-gradient">that actually works</span>
            </h1>
            <p className="mx-auto max-w-xl text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
              The idea of a "second brain" is simple — a trusted external system that remembers everything so your real brain doesn't have to. The hard part has always been keeping it organised. ClearMind solves that with AI.
            </p>
          </div>

          <section className="mb-14">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">Why most second brain systems fail</h2>
            <div className="space-y-4">
              {[
                { problem: 'Too much maintenance', solution: 'ClearMind organises automatically — no tagging, filing, or linking required from you.' },
                { problem: 'Hard to retrieve ideas later', solution: 'Semantic search and AI chat mean you can ask "what did I think about X?" and actually get an answer.' },
                { problem: 'Capture friction', solution: 'Text, voice, or photo — capture in under 5 seconds from any device.' },
                { problem: 'Knowledge stays siloed', solution: 'Related notes surface automatically. Ideas from different times and topics find each other.' },
              ].map(row => (
                <div key={row.problem} className="flex gap-4 rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                  <div className="mt-0.5 text-red-400 text-sm shrink-0">✗</div>
                  <div>
                    <div className="mb-1 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{row.problem}</div>
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-green-500 text-sm shrink-0">✓</span>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{row.solution}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-14">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">What your second brain looks like in ClearMind</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: '🧠', title: 'Five knowledge clusters', body: 'Work, Ideas, Personal, Learning, Health. Everything you know, sorted.' },
                { icon: '🔗', title: 'Connected ideas', body: 'Related notes surface when you open anything. Your knowledge builds on itself.' },
                { icon: '💬', title: 'Conversational recall', body: 'Ask your second brain a question. Get answers from what you actually captured.' },
                { icon: '📈', title: 'Knowledge graph', body: 'Visual map of how all your notes connect. See your mind from above.' },
                { icon: '📅', title: 'Weekly digest', body: 'AI summary of what you captured this week. Never lose the thread.' },
                { icon: '🌐', title: 'Discover feed', body: 'Browse other people\'s public knowledge. Add what\'s useful to yours.' },
              ].map(f => (
                <div key={f.title} className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                  <div className="mb-3 text-2xl">{f.icon}</div>
                  <h3 className="mb-1.5 text-sm font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="rounded-3xl p-10 text-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <h2 className="mb-3 text-2xl font-bold text-white">Build your second brain today</h2>
            <p className="mb-6 text-sm text-indigo-200">Free. No setup. Your knowledge, finally organised.</p>
            <Link href="/login" className="inline-flex rounded-xl bg-white px-7 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition">
              Get started free →
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm" style={{ color: 'var(--muted)' }}>
            <Link href="/" className="hover:text-indigo-500 transition">Home</Link>
            <Link href="/how-it-works" className="hover:text-indigo-500 transition">How it works</Link>
            <Link href="/ai-notes-app" className="hover:text-indigo-500 transition">AI Notes App</Link>
            <Link href="/notion-alternative" className="hover:text-indigo-500 transition">Notion Alternative</Link>
          </div>
        </div>
      </main>
    </>
  )
}
