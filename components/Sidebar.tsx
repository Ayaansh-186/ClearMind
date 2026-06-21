'use client'

import { Archive, Brain, Clock3, BarChart2, BookOpen, Lightbulb, LogOut, Moon, Sun, Sparkles, Plus, X, Network, MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, type ElementType } from 'react'
import { clusterColors, clusters as defaultClusters, type Note, type Tag } from '@/lib/types'

export type ViewKey = 'surface' | 'all' | 'recent' | 'archived' | string

type Props = {
  activeView: ViewKey
  counts: Record<string, number>
  email?: string
  now: number
  notes: Note[]
  tags: Tag[]
  activeTagId: string | null
  onChangeView: (view: ViewKey) => void
  onChangeTag: (tagId: string | null) => void
  onCreateTag: (name: string) => void
  onDeleteTag: (tagId: string) => void
  onSignOut: () => void
}

const mainItems: { key: ViewKey; label: string; icon: ElementType }[] = [
  { key: 'surface', label: 'What matters now', icon: Sparkles },
  { key: 'all', label: 'All notes', icon: Brain },
  { key: 'recent', label: 'Recent', icon: Clock3 },
  { key: 'archived', label: 'Archived', icon: Archive },
]

export function Sidebar({ activeView, counts, email, now, notes, tags, activeTagId, onChangeView, onChangeTag, onCreateTag, onDeleteTag, onSignOut }: Props) {
  const router = useRouter()
  const [dark, setDark] = useState(false)
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [showMore, setShowMore] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Dark mode
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved ? saved === 'dark' : prefersDark
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  useEffect(() => {
    if (showAddTag) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showAddTag])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  function submitNewTag() {
    const name = newTagName.trim()
    if (!name) return
    onCreateTag(name)
    setNewTagName('')
    setShowAddTag(false)
  }

  const itemClass = (key: string) =>
    `flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
      activeView === key
        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
    }`

  const recentCount = notes.filter(n => now - new Date(n.created_at).getTime() < 7 * 24 * 60 * 60 * 1000).length

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-zinc-200 bg-zinc-50/95 p-4 backdrop-blur md:flex md:flex-col dark:border-zinc-800 dark:bg-zinc-950/95">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <Lightbulb size={20} />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">Clarity</div>
              <div className="text-xs text-zinc-500">Self-organizing notes</div>
            </div>
          </div>
          <button onClick={toggleTheme} title="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Scrollable middle section: main nav + clusters + tags */}
        <div className="flex-1 overflow-y-auto">
        {/* Main nav */}
        <nav className="mt-6 space-y-1">
          {mainItems.map(item => {
            const Icon = item.icon
            const count = item.key === 'recent' ? recentCount : counts[item.key] ?? 0
            return (
              <button key={item.key} onClick={() => onChangeView(item.key)} className={itemClass(item.key)}>
                <Icon size={17} />
                <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                <span className="text-xs opacity-60">{count}</span>
              </button>
            )
          })}
        </nav>

        {/* AI Clusters */}
        <div className="mt-6 px-3">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Clusters</span>
        </div>
        <nav className="mt-2 space-y-1">
          {defaultClusters.map(cluster => (
            <button key={cluster} onClick={() => onChangeView(cluster)} className={itemClass(cluster)}>
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: clusterColors[cluster].dot }} />
              <span className="min-w-0 flex-1 truncate text-left capitalize">{cluster}</span>
              <span className="text-xs opacity-60">{counts[cluster] ?? 0}</span>
            </button>
          ))}
        </nav>

        {/* Tags */}
        <div className="mt-6 flex items-center justify-between px-3">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Tags</span>
          <button onClick={() => setShowAddTag(v => !v)}
            className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-600 transition"
            title="Create tag">
            <Plus size={13} />
          </button>
        </div>

        {showAddTag && (
          <div className="mt-2 mx-1 flex items-center gap-1">
            <input
              ref={inputRef}
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitNewTag(); if (e.key === 'Escape') setShowAddTag(false) }}
              placeholder="Tag name..."
              className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs outline-none focus:border-zinc-500"
            />
            <button onClick={submitNewTag} disabled={!newTagName.trim()}
              className="rounded-md bg-zinc-950 dark:bg-white px-2 py-1.5 text-xs text-white dark:text-zinc-950 disabled:opacity-40 hover:bg-zinc-800 transition">
              Add
            </button>
          </div>
        )}

        <nav className="mt-2 space-y-1">
          {tags.length === 0 && !showAddTag && (
            <p className="px-3 py-2 text-xs text-zinc-400">No tags yet — click + to add one</p>
          )}
          {tags.map(tag => {
            const active = activeTagId === tag.id
            return (
              <div key={tag.id} className="group flex items-center">
                <button
                  onClick={() => onChangeTag(active ? null : tag.id)}
                  className={`flex w-full flex-1 items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="min-w-0 flex-1 truncate text-left">{tag.name}</span>
                  <span className="text-xs opacity-60">{tag.note_count ?? 0}</span>
                </button>
                <button onClick={() => onDeleteTag(tag.id)}
                  className="mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                  <X size={11} />
                </button>
              </div>
            )
          })}
        </nav>

        </div>

        {/* Tools — pinned below the scroll area, always visible */}
        <div className="shrink-0">
        <div className="mt-4 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Tools</div>
        <nav className="mt-2 space-y-1">
          <button onClick={() => router.push('/analyze')} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition">
            <BarChart2 size={17} /><span className="flex-1 text-left">Performance Analyzer</span>
          </button>
          <button onClick={() => router.push('/chapter-notes')} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition">
            <BookOpen size={17} /><span className="flex-1 text-left">Chapter Notes</span>
          </button>
          <button onClick={() => router.push('/graph')} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition">
            <Network size={17} /><span className="flex-1 text-left">Knowledge Graph</span>
          </button>
        </nav>

        {/* User */}
        <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="truncate text-sm font-medium">{email}</div>
          <button onClick={onSignOut} className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition">
            <LogOut size={15} /> Sign out
          </button>
        </div>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-zinc-200 bg-white/95 px-2 pt-2 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {mainItems.map(item => {
          const Icon = item.icon
          return (
            <button key={item.key} onClick={() => onChangeView(item.key)} className={`flex flex-col items-center gap-1 rounded-md py-2 text-[11px] ${activeView === item.key ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'}`}>
              <Icon size={18} /><span className="truncate max-w-[56px]">{item.label}</span>
            </button>
          )
        })}
        <button onClick={() => setShowMore(true)} className="flex flex-col items-center gap-1 rounded-md py-2 text-[11px] text-zinc-500" aria-label="More">
          <MoreHorizontal size={18} /><span>More</span>
        </button>
      </nav>

      {/* Mobile "More" sheet — clusters, tags, tools, theme, sign out.
          On desktop these all live in the always-visible sidebar; on phones
          the bottom nav only has room for 4 views, so everything else lives here. */}
      {showMore && (
        <>
          <div className="fixed inset-0 z-50 bg-zinc-950/30 backdrop-blur-[2px] md:hidden" onClick={() => setShowMore(false)} />
          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-zinc-200 bg-white p-4 shadow-2xl md:hidden dark:border-zinc-800 dark:bg-zinc-950"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                  <Lightbulb size={16} />
                </div>
                <span className="text-base font-semibold">Clarity</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={toggleTheme} title="Toggle theme"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
                  {dark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button onClick={() => setShowMore(false)} aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Clusters */}
            <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Clusters</div>
            <nav className="mb-5 space-y-1">
              {defaultClusters.map(cluster => (
                <button key={cluster} onClick={() => { onChangeView(cluster); setShowMore(false) }} className={itemClass(cluster)}>
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: clusterColors[cluster].dot }} />
                  <span className="min-w-0 flex-1 truncate text-left capitalize">{cluster}</span>
                  <span className="text-xs opacity-60">{counts[cluster] ?? 0}</span>
                </button>
              ))}
            </nav>

            {/* Tags */}
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Tags</span>
              <button onClick={() => setShowAddTag(v => !v)}
                className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-600 transition"
                title="Create tag">
                <Plus size={14} />
              </button>
            </div>
            {showAddTag && (
              <div className="mb-2 flex items-center gap-1">
                <input
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submitNewTag(); if (e.key === 'Escape') setShowAddTag(false) }}
                  placeholder="Tag name..."
                  className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs outline-none focus:border-zinc-500"
                />
                <button onClick={submitNewTag} disabled={!newTagName.trim()}
                  className="rounded-md bg-zinc-950 dark:bg-white px-2 py-1.5 text-xs text-white dark:text-zinc-950 disabled:opacity-40 hover:bg-zinc-800 transition">
                  Add
                </button>
              </div>
            )}
            <nav className="mb-5 space-y-1">
              {tags.length === 0 && !showAddTag && (
                <p className="px-3 py-2 text-xs text-zinc-400">No tags yet — tap + to add one</p>
              )}
              {tags.map(tag => {
                const active = activeTagId === tag.id
                return (
                  <button
                    key={tag.id}
                    onClick={() => { onChangeTag(active ? null : tag.id); setShowMore(false) }}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                      active
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="min-w-0 flex-1 truncate text-left">{tag.name}</span>
                    <span className="text-xs opacity-60">{tag.note_count ?? 0}</span>
                  </button>
                )
              })}
            </nav>

            {/* Tools */}
            <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Tools</div>
            <nav className="mb-5 space-y-1">
              <button onClick={() => { setShowMore(false); router.push('/analyze') }} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition">
                <BarChart2 size={17} /><span className="flex-1 text-left">Performance Analyzer</span>
              </button>
              <button onClick={() => { setShowMore(false); router.push('/chapter-notes') }} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition">
                <BookOpen size={17} /><span className="flex-1 text-left">Chapter Notes</span>
              </button>
              <button onClick={() => { setShowMore(false); router.push('/graph') }} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition">
                <Network size={17} /><span className="flex-1 text-left">Knowledge Graph</span>
              </button>
            </nav>

            {/* User */}
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="truncate text-sm font-medium">{email}</div>
              <button onClick={onSignOut} className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
