'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Brain, Layers, ArrowRight, X, Loader2, Check, SendHorizonal } from 'lucide-react'
import type { Note } from '@/lib/types'
import { clusterColors } from '@/lib/types'

type Step = 'welcome' | 'capture' | 'processing' | 'cluster' | 'done'

type Props = {
  userId: string
  onComplete: (note: Note) => void
  onDismiss: () => void
}

const SAMPLE_NOTE = "Meeting with design team tomorrow at 10am — need to prep the Q3 wireframes and review Alex's feedback on the nav redesign"

export function OnboardingModal({ userId, onComplete, onDismiss }: Props) {
  const [step, setStep] = useState<Step>('welcome')
  const [noteText, setNoteText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [createdNote, setCreatedNote] = useState<Note | null>(null)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-type the sample note
  function startTypingDemo() {
    setStep('capture')
    setIsTyping(true)
    setNoteText('')
    let i = 0
    typeIntervalRef.current = setInterval(() => {
      i++
      setNoteText(SAMPLE_NOTE.slice(0, i))
      if (i >= SAMPLE_NOTE.length) {
        clearInterval(typeIntervalRef.current!)
        setIsTyping(false)
      }
    }, 28)
  }

  useEffect(() => {
    return () => {
      if (typeIntervalRef.current) clearInterval(typeIntervalRef.current)
    }
  }, [])

  async function handleSubmitNote() {
    const raw = noteText.trim()
    if (!raw) return
    setStep('processing')
    setError(null)

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_content: raw, user_id: userId }),
      })

      if (!res.ok) throw new Error('Failed to save note')
      const note: Note = await res.json()
      setCreatedNote(note)

      // Wait for clustering (poll up to 8 seconds)
      let clustered: Note = note
      for (let attempt = 0; attempt < 8; attempt++) {
        await new Promise(r => setTimeout(r, 1000))
        const check = await fetch(`/api/notes?user_id=${userId}`)
        if (check.ok) {
          const notes: Note[] = await check.json()
          const found = notes.find(n => n.id === note.id)
          if (found?.cluster) {
            clustered = found
            break
          }
        }
      }

      setCreatedNote(clustered)
      setStep('cluster')
    } catch (err) {
      setError('Something went wrong. Try again.')
      setStep('capture')
    }
  }

  function handleComplete() {
    if (createdNote) onComplete(createdNote)
    else onDismiss()
  }

  // Backdrop click to dismiss on welcome only
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget && step === 'welcome') onDismiss()
  }

  const clusterColor = createdNote?.cluster ? clusterColors[createdNote.cluster] : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">

        {/* Progress dots */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {(['welcome', 'capture', 'cluster', 'done'] as const).map((s, i) => {
            const stepIndex = ['welcome', 'capture', 'processing', 'cluster', 'done'].indexOf(step)
            const thisIndex = ['welcome', 'capture', 'cluster', 'done'].indexOf(s)
            return (
              <span
                key={s}
                className={`rounded-full transition-all duration-300 ${
                  thisIndex < stepIndex
                    ? 'h-1.5 w-4 bg-zinc-950 dark:bg-white'
                    : thisIndex === stepIndex || (step === 'processing' && thisIndex === 1)
                    ? 'h-1.5 w-4 bg-zinc-400'
                    : 'h-1.5 w-1.5 bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            )
          })}
        </div>

        {/* Dismiss button */}
        {step !== 'processing' && (
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Skip onboarding"
          >
            <X size={15} />
          </button>
        )}

        {/* ── STEP: welcome ── */}
        {step === 'welcome' && (
          <div className="px-8 pb-8 pt-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <Sparkles size={28} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Welcome to Clarity
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Clarity turns messy thoughts into structured, searchable notes — automatically. Let&apos;s take 30 seconds to see it work.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 text-left">
              {[
                { icon: SendHorizonal, label: 'Capture', desc: 'Dump a raw thought' },
                { icon: Brain, label: 'AI formats it', desc: 'Title, summary, structure' },
                { icon: Layers, label: 'Clusters it', desc: 'Into the right category' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <Icon size={16} className="mb-2 text-zinc-400" />
                  <div className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{label}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-400">{desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={startTypingDemo}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              See it in action <ArrowRight size={15} />
            </button>
            <button
              onClick={onDismiss}
              className="mt-3 w-full text-xs text-zinc-400 hover:text-zinc-600 transition dark:hover:text-zinc-300"
            >
              Skip — I&apos;ll explore on my own
            </button>
          </div>
        )}

        {/* ── STEP: capture ── */}
        {step === 'capture' && (
          <div className="px-8 pb-8 pt-12">
            <div className="mb-5">
              <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">Step 1 of 3</div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Capture a raw thought
              </h2>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                Type anything messy — a half-formed idea, a task, a brain dump. AI handles the rest.
              </p>
            </div>

            {/* Simulated capture bar */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <textarea
                ref={textareaRef}
                value={noteText}
                onChange={e => { if (!isTyping) setNoteText(e.target.value) }}
                placeholder="Dump any thought here — AI will sort it..."
                rows={3}
                className="w-full resize-none bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  {isTyping ? (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '0ms' }} />
                      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '150ms' }} />
                      <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '300ms' }} />
                    </span>
                  ) : noteText ? `${noteText.length} chars` : ''}
                </span>
                <button
                  onClick={handleSubmitNote}
                  disabled={!noteText.trim() || isTyping}
                  className="flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-30 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                >
                  <SendHorizonal size={13} /> Send to AI
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-500">{error}</p>
            )}

            <p className="mt-4 text-xs text-zinc-400">
              ✏️ Feel free to edit the text above, or type your own note instead.
            </p>
          </div>
        )}

        {/* ── STEP: processing ── */}
        {step === 'processing' && (
          <div className="px-8 pb-8 pt-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
              <Loader2 size={28} className="animate-spin text-zinc-400" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              AI is reading your note…
            </h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Generating a title, formatting the content, and figuring out which cluster it belongs to.
            </p>

            <div className="mt-8 space-y-3 text-left">
              {[
                { label: 'Saving note', done: true },
                { label: 'Generating title & summary', done: false, loading: true },
                { label: 'Assigning cluster', done: false },
                { label: 'Setting relevance score', done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    item.done
                      ? 'border-transparent bg-zinc-950 dark:bg-white'
                      : item.loading
                      ? 'border-zinc-300 dark:border-zinc-700'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}>
                    {item.done ? (
                      <Check size={11} className="text-white dark:text-zinc-950" />
                    ) : item.loading ? (
                      <Loader2 size={11} className="animate-spin text-zinc-400" />
                    ) : null}
                  </div>
                  <span className={`text-sm ${
                    item.done
                      ? 'text-zinc-400 line-through'
                      : item.loading
                      ? 'text-zinc-700 dark:text-zinc-200'
                      : 'text-zinc-300 dark:text-zinc-700'
                  }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP: cluster ── */}
        {step === 'cluster' && createdNote && (
          <div className="px-8 pb-8 pt-12">
            <div className="mb-5">
              <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">Step 2 of 3</div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Clustered automatically ✨
              </h2>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                Clarity read your note and organised it — no tagging needed.
              </p>
            </div>

            {/* Note card preview */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 flex items-center justify-between">
                {clusterColor && createdNote.cluster ? (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                    style={{ backgroundColor: clusterColor.bg, color: clusterColor.text }}
                  >
                    {createdNote.cluster}
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-400 dark:bg-zinc-800">
                    unsorted
                  </span>
                )}
                {createdNote.relevance && (
                  <span className="text-xs text-zinc-400">
                    relevance {createdNote.relevance}/10
                  </span>
                )}
              </div>

              {createdNote.title && (
                <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  {createdNote.title}
                </h3>
              )}

              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-3">
                {createdNote.raw_content}
              </p>
            </div>

            <div className="mt-4 rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
              <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">What just happened:</span>{' '}
                Groq (Llama 3.1) read your note, assigned it a title, scored how actionable it is, and placed it in the right cluster — in under a second.
              </p>
            </div>

            <button
              onClick={() => setStep('done')}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              One more thing <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── STEP: done ── */}
        {step === 'done' && (
          <div className="px-8 pb-8 pt-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <Check size={28} />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              You&apos;re set up
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Every note you capture from now on gets the same treatment. Three more things to know:
            </p>

            <div className="mt-6 space-y-3 text-left">
              {[
                {
                  emoji: '💬',
                  title: 'AI chat panel',
                  desc: 'The floating button bottom-right opens a chat that knows all your notes.',
                },
                {
                  emoji: '✨',
                  title: '"What matters now" view',
                  desc: 'The sidebar surfaces your most relevant, high-priority notes automatically.',
                },
                {
                  emoji: '🔍',
                  title: 'Search across everything',
                  desc: 'Full-text search across all your notes — try the search bar at the top.',
                },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-lg">{emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{title}</div>
                    <div className="mt-0.5 text-xs text-zinc-400">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleComplete}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              Go to my notes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
