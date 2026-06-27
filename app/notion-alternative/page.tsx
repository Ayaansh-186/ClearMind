import type { Metadata } from 'next'
import Link from 'next/link'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarity-delta-two.vercel.app'

export const metadata: Metadata = {
  title: 'Notion Alternative — ClearMind | AI Notes That Organise Themselves',
  description: 'Looking for a Notion alternative? ClearMind is an AI-powered notes app that organises your thoughts automatically — built for personal knowledge capture, not team wikis. Free.',
  alternates: { canonical: `${siteUrl}/notion-alternative` },
  openGraph: {
    title: 'Notion Alternative — ClearMind | AI Notes That Organise Themselves',
    description: 'ClearMind is the AI-first alternative for personal note capture. No databases, no templates, no setup required.',
    url: `${siteUrl}/notion-alternative`,
    type: 'website',
  },
}

const comparisons = [
  {
    feature: 'Note organisation',
    clearmind: 'AI-automatic — every note is clustered, titled, and formatted on save with no input from you',
    notion: 'User-driven — you design the structure, databases, and views yourself',
    obsidian: 'Manual by default — you create links and folders; AI features available via plugins',
  },
  {
    feature: 'AI capabilities',
    clearmind: 'Core to every note: auto-formatting, auto-clustering, semantic search, AI chat over your notes',
    notion: 'Notion AI assists with writing, summarising, and answering questions about your workspace',
    obsidian: 'Customisable via community plugins; base app focuses on local-first knowledge linking',
  },
  {
    feature: 'Setup required',
    clearmind: 'Zero — sign up, type a thought, done',
    notion: 'Moderate — best experienced after setting up databases, templates, and page structure',
    obsidian: 'High — vault setup, plugin configuration, and linking conventions take time',
  },
  {
    feature: 'Voice capture',
    clearmind: 'Built-in — record audio, Whisper AI transcribes and formats it instantly',
    notion: 'Not built-in natively',
    obsidian: 'Available via plugins',
  },
  {
    feature: 'Note connections',
    clearmind: 'Automatic — AI finds semantically related notes and surfaces them without any linking',
    notion: 'Manual relations and backlinks; AI can help find connections within your workspace',
    obsidian: 'Manual backlinks and graph view are core features — powerful but requires intentional linking',
  },
  {
    feature: 'Best for',
    clearmind: 'Personal knowledge capture where you want AI to handle all the organising',
    notion: 'Teams, project management, wikis, and structured databases with flexible views',
    obsidian: 'Researchers and writers who want full control over a local, privacy-first knowledge base',
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
            Comparison
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            ClearMind vs Notion<br /><span className="brand-gradient">vs Obsidian</span>
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
            Notion, Obsidian, and ClearMind are all excellent tools — they just solve different problems. Here's an honest breakdown to help you pick the right one.
          </p>
        </div>

        {/* Comparison table */}
        <section className="mb-14">
          <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--card-border)' }}>
            {/* Header */}
            <div className="grid grid-cols-4 text-xs font-bold uppercase tracking-widest" style={{ background: 'var(--card)', borderBottom: '1px solid var(--card-border)' }}>
              <div className="px-5 py-3" style={{ color: 'var(--muted)' }}>Feature</div>
              <div className="px-4 py-3" style={{ color: '#6366f1' }}>ClearMind</div>
              <div className="px-4 py-3" style={{ color: 'var(--muted)' }}>Notion</div>
              <div className="px-4 py-3" style={{ color: 'var(--muted)' }}>Obsidian</div>
            </div>

            {comparisons.map((row, i) => (
              <div key={row.feature} className="grid grid-cols-4" style={{ borderTop: i > 0 ? '1px solid var(--card-border)' : undefined }}>
                <div className="px-5 py-4 text-xs font-semibold" style={{ color: 'var(--foreground)', background: 'var(--card)' }}>
                  {row.feature}
                </div>
                <div className="px-4 py-4 text-xs leading-relaxed" style={{ background: 'rgba(99,102,241,0.03)', color: 'var(--foreground)' }}>
                  {row.clearmind}
                </div>
                <div className="px-4 py-4 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {row.notion}
                </div>
                <div className="px-4 py-4 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {row.obsidian}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs" style={{ color: 'var(--muted)' }}>
            All three are capable tools. This comparison reflects their core design philosophy, not a ranking.
          </p>
        </section>

        {/* When each is the right choice */}
        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">When to use each tool</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                name: 'ClearMind',
                color: '#6366f1',
                when: 'You want to capture personal knowledge fast and have AI handle all the structure. Minimal setup, maximum automation.',
                emoji: '✦',
              },
              {
                name: 'Notion',
                color: '#18181B',
                when: 'You need a team workspace, project tracker, or structured database. Great for collaborative wikis and flexible views.',
                emoji: '📋',
              },
              {
                name: 'Obsidian',
                color: '#7C3AED',
                when: 'You want a private, local-first knowledge base with full control. Perfect for researchers and writers who prefer manual linking.',
                emoji: '🔮',
              },
            ].map(t => (
              <div key={t.name} className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-sm font-bold" style={{ color: t.color }}>{t.name}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{t.when}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-3xl p-10 text-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <h2 className="mb-3 text-2xl font-bold text-white">Try ClearMind free</h2>
          <p className="mb-6 text-sm text-indigo-200">AI-first personal notes. No setup. No templates needed.</p>
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
