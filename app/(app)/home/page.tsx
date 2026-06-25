'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, Search, Sparkles, X } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { BulkActionBar } from '@/components/BulkActionBar'
import { CaptureBar } from '@/components/CaptureBar'
import { ChatPanel } from '@/components/ChatPanel'
import { CommandPalette } from '@/components/CommandPalette'
import { DueRemindersBanner } from '@/components/DueRemindersBanner'
import { InstallBanner } from '@/components/InstallBanner'
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
type Reminder = {
  id: string
  remind_at: string
  note_id: string
  label?: string | null
  notes: { id: string; title: string | null; raw_content: string } | null
}

function isMac() {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? navigator.userAgent)
}

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

  // ── Bulk selection ────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const inSelectMode = selectedIds.size > 0

  function toggleSelect(note: Note) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(note.id)) next.delete(note.id)
      else next.add(note.id)
      return next
    })
  }

  function clearSelection() { setSelectedIds(new Set()) }

  async function bulkArchive() {
    const ids = [...selectedIds]
    await Promise.all(ids.map(id =>
      fetch(`/api/notes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_archived: true }) })
    ))
    setNotes(curr => curr.filter(n => !ids.includes(n.id)))
    setAllNotes(curr => curr.map(n => ids.includes(n.id) ? { ...n, is_archived: true } : n))
    clearSelection()
  }

  async function bulkDelete() {
    const ids = [...selectedIds]
    await Promise.all(ids.map(id => fetch(`/api/notes/${id}`, { method: 'DELETE' })))
    setNotes(curr => curr.filter(n => !ids.includes(n.id)))
    setAllNotes(curr => curr.filter(n => !ids.includes(n.id)))
    clearSelection()
  }

  async function bulkTagAll(tagId: string) {
    const ids = [...selectedIds]
    await Promise.all(ids.map(id =>
      fetch(`/api/notes/${id}/tags`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag_id: tagId }) })
    ))
    clearSelection()
  }

  async function bulkExport(format: 'md' | 'txt') {
    if (!user) return
    const ids = [...selectedIds]
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, note_ids: ids, format }),
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // FIX: was "clarity-export" — updated to match rebranded name
    a.download = `clearmind-export-${new Date().toISOString().slice(0, 10)}.${format}`
    a.click()
    URL.revokeObjectURL(url)
    clearSelection()
  }

  const [cmdOpen, setCmdOpen] = useState(false)
  // FIX: start empty string to avoid ⌘K → Ctrl+K hydration flash on Windows
  const [kbdHint, setKbdHint] = useState('')

  useEffect(() => {
    setKbdHint(isMac() ? '⌘K' : 'Ctrl+K')
  }, [])

  // ── Reminders ─────────────────────────────────────────────────────────────
  const [dueReminders, setDueReminders] = useState<Reminder[]>([])

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
      fetchDueReminders(u.id)
    })
  }, [router])

  // Poll reminders every 60s; also recheck when window gets focus
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => fetchDueReminders(user.id), 60 * 1000)
    const onFocus = () => fetchDueReminders(user.id)
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [user])

  // Cmd+K / Ctrl+K to open command palette
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // FIX: was 3000ms (every 3s) — extremely aggressive, burning Supabase quota
  // at ~40 req/min/user. Now 30s. New notes appear immediately via mergeNote()
  // on capture, so the background poll is just a safety net for multi-device sync.
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => fetchNotes(), 30_000)
    return () => clearInterval(interval)
  }, [fetchNotes, user])

  // FIX: removed redundant activeTagId useEffect that caused a double fetch.
  // Tag changes are now handled exclusively in changeTag() below, which calls
  // fetchNotes directly with the new tagId — no stale-closure risk.

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

  // FIX: mergeNote now accepts an optional _tempId field so CaptureBar and
  // VoiceButton can pass the temp card's exact ID for reliable removal.
  // Falls back to raw_content matching for backwards compatibility.
  function mergeNote(note: Note & { _tempId?: string }) {
    const tempId = note._tempId
    const clean: Note = { ...note }
    delete (clean as Record<string, unknown>)._tempId

    setNotes(curr => {
      const withoutTemp = tempId
        ? curr.filter(n => n.id !== tempId)
        : curr.filter(n => !(n.id.startsWith('temp-') && n.raw_content === note.raw_content))
      const exists = withoutTemp.some(n => n.id === clean.id)
      return exists
        ? withoutTemp.map(n => n.id === clean.id ? { ...n, ...clean } : n)
        : [clean, ...withoutTemp]
    })
    setAllNotes(curr => {
      const withoutTemp = tempId
        ? curr.filter(n => n.id !== tempId)
        : curr.filter(n => !(n.id.startsWith('temp-') && n.raw_content === note.raw_content))
      const exists = withoutTemp.some(n => n.id === clean.id)
      return exists
        ? withoutTemp.map(n => n.id === clean.id ? { ...n, ...clean } : n)
        : [clean, ...withoutTemp]
    })
  }

  function handleOnboardingComplete(note: Note) {
    mergeNote(note)
    completeOnboarding()
  }

  async function fetchDueReminders(uid: string) {
    const res = await fetch(`/api/reminders?user_id=${uid}`)
    if (!res.ok) return
    const all: Array<{ id: string; remind_at: string; note_id: string; label?: string | null; notes: { id: string; title: string | null; raw_content: string } | null }> = await res.json()
    const now = Date.now()
    setDueReminders(all.filter(r => new Date(r.remind_at).getTime() <= now))
  }

  async function dismissReminder(reminderId: string) {
    await fetch(`/api/reminders?id=${reminderId}`, { method: 'DELETE' })
    setDueReminders(curr => curr.filter(r => r.id !== reminderId))
  }

  function openNoteById(noteId: string) {
    const note = allNotes.find(n => n.id === noteId)
    if (note) setSelected(note)
  }

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
    fetchNotes()
  }

  function handleTagCreated(tag: Tag) {
    setTags(curr => curr.some(t => t.id === tag.id) ? curr : [...curr, tag].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function togglePin(note: Note) {
    const nextPinned = !note.is_pinned

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

  const showPinnedSection = activeView !== 'archived' && !searchQuery.trim()
  const pinnedNotes = showPinnedSection ? displayedNotes.filter(n => n.is_pinned) : []
  const unpinnedNotes = showPinnedSection ? displayedNotes.filter(n => !n.is_pinned) : displayedNotes

  function changeView(view: ViewKey) {
    setActiveView(view)
    fetchNotes(view, undefined, activeTagId)
  }

  // FIX: changeTag now explicitly calls fetchNotes with the new tagId, replacing
  // the removed useEffect watcher. This avoids the stale-closure double-fetch bug.
  function changeTag(tagId: string | null) {
    setActiveTagId(tagId)
    if (user) fetchNotes(activeView, user.id, tagId)
  }

  if (!user) return (
    <main className="grid min-h-screen place-items-center bg-white text-zinc-500 dark:bg-zinc-950">
      Opening ClearMind...
    </main>
  )

  return (
    <main className="min-h-screen bg-white text-zinc-950 md:pl-[260px] dark:bg-zinc-950 dark:text-zinc-50">
      {inSelectMode && (
        <BulkActionBar
          count={selectedIds.size}
          selectedIds={[...selectedIds]}
          allTags={tags}
          userId={user.id}
          onArchive={bulkArchive}
          onDelete={bulkDelete}
          onExport={bulkExport}
          onTagAll={bulkTagAll}
          onClear={clearSelection}
        />
      )}

      <Sidebar
        activeView={activeView}
        counts={counts}
        email={user.email ?? ''}
        tags={tags}
        activeTagId={activeTagId}
        onChangeView={changeView}
        onChangeTag={changeTag}
        onCreateTag={createTag}
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
                  : 'Drop the messy version. ClearMind will keep sorting.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
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
              {/* FIX: only render after mount to avoid hydration flash (⌘K vs Ctrl+K) */}
              {kbdHint && (
                <button
                  onClick={() => setCmdOpen(true)}
                  className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-xs text-zinc-500 hover:bg-white hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 sm:flex transition"
                  title={`Open command palette (${kbdHint})`}
                >
                  <span>{kbdHint}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <DueRemindersBanner
          reminders={dueReminders}
          onOpen={(noteId, reminderId) => {
            openNoteById(noteId)
            dismissReminder(reminderId)
          }}
          onDismiss={dismissReminder}
        />

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
                        <NoteCard key={note.id} note={note} onOpen={setSelected} onTogglePin={togglePin}
                          selectable={inSelectMode} selected={selectedIds.has(note.id)} onSelect={toggleSelect} />
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

                {unpinnedNotes.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {unpinnedNotes.map(note => (
                      <NoteCard key={note.id} note={note} onOpen={setSelected} onTogglePin={togglePin}
                        selectable={inSelectMode} selected={selectedIds.has(note.id)} onSelect={toggleSelect} />
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
        onOpenRelated={setSelected}
        onReminderChanged={() => user && fetchDueReminders(user.id)}
      />
      <ChatPanel userId={user.id} activeNote={selected} />

      {cmdOpen && (
        <CommandPalette
          notes={allNotes.filter(n => !n.is_archived)}
          onOpenNote={setSelected}
          onChangeView={changeView}
          onClose={() => setCmdOpen(false)}
        />
      )}

      {showOnboarding && (
        <OnboardingModal
          userId={user.id}
          onComplete={handleOnboardingComplete}
          onDismiss={dismissOnboarding}
        />
      )}
      <InstallBanner />
    </main>
  )
}
