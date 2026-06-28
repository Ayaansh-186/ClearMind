'use client'

import { useRef, useState } from 'react'
import { Lightbulb, X, Loader2, ArrowRight, Sparkles, Tag, List, Link2 } from 'lucide-react'
import type { Note } from '@/lib/types'

type ThoughtType = 'idea' | 'project' | 'task' | 'learning' | 'question'

type ThoughtResult = {
  title: string
  type: ThoughtType
  cluster: string
  summary: string
  concepts: string[]
  structure: { label: string; items: string[] }
  relatedNoteIds: string[]
}

const typeColors: Record<ThoughtType, { bg: string; text: string }> = {
  idea:     { bg: '#EEF2FF', text: '#4338CA' },
  project:  { bg: '#F0FDF4', text: '#15803D' },
  task:     { bg: '#FFF7ED', text: '#C2410C' },
  learning: { bg: '#EFF6FF', text: '#1D4ED8' },
  question: { bg: '#FDF4FF', text: '#7E22CE' },
}

type Props = {
  userId: string
  onCreate: (note: Note & { _tempId?: string }) => void
  onOpenNote?: (noteId: string) => void
}

export function ThoughtEngine({ userId, onCreate, onOpenNote }: Props) {
  const [open, setOpen] = useState(false)
  const [thought, setThought] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ThoughtResult | null>(null)
  const [createdNote, setCreatedNote] = useState<Note | null>(null)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function reset() {
    setThought('')
    setResult(null)
    setCreatedNote(null)
    setError(null)
  }

  function close() { setOpen(false); reset() }

  async function process() {
    if (!thought.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/thought-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thought: thought.trim(), user_id: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Something went wrong')

      setResult(data.result)
      setCreatedNote(data.note)
      // Merge the new note into the dashboard immediately
      onCreate({ ...data.note, _tempId: undefined })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process thought')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      process()
    }
  }

  const typeColor = result ? typeColors[result.type] ?? typeColors.idea : typeColors.idea

  return (
    <>
      {/* Floating trigger button — sits left of the chat button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => textareaRef.current?.focus(), 100) }}
        className="fixed bottom-[calc(var(--mobile-nav-offset)+1rem)] right-[4.75rem] z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition hover:scale-105 active:scale-95 md:bottom-6 md:right-24"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
        aria-label="Open Thought Engine"
        title="Thought Engine — transform ideas into structure"
      >
        <Lightbulb size={20} className="text-white" />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-0 md:items-center md:justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={close} />

          {/* Sheet */}
          <div
            className="relative z-10 flex w-full flex-col rounded-t-3xl shadow-2xl md:w-[480px] md:rounded-3xl"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--card-border)',
              maxHeight: '90vh',
            }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--card-border)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                  <Lightbulb size={15} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Thought Engine</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>Transform any thought into structured knowledge</div>
                </div>
              </div>
              <button onClick={close} className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-zinc-100 dark:hover:bg-zinc-800" style={{ color: 'var(--muted)' }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Input state */}
              {!result && (
                <div className="p-5">
                  <div className="mb-3 text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    Drop any thought — goal, idea, question, or plan
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={thought}
                    onChange={e => setThought(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. I want to make a YouTube short about black holes but don't know where to start..."
                    rows={4}
                    className="w-full resize-none rounded-xl border p-3 text-sm outline-none transition"
                    style={{
                      borderColor: 'var(--card-border)',
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <div className="mt-1 text-right text-xs" style={{ color: 'var(--muted)' }}>
                    {thought.length > 0 && '⌘↵ to process'}
                  </div>

                  {error && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={process}
                    disabled={!thought.trim() || loading}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
                  >
                    {loading ? (
                      <><Loader2 size={15} className="animate-spin" /> Processing thought...</>
                    ) : (
                      <><Sparkles size={15} /> Transform into knowledge</>
                    )}
                  </button>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      'I want to learn machine learning',
                      'Build a habit tracking app',
                      'Plan my week better',
                      'Understand quantum physics',
                    ].map(ex => (
                      <button key={ex} onClick={() => setThought(ex)}
                        className="rounded-lg border px-3 py-2 text-left text-xs transition hover:border-amber-400"
                        style={{ borderColor: 'var(--card-border)', color: 'var(--muted)' }}>
                        "{ex}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Result state */}
              {result && (
                <div className="p-5 space-y-4">
                  {/* Title + type */}
                  <div>
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: typeColor.bg, color: typeColor.text }}>
                        {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                      </span>
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                        {result.cluster.charAt(0).toUpperCase() + result.cluster.slice(1)}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{result.title}</h3>
                    <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>{result.summary}</p>
                  </div>

                  {/* Concepts */}
                  <div className="rounded-xl p-4" style={{ background: 'var(--background)', border: '1px solid var(--card-border)' }}>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      <Tag size={11} /> Key concepts
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.concepts.map(c => (
                        <span key={c} className="rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Structure */}
                  <div className="rounded-xl p-4" style={{ background: 'var(--background)', border: '1px solid var(--card-border)' }}>
                    <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      <List size={11} /> {result.structure.label}
                    </div>
                    <ol className="space-y-2">
                      {result.structure.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                            {i + 1}
                          </span>
                          <span className="text-sm" style={{ color: 'var(--foreground)' }}>{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Related notes */}
                  {result.relatedNoteIds.length > 0 && (
                    <div className="rounded-xl p-4" style={{ background: 'var(--background)', border: '1px solid var(--card-border)' }}>
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                        <Link2 size={11} /> Connected to {result.relatedNoteIds.length} existing note{result.relatedNoteIds.length > 1 ? 's' : ''}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.relatedNoteIds.map(id => (
                          <button key={id} onClick={() => { onOpenNote?.(id); close() }}
                            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition hover:border-amber-400"
                            style={{ borderColor: 'var(--card-border)', color: 'var(--foreground)' }}>
                            Open note →
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Saved confirmation */}
                  <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-900 dark:bg-green-950/20">
                    <span className="text-green-600 text-sm">✓</span>
                    <span className="text-xs text-green-700 dark:text-green-400">Saved to your notes as "{result.title}"</span>
                    {createdNote && (
                      <button onClick={() => { onOpenNote?.(createdNote.id); close() }}
                        className="ml-auto flex items-center gap-1 text-xs font-semibold text-green-700 hover:underline dark:text-green-400">
                        Open <ArrowRight size={10} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {result && (
              <div className="shrink-0 flex gap-2 border-t p-4" style={{ borderColor: 'var(--card-border)' }}>
                <button onClick={reset}
                  className="flex-1 rounded-xl border py-2.5 text-sm font-medium transition hover:opacity-80"
                  style={{ borderColor: 'var(--card-border)', color: 'var(--muted)' }}>
                  New thought
                </button>
                <button onClick={close}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
