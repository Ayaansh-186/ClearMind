import type { Metadata } from 'next'
import Link from 'next/link'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarity-delta-two.vercel.app'

export const metadata: Metadata = {
  title: 'How ClearMind Works — AI That Organises Your Notes Automatically',
  description: 'ClearMind uses AI to capture, title, format, and cluster your notes automatically. Learn how voice capture, auto-clustering, and semantic search work together to build your second brain.',
  alternates: { canonical: `${siteUrl}/how-it-works` },
  openGraph: {
    title: 'How ClearMind Works — AI That Organises Your Notes Automatically',
    description: 'See how ClearMind captures thoughts, formats them with AI, and clusters them into Work, Ideas, Personal, Learning, and Health — automatically.',
    url: `${siteUrl}/how-it-works`,
    type: 'website',
  },
}

const steps = [
  {
    n: '01',
    title: 'Capture any thought',
    body: 'Type a quick note, record your voice, or upload a photo of a whiteboard. ClearMind accepts any format — the messier the better. You should never have to slow down to "prepare" a note.',
    detail: 'Supports text, voice recording (transcribed by Whisper AI), and image analysis. Works on desktop and mobile.',
  },
  {
    n: '02',
    title: 'AI titles and formats it',
    body: 'The moment you save, Llama 3.3 reads your raw content and rewrites it into a clean, titled, structured note. Bullet points become lists. Rambling voice memos become readable paragraphs.',
    detail: 'Powered by Groq\'s inference API — formatting happens in under 2 seconds.',
  },
  {
    n: '03',
    title: 'Automatically clustered',
    body: 'Every note is classified into one of five clusters: Work, Ideas, Personal, Learning, or Health. No manual tagging. No folders. The AI reads the content and decides where it belongs.',
    detail: 'Clusters are determined by content meaning, not keywords. A note about "running to clear my head" goes to Health, not Personal.',
  },
  {
    n: '04',
    title: 'Connected to related notes',
    body: 'When you open a note, ClearMind surfaces the four most semantically related notes from your library. Ideas you wrote weeks apart — but that belong together — find each other automatically.',
    detail: 'Uses vector embeddings (768 dimensions) and cosine similarity search via Supabase pgvector.',
  },
  {
    n: '05',
    title: 'Ask your notes anything',
    body: 'The AI chat panel knows your notes. Ask "what were my ideas about the product redesign?" and get an answer grounded in what you actually wrote — not a generic AI response.',
    detail: 'RAG (Retrieval-Augmented Generation) ensures answers come from your real notes, not hallucinations.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How ClearMind AI Note-Taking Works',
  description: 'ClearMind automatically captures, formats, clusters, and connects your notes using AI.',
  url: `${siteUrl}/how-it-works`,
  step: steps.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.body,
  })),
}

export default function HowItWorks() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}>

        {/* Nav */}
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

          {/* Header */}
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#6366f1' }}>
              How it works
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              AI that actually<br /><span className="brand-gradient">does the organising</span>
            </h1>
            <p className="mx-auto max-w-xl text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
              Most note apps make you do the work. ClearMind flips that. Drop any thought — the AI handles titling, formatting, clustering, and connecting it to what you already know.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-6 rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {step.n}
                </div>
                <div>
                  <h2 className="mb-2 text-lg font-semibold">{step.title}</h2>
                  <p className="mb-3 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{step.body}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', opacity: 0.7 }}>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 rounded-3xl p-10 text-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <h2 className="mb-3 text-2xl font-bold text-white">Ready to stop filing notes?</h2>
            <p className="mb-6 text-indigo-200 text-sm">Free forever. No credit card. Works in your browser.</p>
            <Link href="/login" className="inline-flex rounded-xl bg-white px-7 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition">
              Get started free →
            </Link>
          </div>

          {/* Internal links */}
          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm" style={{ color: 'var(--muted)' }}>
            <Link href="/" className="hover:text-indigo-500 transition">Home</Link>
            <Link href="/ai-notes-app" className="hover:text-indigo-500 transition">AI Notes App</Link>
            <Link href="/second-brain" className="hover:text-indigo-500 transition">Second Brain</Link>
            <Link href="/notion-alternative" className="hover:text-indigo-500 transition">Notion Alternative</Link>
            <Link href="/discover" className="hover:text-indigo-500 transition">Discover</Link>
          </div>
        </div>
      </main>
    </>
  )
}
