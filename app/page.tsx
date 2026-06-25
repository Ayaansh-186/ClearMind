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
  {
    icon: '✦',
    title: 'Auto-clustering',
    desc: 'Every note sorted into Work, Ideas, Personal, Learning, or Health — the moment you save it.',
  },
  {
    icon: '🎙️',
    title: 'Voice capture',
    desc: 'Record anywhere. AI transcribes and formats it into a clean, titled note.',
  },
  {
    icon: '🔗',
    title: 'Related notes',
    desc: 'Surfaces the 4 most semantically related notes every time you open one.',
  },
  {
    icon: '⌘',
    title: 'Command palette',
    desc: 'Jump to any note or view instantly with ⌘K. Built for keyboard lovers.',
  },
  {
    icon: '📅',
    title: 'Reminders',
    desc: 'Snooze a note to resurface in an hour, tomorrow, or any custom date.',
  },
  {
    icon: '🌐',
    title: 'Discover',
    desc: 'Browse public notes from the community. Save anything interesting to your library.',
  },
]

const testimonials = [
  { quote: "I stopped losing ideas the moment I started using this.", name: 'Designer, Berlin' },
  { quote: "It's like having a second brain that actually stays organised.", name: 'Founder, SF' },
  { quote: "Voice capture + auto-clustering changed how I think.", name: 'PhD student, London' },
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

      <style>{`
        :root {
          --land-bg: #F7F6F3;
          --land-surface: #ffffff;
          --land-border: #E8E7E3;
          --land-muted: #8A8986;
          --land-ink: #18181B;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --land-bg: #0D0D1A;
            --land-surface: #13131F;
            --land-border: #1E1E2E;
            --land-muted: #6B6B7B;
            --land-ink: #F0EFFE;
          }
        }
        .dark {
          --land-bg: #0D0D1A;
          --land-surface: #13131F;
          --land-border: #1E1E2E;
          --land-muted: #6B6B7B;
          --land-ink: #F0EFFE;
        }
        .land-card {
          background: var(--land-surface);
          border: 1px solid var(--land-border);
          border-radius: 1.25rem;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .land-card:hover {
          box-shadow: 0 8px 32px rgba(99,102,241,0.10);
          transform: translateY(-2px);
        }
        .glow-btn {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 4px 24px rgba(99,102,241,0.35);
          transition: opacity 0.15s, box-shadow 0.15s, transform 0.15s;
        }
        .glow-btn:hover {
          opacity: 0.93;
          box-shadow: 0 6px 32px rgba(99,102,241,0.50);
          transform: translateY(-1px);
        }
        .glow-btn:active { transform: scale(0.98); }
        .hero-grid {
          background-image:
            radial-gradient(circle at 20% 50%, rgba(99,102,241,0.07) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 50%);
        }
        .brand-gradient {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .float { animation: float 4s ease-in-out infinite; }
      `}</style>

      <main style={{ background: 'var(--land-bg)', color: 'var(--land-ink)', minHeight: '100vh' }}>

        {/* ── Nav ── */}
        <nav style={{ borderBottom: '1px solid var(--land-border)' }}>
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
                  <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z"/>
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight">
                Clear<span className="brand-gradient">Mind</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-lg px-4 py-2 text-sm font-medium transition sm:block"
                style={{ color: 'var(--land-muted)' }}
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="glow-btn rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
              >
                Get started free
              </Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="hero-grid relative overflow-hidden px-5 pb-24 pt-20 text-center sm:pt-28">
          {/* Decorative orb */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
          />

          <div
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1' }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            Free · No credit card · Works in browser
          </div>

          <h1 className="mx-auto mb-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl" style={{ color: 'var(--land-ink)' }}>
            Notes that think<br />
            <span className="brand-gradient">for themselves</span>
          </h1>

          <p className="mx-auto mb-10 max-w-lg text-base leading-relaxed sm:text-lg" style={{ color: 'var(--land-muted)' }}>
            Drop any thought — a quick idea, a voice memo, a photo. ClearMind uses AI to sort, format, and connect it automatically. No folders needed.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="glow-btn w-full rounded-2xl px-8 py-3.5 text-sm font-semibold text-white sm:w-auto"
            >
              Start for free — no card needed
            </Link>
            <Link
              href="/discover"
              className="w-full rounded-2xl px-8 py-3.5 text-sm font-medium transition hover:opacity-80 sm:w-auto"
              style={{ border: '1px solid var(--land-border)', color: 'var(--land-muted)', background: 'var(--land-surface)' }}
            >
              Browse community notes →
            </Link>
          </div>

          {/* App preview mockup */}
          <div className="float mx-auto mt-16 max-w-2xl">
            <div
              className="relative overflow-hidden rounded-3xl shadow-2xl"
              style={{ background: 'var(--land-surface)', border: '1px solid var(--land-border)' }}
            >
              {/* Fake toolbar */}
              <div
                className="flex items-center gap-1.5 border-b px-4 py-3"
                style={{ borderColor: 'var(--land-border)' }}
              >
                <span className="h-3 w-3 rounded-full bg-red-400 opacity-70" />
                <span className="h-3 w-3 rounded-full bg-yellow-400 opacity-70" />
                <span className="h-3 w-3 rounded-full bg-green-400 opacity-70" />
                <span
                  className="ml-3 flex-1 rounded-lg py-1 text-xs text-center"
                  style={{ background: 'var(--land-bg)', color: 'var(--land-muted)' }}
                >
                  clearmind.app/home
                </span>
              </div>
              {/* Fake note cards */}
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                {[
                  { cluster: '#6366f1', title: 'Product roadmap Q3', tag: 'Work', age: '2m ago' },
                  { cluster: '#10b981', title: 'Book ideas — flow state', tag: 'Ideas', age: '1h ago' },
                  { cluster: '#f59e0b', title: 'Call Dr. Patel Tuesday', tag: 'Health', age: '3h ago' },
                  { cluster: '#3b82f6', title: 'React 19 concurrent features', tag: 'Learning', age: '1d ago' },
                  { cluster: '#ec4899', title: 'Weekend trip packing list', tag: 'Personal', age: '2d ago' },
                  { cluster: '#6366f1', title: 'API rate limit discussion', tag: 'Work', age: '3d ago' },
                ].map((card, i) => (
                  <div
                    key={i}
                    className="relative rounded-xl p-3 text-left"
                    style={{ background: 'var(--land-bg)', border: '1px solid var(--land-border)' }}
                  >
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full" style={{ backgroundColor: card.cluster }} />
                    <div className="pl-2">
                      <div className="mb-1 text-xs font-semibold" style={{ color: 'var(--land-ink)' }}>{card.title}</div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold text-white" style={{ background: card.cluster }}>{card.tag}</span>
                        <span className="text-[9px]" style={{ color: 'var(--land-muted)' }}>{card.age}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Social proof ── */}
        <section className="px-5 pb-20">
          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="land-card p-5">
                <p className="mb-3 text-sm leading-relaxed" style={{ color: 'var(--land-ink)' }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-xs font-medium" style={{ color: 'var(--land-muted)' }}>— {t.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="px-5 pb-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 text-center">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
              >
                Features
              </span>
            </div>
            <h2 className="mb-3 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Built different
            </h2>
            <p className="mx-auto mb-12 max-w-md text-center text-sm" style={{ color: 'var(--land-muted)' }}>
              Most note apps make you organise. ClearMind organises for you.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="land-card p-6">
                  <div className="mb-3 text-2xl">{f.icon}</div>
                  <h3 className="mb-1.5 text-sm font-semibold" style={{ color: 'var(--land-ink)' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--land-muted)' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="px-5 pb-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Three steps, zero filing
            </h2>
            <div className="space-y-6">
              {[
                { step: '1', title: 'Drop a thought', body: 'Type it, say it, or photo it. Doesn\'t matter how messy.' },
                { step: '2', title: 'AI does the rest', body: 'Titles it, formats it, clusters it, and links it to related notes — instantly.' },
                { step: '3', title: 'Find anything, always', body: 'Search, browse by cluster, filter by tag. Nothing gets lost.' },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex gap-5 rounded-2xl p-5"
                  style={{ background: 'var(--land-surface)', border: '1px solid var(--land-border)' }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <div className="mb-1 text-sm font-semibold" style={{ color: 'var(--land-ink)' }}>{item.title}</div>
                    <div className="text-sm" style={{ color: 'var(--land-muted)' }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="px-5 pb-24">
          <div
            className="mx-auto max-w-3xl overflow-hidden rounded-3xl p-10 text-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 20px 60px rgba(99,102,241,0.35)' }}
          >
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Your second brain, sorted.
            </h2>
            <p className="mb-8 text-indigo-200">
              Free forever. Works in your browser. No setup needed.
            </p>
            <Link
              href="/login"
              className="inline-flex rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50 shadow-lg"
            >
              Get started free →
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          className="px-5 py-8"
          style={{ borderTop: '1px solid var(--land-border)' }}
        >
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
                </svg>
              </div>
              <span className="text-sm font-bold">
                Clear<span className="brand-gradient">Mind</span>
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--land-muted)' }}>
              © {new Date().getFullYear()} ClearMind. All rights reserved.
            </p>
            <div className="flex gap-5 text-xs" style={{ color: 'var(--land-muted)' }}>
              <Link href="/discover" className="hover:text-indigo-500 transition">Discover</Link>
              <Link href="/login" className="hover:text-indigo-500 transition">Sign in</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
