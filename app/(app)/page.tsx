'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, Search, Sparkles, X } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { CaptureBar } from '@/components/CaptureBar'
import { ChatPanel } from '@/components/ChatPanel'
import { NoteCard } from '@/components/NoteCard'
import { NoteDetail } from '@/components/NoteDetail'
import { OnboardingModal } from '@/components/OnboardingModal'
import { Sidebar, type ViewKey } from '@/components/Sidebar'
import { useOnboarding } from '@/lib/useOnboarding'
import { clusters, type Note, type Tag } from '@/lib/types'

function getBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

type UserState = { id: string; email?: string }

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<UserState | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [allNotes, setAllNotes] = useState<Note[]>([]) // always keep all notes for counts
  const [activeView, setActiveView] = useState<ViewKey>('surface')
  const [selected, setSelected] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // ── Tags state ───────────────────────────────────────────────────────────
  const [tags, setTags] = useState<Tag[]>([])
  const [activeTagId, setActiveTagId] = useState<string | null>(null)

  // Onboarding: pass null until we've loaded notes (prevents flash)
  const noteCount = loading ? null : allNotes.length
  const { shouldShow: showOnboarding, complete: completeOnboarding, dismiss: dismissOnboarding } = useOnboarding(noteCount)

  // Fetch ALL notes for counts, and filtered notes for current view + active tag
  const fetchNotes = useCallback(async (view = activeView, userId?: string, tagId = activeTagId) => {
    const uid = userId ?? user?.id
    if (!uid) return

    // Always fetch ALL notes (archived + non-archived) for sidebar counts
    const allRes = await fetch(`/api/notes?user_id=${uid}&archived=all`)
    if (allRes.ok) {
      const all = await allRes.json() as Note[]
      setAllNotes(all)
    }

    // Fetch filtered notes for current view (+ tag, if one is active)
    const params = new URLSearchParams({ user_id: uid })
    if (view === 'archived') params.set('archived', 'true')
    if (clusters.includes(view as never)) params.set('cluster', view)
    if (tagId) params.set('tag_id', tagId)

    const res = await fetch(`/api/notes?${params.toString()}`)
    if (res.ok) {
      let data = await res.json() as Note[]
      if (view === 'recent') {
        data = data.filter(n => Date.now() - new Date(n.created_at).getTime() < 7 * 24 * 60 * 60 * 1000)
      }
      if (view === 'archived') {
        data = data.filter(n => n.is_archived)
      } else {
        data = data.filter(n => !n.is_archived)
      }
      setNotes(data)
      setSelected(curr => curr ? data.find(n => n.id === curr.id) ?? curr : curr)
    }

    setLoading(false)
  }, [activeView, activeTagId, user])

  const fetchTags = useCallback(async (userId?: string) => {
    const uid = userId ?? user?.id
    if (!uid) return
    const res = await fetch(`/api/tags?user_id=${uid}`)
    if (res.ok) setTags(await res.json())
  }, [user])

  useEffect(() => {
    const supabase = getBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) { router.replace('/login'); return }
      const u = { id: data.session.user.id, email: data.session.user.email }
      setUser(u)
      fetchNotes(activeView, u.id)
      fetchTags(u.id)
    })
  }, [router])

  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => fetchNotes(), 3000)
    return () => clearInterval(interval)
  }, [fetchNotes, user])

  // Re-fetch notes whenever the active tag changes
  useEffect(() => {
    if (!user) return
    fetchNotes(activeView, user.id, activeTagId)
  }, [activeTagId]) // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const result: Record<string, number> = {
      surface: allNotes.filter(n => !n.is_archived).length,
      all: allNotes.filter(n => !n.is_archived).length,
      recent: allNotes.filter(n => !n.is_archived && Date.now() - new Date(n.created_at).getTime() < 7 * 24 * 60 * 60 * 1000).length,
      archived: allNotes.filter(n => n.is_archived).length,
    }
    for (const cluster of clusters) {
      result[cluster] = allNotes.filter(n => n.cluster === cluster && !n.is_archived).length
    }
    return result
  }, [allNotes])

  function mergeNote(note: Note) {
    setNotes(curr => {
      const withoutTemp = curr.filter(n => !(n.id.startsWith('temp-') && n.raw_content === note.raw_content))
      const exists = withoutTemp.some(n => n.id === note.id)
      return exists ? withoutTemp.map(n => n.id === note.id ? { ...n, ...note } : n) : [note, ...withoutTemp]
    })
    setAllNotes(curr => {
      const withoutTemp = curr.filter(n => !(n.id.startsWith('temp-') && n.raw_content === note.raw_content))
      const exists = withoutTemp.some(n => n.id === note.id)
      return exists ? withoutTemp.map(n => n.id === note.id ? { ...n, ...note } : n) : [note, ...withoutTemp]
    })
  }

  function handleOnboardingComplete(note: Note) {
    mergeNote(note)
    completeOnboarding()
  }

  // ── Tag handlers ─────────────────────────────────────────────────────────
  async function createTag(name: string) {
    if (!user) return
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, name }),
    })
    if (res.ok) {
      const tag: Tag = await res.json()
      setTags(curr => curr.some(t => t.id === tag.id) ? curr : [...curr, tag].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  async function deleteTag(tagId: string) {
    setTags(curr => curr.filter(t => t.id !== tagId))
    if (activeTagId === tagId) setActiveTagId(null)
    await fetch(`/api/tags/${tagId}`, { method: 'DELETE' })
    // Notes may have lost a tag — refresh to keep chips accurate
    fetchNotes()
  }

  function handleTagCreated(tag: Tag) {
    setTags(curr => curr.some(t => t.id === tag.id) ? curr : [...curr, tag].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function togglePin(note: Note) {
    const nextPinned = !note.is_pinned

    // Optimistic update
    setNotes(curr => curr.map(n => n.id === note.id ? { ...n, is_pinned: nextPinned } : n))
    setAllNotes(curr => curr.map(n => n.id === note.id ? { ...n, is_pinned: nextPinned } : n))
    setSelected(curr => curr?.id === note.id ? { ...curr, is_pinned: nextPinned } : curr)

    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: nextPinned }),
      })
      if (res.ok) {
        const updated = await res.json()
        mergeNote({ ...updated, tags: note.tags })
      } else {
        setNotes(curr => curr.map(n => n.id === note.id ? { ...n, is_pinned: note.is_pinned } : n))
        setAllNotes(curr => curr.map(n => n.id === note.id ? { ...n, is_pinned: note.is_pinned } : n))
      }
    } catch {
      setNotes(curr => curr.map(n => n.id === note.id ? { ...n, is_pinned: note.is_pinned } : n))
      setAllNotes(curr => curr.map(n => n.id === note.id ? { ...n, is_pinned: note.is_pinned } : n))
    }
  }

  async function archiveNote(id: string) {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      const updated = await res.json()
      setNotes(curr => curr.filter(n => n.id !== id))
      setAllNotes(curr => curr.map(n => n.id === id ? { ...n, is_archived: true, ...updated } : n))
      setSelected(null)
    }
  }

  async function restoreNote(id: string) {
    const res = await fetch(`/api/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_archived: false })
    })
    if (res.ok) {
      const updated = await res.json()
      setAllNotes(curr => curr.map(n => n.id === id ? { ...n, is_archived: false, ...updated } : n))
      setSelected(null)
    }
  }

  async function signOut() {
    await getBrowserClient().auth.signOut()
    router.replace('/login')
  }

  const viewTitle: Record<string, string> = {
    surface: 'What matters now', all: 'All notes', recent: 'Recent', archived: 'Archived',
    work: 'Work', ideas: 'Ideas', personal: 'Personal', learning: 'Learning', health: 'Health'
  }

  const activeTagName = activeTagId ? tags.find(t => t.id === activeTagId)?.name : null

  const displayedNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return notes

    const pool = activeView === 'archived' ? allNotes.filter(n => n.is_archived) : allNotes.filter(n => !n.is_archived)
    const tagFiltered = activeTagId ? pool.filter(n => n.tags?.some(t => t.id === activeTagId)) : pool

    return tagFiltered.filter(n => {
      const title = (n.title ?? '').toLowerCase()
      const raw = n.raw_content.toLowerCase()
      const formatted = (n.formatted_content ?? '').toLowerCase()
      return title.includes(q) || raw.includes(q) || formatted.includes(q)
    })
  }, [searchQuery, notes, allNotes, activeView, activeTagId])

  // Split into pinned / unpinned. Pinned section is hidden in the archived view
  // (archived notes shouldn't clutter a "pinned" shelf) and while searching.
  const showPinnedSection = activeView !== 'archived' && !searchQuery.trim()
  const pinnedNotes = showPinnedSection ? displayedNotes.filter(n => n.is_pinned) : []
  const unpinnedNotes = showPinnedSection ? displayedNotes.filter(n => !n.is_pinned) : displayedNotes

  function changeView(view: ViewKey) {
    setActiveView(view)
    fetchNotes(view, undefined, activeTagId)
  }

  function changeTag(tagId: string | null) {
    setActiveTagId(tagId)
  }

  if (!user) return (
    <main className="grid min-h-screen place-items-center bg-white text-zinc-500 dark:bg-zinc-950">
      Opening Clarity...
    </main>
  )

  return (
    <main className="min-h-screen bg-white text-zinc-950 md:pl-[260px] dark:bg-zinc-950 dark:text-zinc-50">
      <Sidebar
        activeView={activeView}
        counts={counts}
        email={user.email}
        notes={allNotes}
        now={Date.now()}
        tags={tags}
        activeTagId={activeTagId}
        onChangeView={changeView}
        onChangeTag={changeTag}
        onCreateTag={createTag}
        onDeleteTag={deleteTag}
        onSignOut={signOut}
      />
      <section className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 px-5 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {activeTagName ? `#${activeTagName}` : (viewTitle[activeView] ?? activeView)}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                {activeTagName
                  ? <>Notes tagged <span className="font-medium">{activeTagName}</span> · <button onClick={() => setActiveTagId(null)} className="underline hover:text-zinc-700 dark:hover:text-zinc-300">clear filter</button></>
                  : 'Drop the messy version. Clarity will keep sorting.'}
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-9 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 pb-52 md:pb-6">
          <div className="mx-auto max-w-5xl">
            {loading ? (
              <div className="grid min-h-80 place-items-center text-zinc-500">Loading notes...</div>
            ) : displayedNotes.length === 0 ? (
              <div className="grid min-h-80 place-items-center text-center text-zinc-500">
                <div>
                  <Sparkles className="mx-auto mb-3 h-7 w-7 text-zinc-400" />
                  <p>
                    {searchQuery ? `No notes match "${searchQuery}"`
                      : activeTagName ? `No notes tagged "${activeTagName}" yet`
                      : 'Your mind is clear. Add your first thought below.'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Pinned section */}
                {pinnedNotes.length > 0 && (
                  <div className="mb-8">
                    <div className="mb-3 flex items-center gap-2">
                      <Pin size={13} className="text-amber-500" fill="currentColor" />
                      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Pinned
                      </h2>
                      <span className="text-xs text-zinc-300 dark:text-zinc-700">· {pinnedNotes.length}</span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {pinnedNotes.map(note => (
                        <NoteCard key={note.id} note={note} onOpen={setSelected} onTogglePin={togglePin} />
                      ))}
                    </div>
                    {unpinnedNotes.length > 0 && (
                      <div className="mt-8 mb-3 flex items-center gap-2">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                          {viewTitle[activeView] ?? 'Notes'}
                        </h2>
                      </div>
                    )}
                  </div>
                )}

                {/* Everything else */}
                {unpinnedNotes.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {unpinnedNotes.map(note => (
                      <NoteCard key={note.id} note={note} onOpen={setSelected} onTogglePin={togglePin} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <CaptureBar userId={user.id} onCreate={mergeNote} />
      </section>

      <NoteDetail
        note={selected}
        userId={user.id}
        allTags={tags}
        onClose={() => setSelected(null)}
        onArchive={archiveNote}
        onRestore={restoreNote}
        onUpdate={mergeNote}
        onTogglePin={togglePin}
        onTagCreated={handleTagCreated}
      />
      <ChatPanel userId={user.id} activeNote={selected} />

      {/* Onboarding modal — only shown to first-time users */}
      {showOnboarding && (
        <OnboardingModal
          userId={user.id}
          onComplete={handleOnboardingComplete}
          onDismiss={dismissOnboarding}
        />
      )}
    </main>
  )
}
