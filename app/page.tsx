import type { Metadata } from 'next'
import Link from 'next/link'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarity-delta-two.vercel.app'

export const metadata: Metadata = {
  title: 'Clarity — AI Notes App That Organizes Itself',
  description:
    'Stop organizing notes manually. Clarity uses AI to automatically sort, format, and cluster your thoughts into Work, Ideas, Personal, Learning, and Health. Free to use.',
  alternates: { canonical: siteUrl },
  openGraph: {
    title: 'Clarity — AI Notes App That Organizes Itself',
    description:
      'Stop organizing notes manually. Clarity uses AI to automatically sort, format, and cluster your thoughts.',
    url: siteUrl,
    type: 'website',
  },
}

const features = [
  {
    icon: '✦',
    title: 'AI-powered clustering',
    desc: 'Drop any thought. Clarity automatically sorts it into Work, Ideas, Personal, Learning, or Health.',
  },
  {
    icon: '🎙️',
    title: 'Voice capture',
    desc: 'Record audio notes anywhere. Whisper AI transcribes and formats them instantly.',
  },
  {
    icon: '🔗',
    title: 'Related notes',
    desc: 'Every note surfaces the 4 most semantically related notes — like a personal knowledge graph.',
  },
  {
    icon: '⌘',
    title: 'Command palette',
    desc: 'Jump to any note, view, or tool without leaving the keyboard. Press ⌘K.',
  },
  {
    icon: '📅',
    title: 'Reminders',
    desc: 'Snooze any note to resurface it later — in 1 hour, tomorrow, or a custom date.',
  },
  {
    icon: '📊',
    title: 'Weekly AI digest',
    desc: 'A personalized weekly review of what you captured, what\'s stale, and what matters.',
  },
]

// JSON-LD structured data for Google rich results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Clarity',
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'Web',
  description:
    'Self-organizing AI notes app. Capture ideas, voice notes, and thoughts — AI sorts, formats, and clusters them automatically.',
  url: siteUrl,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'AI note clustering',
    'Voice note transcription',
    'Related notes discovery',
    'Weekly AI digest',
    'Note reminders',
    'Knowledge graph',
    'Version history',
  ],
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        {/* Nav */}
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <span className="text-sm font-bold">C</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Clarity</span>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Get started free →
          </Link>
        </nav>

        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pb-16 pt-20 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Free · No credit card
          </div>
          <h1 className="mb-5 text-5xl font-bold tracking-tight leading-tight sm:text-6xl">
            Notes that<br />
            <span className="text-zinc-400">organize themselves</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-zinc-500">
            Stop filing notes into folders. Clarity uses AI to automatically sort, format,
            and cluster every thought you capture — into Work, Ideas, Personal, Learning, and Health.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="w-full rounded-xl bg-zinc-950 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 sm:w-auto"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-zinc-200 px-8 py-3.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight">
            Everything your notes app is missing
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(f => (
              <div
                key={f.title}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="mb-1.5 text-sm font-semibold">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-zinc-200 bg-zinc-950 py-20 text-center dark:border-zinc-800">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white">
            Your second brain, sorted.
          </h2>
          <p className="mb-8 text-zinc-400">Free to use. Works in your browser. No setup required.</p>
          <Link
            href="/login"
            className="inline-flex rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            Get started free →
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-200 px-6 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
          © {new Date().getFullYear()} Clarity · Built with Next.js & Groq AI
        </footer>
      </main>
    </>
  )
}
