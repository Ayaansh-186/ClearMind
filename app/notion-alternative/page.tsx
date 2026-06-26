import type { Metadata } from 'next'
import Link from 'next/link'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarity-delta-two.vercel.app'

export const metadata: Metadata = {
  title: 'Notion Alternative — ClearMind | AI Notes That Organise Themselves',
  description: 'Looking for a Notion alternative? ClearMind is an AI-powered notes app that organises your thoughts automatically — no databases, no templates, no setup. Free.',
  alternates: { canonical: `${siteUrl}/notion-alternative` },
  openGraph: {
    title: 'Notion Alternative — ClearMind | AI Notes That Organise Themselves',
    description: 'ClearMind is the Notion alternative built for people who want AI to do the organising. No setup. No templates. Just capture and go.',
    url: `${siteUrl}/notion-alternative`,
    type: 'website',
  },
}

const differences = [
  {
    aspect: 'Setup time',
    notion: 'Hours of template building, database design, and property setup before you can start.',
    clearmind: 'Zero. Sign up, type a thought, AI organises it. You\'re done in 30 seconds.',
  },
  {
    aspect: 'Organisation',
    notion: 'You build the structure. Databases, views, tags, relations — all manual.',
    clearmind: 'AI builds the structure. Every note is automatically titled, formatted, and clustered.',
  },
  {
    aspect: 'Voice capture',
    notion: 'No built-in voice transcription.',
    clearmind: 'Record voice from the capture bar. Whisper AI transcribes and formats it instantly.',
  },
  {
    aspect: 'Finding old ideas',
    notion: 'Search by keyword. Relies on you having tagged and organised things correctly.',
    clearmind: 'Semantic AI search finds ideas by meaning, not just keywords. Ask a question, get your note.',
  },
  {
    aspect: 'Learning curve',
    notion: 'Steep. Notion is powerful but complex — most users use 10% of its features.',
    clearmind: 'None. Capture bar at the bottom. Type. Done.',
  },
  {
    aspect: 'Price',
    notion: 'Free plan is limited. Plus is $10/month.',
    clearmind: 'Free. Fully featured.',
  },
]

export default function NotionAlternative() {
  return (
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
            Notion Alternative
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            The Notion alternative<br /><span className="brand-gradient">that thinks for itself</span>
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
            Notion is a great tool — for teams building wikis and project trackers. But if you want a place to capture personal knowledge and have it stay organised, ClearMind does that with zero setup and real AI.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/login" className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              Try ClearMind free
            </Link>
            <Link href="/how-it-works" className="rounded-xl px-6 py-3 text-sm font-medium" style={{ border: '1px solid var(--card-border)', color: 'var(--muted)' }}>
              See how it works →
            </Link>
          </div>
        </div>

        <section className="mb-14">
          <h2 className="mb-8 text-2xl font-bold tracking-tight">ClearMind vs Notion</h2>
          <div className="space-y-4">
            {differences.map(d => (
              <div key={d.aspect} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--card-border)' }}>
                <div className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest" style={{ background: 'var(--card)', color: 'var(--muted)', borderBottom: '1px solid var(--card-border)' }}>
                  {d.aspect}
                </div>
                <div className="grid sm:grid-cols-2">
                  <div className="p-5" style={{ borderRight: '1px solid var(--card-border)' }}>
                    <div className="mb-2 text-xs font-semibold text-zinc-400">Notion</div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{d.notion}</p>
                  </div>
                  <div className="p-5" style={{ background: 'rgba(99,102,241,0.03)' }}>
                    <div className="mb-2 text-xs font-semibold" style={{ color: '#6366f1' }}>ClearMind</div>
                    <p className="text-sm leading-relaxed">{d.clearmind}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14 rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <h2 className="mb-3 text-lg font-bold">When Notion is the right choice</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Notion is genuinely powerful for collaborative team wikis, project management with multiple views, and structured databases with complex relations. If you need those things, use Notion.
          </p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            ClearMind is for personal knowledge capture where you want AI to handle all the organising — and you want zero friction between having a thought and saving it.
          </p>
        </section>

        <div className="rounded-3xl p-10 text-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <h2 className="mb-3 text-2xl font-bold text-white">Switch to the Notion alternative that organises itself</h2>
          <p className="mb-6 text-sm text-indigo-200">Free forever. No setup. No templates needed.</p>
          <Link href="/login" className="inline-flex rounded-xl bg-white px-7 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition">
            Get started free →
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm" style={{ color: 'var(--muted)' }}>
          <Link href="/" className="hover:text-indigo-500 transition">Home</Link>
          <Link href="/how-it-works" className="hover:text-indigo-500 transition">How it works</Link>
          <Link href="/ai-notes-app" className="hover:text-indigo-500 transition">AI Notes App</Link>
          <Link href="/second-brain" className="hover:text-indigo-500 transition">Second Brain</Link>
        </div>
      </div>
    </main>
  )
}
