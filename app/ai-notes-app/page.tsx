import type { Metadata } from 'next'
import Link from 'next/link'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarity-delta-two.vercel.app'

export const metadata: Metadata = {
  title: 'AI Notes App — ClearMind | Notes That Organise Themselves',
  description: 'ClearMind is the AI notes app that automatically titles, formats, and clusters your thoughts. Capture by text, voice, or photo. Free AI note-taking app.',
  alternates: { canonical: `${siteUrl}/ai-notes-app` },
  openGraph: {
    title: 'AI Notes App — ClearMind | Notes That Organise Themselves',
    description: 'The AI notes app that does the organising for you. Capture any thought and AI handles the rest.',
    url: `${siteUrl}/ai-notes-app`,
    type: 'website',
  },
}

const comparisons = [
  { feature: 'Auto-titles notes', clearmind: true, notion: false, obsidian: false },
  { feature: 'AI formatting on save', clearmind: true, notion: false, obsidian: false },
  { feature: 'Auto-clusters by topic', clearmind: true, notion: false, obsidian: false },
  { feature: 'Voice note transcription', clearmind: true, notion: false, obsidian: false },
  { feature: 'Semantic related notes', clearmind: true, notion: false, obsidian: false },
  { feature: 'Ask your notes anything', clearmind: true, notion: true, obsidian: false },
  { feature: 'Free to start', clearmind: true, notion: true, obsidian: true },
  { feature: 'No setup required', clearmind: true, notion: true, obsidian: false },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ClearMind AI Notes App',
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'Web, iOS, Android',
  description: 'AI-powered notes app that automatically titles, formats, and clusters your thoughts.',
  url: siteUrl,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: [
    'AI auto-titling and formatting',
    'Voice note transcription with Whisper AI',
    'Automatic topic clustering',
    'Semantic related notes',
    'AI chat over your notes',
    'Knowledge graph',
    'Community discover feed',
  ],
}

export default function AiNotesApp() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
              AI Notes App
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              The AI notes app that<br /><span className="brand-gradient">does the work for you</span>
            </h1>
            <p className="mx-auto max-w-xl text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
              Traditional note apps store what you write. ClearMind understands it. Every note you save gets automatically titled, formatted, and sorted — so you spend time thinking, not organising.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/login" className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                Start for free
              </Link>
              <Link href="/how-it-works" className="rounded-xl px-6 py-3 text-sm font-medium" style={{ border: '1px solid var(--card-border)', color: 'var(--muted)' }}>
                See how it works →
              </Link>
            </div>
          </div>

          {/* What makes it an AI notes app */}
          <section className="mb-16">
            <h2 className="mb-8 text-2xl font-bold tracking-tight">What makes ClearMind an AI notes app</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: 'AI formatting on every save', body: 'Raw thoughts become clean, titled, structured notes automatically. No editing required.' },
                { title: 'Voice transcription built in', body: 'Record audio anywhere. Groq Whisper transcribes it in under a second, then AI formats it.' },
                { title: 'Five intelligent clusters', body: 'Work, Ideas, Personal, Learning, Health. AI reads content and decides — no manual tags.' },
                { title: 'Semantic search and connections', body: 'Ask your notes a question. Get answers grounded in what you actually wrote.' },
              ].map(f => (
                <div key={f.title} className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                  <h3 className="mb-2 text-sm font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Comparison table */}
          <section className="mb-16">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">How ClearMind compares</h2>
            <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--card-border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--card-border)' }}>
                    <th className="px-5 py-3 text-left font-semibold">Feature</th>
                    <th className="px-5 py-3 text-center font-semibold" style={{ color: '#6366f1' }}>ClearMind</th>
                    <th className="px-5 py-3 text-center font-semibold" style={{ color: 'var(--muted)' }}>Notion</th>
                    <th className="px-5 py-3 text-center font-semibold" style={{ color: 'var(--muted)' }}>Obsidian</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, i) => (
                    <tr key={row.feature} style={{ borderTop: i > 0 ? '1px solid var(--card-border)' : undefined }}>
                      <td className="px-5 py-3" style={{ color: 'var(--muted)' }}>{row.feature}</td>
                      <td className="px-5 py-3 text-center">{row.clearmind ? '✅' : '—'}</td>
                      <td className="px-5 py-3 text-center" style={{ color: 'var(--muted)' }}>{row.notion ? '✅' : '—'}</td>
                      <td className="px-5 py-3 text-center" style={{ color: 'var(--muted)' }}>{row.obsidian ? '✅' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="rounded-3xl p-10 text-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <h2 className="mb-3 text-2xl font-bold text-white">Try the AI notes app that thinks for itself</h2>
            <p className="mb-6 text-sm text-indigo-200">Free. No credit card. No setup.</p>
            <Link href="/login" className="inline-flex rounded-xl bg-white px-7 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition">
              Get started free →
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm" style={{ color: 'var(--muted)' }}>
            <Link href="/" className="hover:text-indigo-500 transition">Home</Link>
            <Link href="/how-it-works" className="hover:text-indigo-500 transition">How it works</Link>
            <Link href="/second-brain" className="hover:text-indigo-500 transition">Second Brain</Link>
            <Link href="/notion-alternative" className="hover:text-indigo-500 transition">Notion Alternative</Link>
          </div>
        </div>
      </main>
    </>
  )
}
