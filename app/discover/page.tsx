'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, BookmarkPlus, Check, Filter, Loader2, Sparkles } from 'lucide-react'
import { clusterColors, clusters, type Cluster, type Note } from '@/lib/types'

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function DiscoverPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [activeCluster, setActiveCluster] = useState<Cluster | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<string | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getBrowserClient().auth.getSession().then(({ data }) => {
      if (!data.session?.user) { router.replace('/login'); return }
      setUserId(data.session.user.id)
    })
  }, [router])

  const fetchNotes = useCallback(async (cluster: Cluster | null, after?: string) => {
    const params = new URLSearchParams({ limit: '18' })
    if (cluster) params.set('cluster', cluster)
    if (after) params.set('cursor', after)
    const res = await fetch(`/api/discover?${params}`)
    if (!res.ok) return { notes: [], nextCursor: null }
    return res.json() as Promise<{ notes: Note[]; nextCursor: string | null }>
  }, [])

  // Initial load / cluster change
  useEffect(() => {
    setLoading(true)
    setCursor(null)
    setHasMore(true)
    fetchNotes(activeCluster).then(data => {
      setNotes(data.notes ?? [])
      setCursor(data.nextCursor)
      setHasMore(!!data.nextCursor)
      setLoading(false)
    })
  }, [activeCluster, fetchNotes])

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && cursor) {
        setLoadingMore(true)
        fetchNotes(activeCluster, cursor).then(data => {
          setNotes(prev => [...prev, ...(data.notes ?? [])])
          setCursor(data.nextCursor)
          setHasMore(!!data.nextCursor)
          setLoadingMore(false)
        })
      }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, cursor, activeCluster, fetchNotes])

  async function saveToMyNotes(note: Note) {
    if (!userId || saving) return
    setSaving(note.id)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_content: `${note.title ? `# ${note.title}\n\n` : ''}${note.raw_content}`,
          user_id: userId,
        }),
      })
      if (res.ok) {
        setSaved(prev => new Set(prev).add(note.id))
      }
    } finally {
      setSaving(null)
    }
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 md:pl-[260px]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 transition">
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Discover</h1>
            <p className="text-xs text-zinc-500">Public notes shared by the Clarity community</p>
          </div>
        </div>

        {/* Cluster filter tabs */}
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-5 pb-3 scrollbar-none">
          <button
            onClick={() => setActiveCluster(null)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              !activeCluster
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900'
            }`}
          >
            All
          </button>
          {clusters.map(c => {
            const colors = clusterColors[c]
            const active = activeCluster === c
            return (
              <button
                key={c}
                onClick={() => setActiveCluster(c)}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition"
                style={active
                  ? { backgroundColor: colors.dot, color: '#fff' }
                  : { borderColor: colors.dot + '55', border: '1px solid', color: colors.text, backgroundColor: colors.bg }}
              >
                {c}
              </button>
            )
          })}
        </div>
      </header>

      {/* Feed */}
      <div className="mx-auto max-w-5xl px-5 py-6">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-zinc-400" />
          </div>
        )}

        {!loading && notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
              <Sparkles size={28} className="text-zinc-400" />
            </div>
            <p className="text-base font-medium text-zinc-600 dark:text-zinc-400">No public notes yet</p>
            <p className="mt-1 text-sm text-zinc-400">
              {activeCluster ? `No ${activeCluster} notes have been shared yet.` : 'Be the first — open a note and tap "Share to Discover".'}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map(note => {
            const colors = note.cluster ? clusterColors[note.cluster] : null
            const isSaved = saved.has(note.id)
            const isSaving = saving === note.id
            const isOwn = note.user_id === userId

            return (
              <div
                key={note.id}
                className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                {/* Cluster + author */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  {colors ? (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: colors.bg, color: colors.text }}>
                      {note.cluster}
                    </span>
                  ) : <span />}
                  <span className="text-xs text-zinc-400 truncate max-w-[120px]">{note.author_name ?? 'Anonymous'}</span>
                </div>

                {/* Title */}
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-950 dark:text-zinc-50">
                  {note.title ?? 'Untitled'}
                </h3>

                {/* Preview */}
                <p className="mt-2 line-clamp-4 flex-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {note.raw_content}
                </p>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-400">
                    {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {!isOwn && (
                    <button
                      onClick={() => saveToMyNotes(note)}
                      disabled={isSaved || isSaving}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        isSaved
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                          : 'bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 disabled:opacity-50'
                      }`}
                    >
                      {isSaving ? <Loader2 size={12} className="animate-spin" /> : isSaved ? <Check size={12} /> : <BookmarkPlus size={12} />}
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                  )}
                  {isOwn && (
                    <span className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-500 dark:bg-zinc-900">Your note</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} className="flex justify-center py-8">
          {loadingMore && <Loader2 size={20} className="animate-spin text-zinc-400" />}
          {!hasMore && notes.length > 0 && (
            <p className="text-xs text-zinc-400">You've seen everything · {notes.length} notes</p>
          )}
        </div>
      </div>
    </main>
  )
}
