import type { Metadata } from 'next'
import Link from 'next/link'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarity-delta-two.vercel.app'

export const metadata: Metadata = {
  title: 'ClearMind — AI Notes That Organise Themselves',
  description: 'Stop filing notes into folders. ClearMind uses AI to automatically sort, format, and cluster your thoughts. Free to use.',
  alternates: { canonical: siteUrl },
  openGraph: {
    title: 'ClearMind — AI Notes That Organise Themselves',
    description: 'Drop any thought. AI sorts, formats, and clusters it instantly.',
    url: siteUrl,
    type: 'website',
  },
}

const features = [
  { icon: '✦', title: 'Auto-clustering', desc: 'Every note sorted into Work, Ideas, Personal, Learning, or Health — instantly.' },
  { icon: '🎙️', title: 'Voice capture', desc: 'Record audio anywhere. Whisper AI transcribes and formats it.' },
  { icon: '🔗', title: 'Related notes', desc: 'AI surfaces the 4 most semantically related notes for every note you open.' },
  { icon: '⌘', title: 'Command palette', desc: 'Jump to any note or view with ⌘K. Fully keyboard-driven.' },
  { icon: '📅', title: 'Reminders', desc: 'Snooze any note to resurface it in an hour, tomorrow, or a custom date.' },
  { icon: '🌐', title: 'Discover feed', desc: 'Browse public notes from the community. Save anything interesting to your own library.' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ClearMind',
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'Web',
  description: 'Self-organising AI notes app. Capture ideas, voice notes, and thoughts — AI sorts, formats, and clusters them automatically.',
  url: siteUrl,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>

        {/* Nav */}
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <span className="text-base font-bold text-white">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight">
              Clear<span className="brand-gradient">Mind</span>
            </span>
          </div>
          <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Get started free →
          </Link>
        </nav>

        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pb-20 pt-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
            style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.06)', color: '#6366f1' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Free · No credit card · Works in browser
          </div>
          <h1 className="mb-5 text-5xl font-bold tracking-tight leading-[1.1] sm:text-6xl" style={{ color: 'var(--foreground)' }}>
            Notes that think<br />
            <span className="brand-gradient">for themselves</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg" style={{ color: 'var(--muted)' }}>
            Drop any thought — a quick idea, a voice memo, a photo. ClearMind uses AI to sort, format, and connect it automatically.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className="w-full rounded-2xl px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 sm:w-auto"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              Start for free
            </Link>
            <Link href="/login" className="w-full rounded-2xl border px-8 py-3.5 text-sm font-medium transition hover:opacity-80 sm:w-auto"
              style={{ borderColor: 'var(--card-border)', color: 'var(--muted)', background: 'var(--card)' }}>
              Sign in
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight">Built different</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} className="rounded-2xl p-6 transition card-lift"
                style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="mb-1.5 text-sm font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 text-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white">Your second brain, sorted.</h2>
          <p className="mb-8 text-indigo-200">Free. Works in your browser. No setup needed.</p>
          <Link href="/login" className="inline-flex rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50 shadow-lg">
            Get started free →
          </Link>
        </section>

        {/* Footer */}
        <footer className="px-6 py-6 text-center text-xs" style={{ borderTop: '1px solid var(--card-border)', color: 'var(--muted)' }}>
          © {new Date().getFullYear()} ClearMind · Built with Next.js & Groq AI
        </footer>
      </main>
    </>
  )
}
