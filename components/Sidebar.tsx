'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Brain, CalendarDays, Clock3, BarChart2, BookOpen, LogOut, Moon, Sun, Sparkles, Plus, X, Network, MoreHorizontal, Compass } from 'lucide-react'
import { clusterColors, clusters, type Cluster, type Tag } from '@/lib/types'

type ViewKey = string
export type { ViewKey }

type Props = {
  activeView: ViewKey
  activeTagId: string | null
  tags: Tag[]
  counts: Record<string, number>
  email: string
  onChangeView: (view: ViewKey) => void
  onChangeTag: (tagId: string | null) => void
  onSignOut: () => void
  onCreateTag: (name: string) => Promise<void>
}

const mainItems = [
  { key: 'surface', label: 'Focus', icon: Sparkles },
  { key: 'all', label: 'All', icon: Brain },
  { key: 'recent', label: 'Recent', icon: Clock3 },
  { key: 'archived', label: 'Archive', icon: Archive },
]

const defaultClusters = clusters as Cluster[]

export function Sidebar({ activeView, activeTagId, tags, counts, email, onChangeView, onChangeTag, onSignOut, onCreateTag }: Props) {
  const router = useRouter()
  const [dark, setDark] = useState(false)
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [showMore, setShowMore] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('clearmind_theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved ? saved === 'dark' : prefersDark
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('clearmind_theme', next ? 'dark' : 'light')
  }

  async function submitNewTag() {
    const name = newTagName.trim()
    if (!name) return
    await onCreateTag(name)
    setNewTagName('')
    setShowAddTag(false)
  }

  useEffect(() => {
    if (showAddTag) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showAddTag])

  function itemClass(key: string) {
    const active = activeView === key
    return `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
      active
        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium shadow-sm'
        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'
    }`
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col md:flex" style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--card-border)' }}>

        {/* Brand header */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Sparkles size={17} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span style={{ color: 'var(--foreground)' }}>Clear</span>
            <span className="brand-gradient">Mind</span>
          </span>
          <button onClick={toggleTheme} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">

          {/* Main nav */}
          <nav className="mb-5 space-y-0.5">
            {mainItems.map(item => {
              const Icon = item.icon
              return (
                <button key={item.key} onClick={() => onChangeView(item.key)} className={itemClass(item.key)}>
                  <Icon size={17} /><span className="flex-1 text-left">{item.label}</span>
                </button>
              )
            })}
            <button onClick={() => router.push('/discover')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition">
              <Compass size={17} /><span className="flex-1 text-left">Discover</span>
            </button>
          </nav>

          {/* Clusters */}
          <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Clusters</div>
          <nav className="mb-5 space-y-0.5">
            {defaultClusters.map(cluster => (
              <button key={cluster} onClick={() => onChangeView(cluster)} className={itemClass(cluster)}>
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: clusterColors[cluster].dot }} />
                <span className="min-w-0 flex-1 truncate text-left capitalize">{cluster}</span>
                <span className="text-xs opacity-50">{counts[cluster] ?? 0}</span>
              </button>
            ))}
          </nav>

          {/* Tags */}
          <div className="mb-1.5 flex items-center justify-between px-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Tags</span>
            <button onClick={() => setShowAddTag(v => !v)} className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-500 transition" title="Add tag">
              <Plus size={14} />
            </button>
          </div>
          {showAddTag && (
            <div className="mb-2 flex items-center gap-1 px-1">
              <input
                ref={inputRef}
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitNewTag(); if (e.key === 'Escape') setShowAddTag(false) }}
                placeholder="Tag name..."
                className="flex-1 rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-indigo-400 transition"
                style={{ borderColor: 'var(--card-border)', background: 'var(--background)' }}
              />
              <button onClick={submitNewTag} disabled={!newTagName.trim()}
                className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs text-white disabled:opacity-40 hover:bg-indigo-700 transition">Add</button>
            </div>
          )}
          <nav className="mb-5 space-y-0.5">
            {tags.length === 0 && <p className="px-3 py-2 text-xs text-zinc-400">No tags yet</p>}
            {tags.map(tag => {
              const active = activeTagId === tag.id
              return (
                <button key={tag.id} onClick={() => onChangeTag(active ? null : tag.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'}`}>
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                  <span className="min-w-0 flex-1 truncate text-left">{tag.name}</span>
                  <span className="text-xs opacity-50">{tag.note_count ?? 0}</span>
                </button>
              )
            })}
          </nav>

          {/* Tools */}
          <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Tools</div>
          <nav className="mb-4 space-y-0.5">
            {[
              { label: 'Analyzer', icon: BarChart2, path: '/analyze' },
              { label: 'Chapter Notes', icon: BookOpen, path: '/chapter-notes' },
              { label: 'Knowledge Graph', icon: Network, path: '/graph' },
              { label: 'Weekly Digest', icon: CalendarDays, path: '/digest' },
            ].map(t => (
              <button key={t.path} onClick={() => router.push(t.path)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition">
                <t.icon size={17} /><span className="flex-1 text-left">{t.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer user card */}
        <div className="shrink-0 border-t p-4" style={{ borderColor: 'var(--card-border)' }}>
          <div className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: 'var(--background)' }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {email[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-400">{email}</span>
            <button onClick={onSignOut} className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition" title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t md:hidden"
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--card-border)', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {mainItems.map(item => {
          const Icon = item.icon
          const active = activeView === item.key
          return (
            <button key={item.key} onClick={() => onChangeView(item.key)}
              className={`flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition ${active ? 'text-indigo-500' : 'text-zinc-500'}`}>
              <Icon size={18} /><span className="truncate">{item.label}</span>
            </button>
          )
        })}
        <button onClick={() => setShowMore(true)} className="flex flex-col items-center gap-1 py-2 text-[10px] font-medium text-zinc-500">
          <MoreHorizontal size={18} /><span>More</span>
        </button>
      </nav>

      {/* Mobile More sheet */}
      {showMore && (
        <>
          {/* z-[60]: above bottom nav (z-40), below sheet */}
          <div className="fixed inset-0 z-[60] bg-zinc-950/50 backdrop-blur-[2px] md:hidden" onClick={() => setShowMore(false)} />
          {/* z-[61]: topmost layer. flex-col so header + scroll + footer stack cleanly */}
          <div className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[88vh] flex-col rounded-t-3xl shadow-2xl md:hidden" style={{ background: 'var(--sidebar-bg)', borderTop: '1px solid var(--card-border)' }}>
            {/* ── Non-scrolling header ── */}
            <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Sparkles size={17} className="text-white" />
                </div>
                <span className="text-base font-bold">Clear<span className="brand-gradient">Mind</span></span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={toggleTheme} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                  {dark ? <Sun size={15} /> : <Moon size={15} />}
                </button>
                <button onClick={() => setShowMore(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-2">
              {/* Discover */}
              <button onClick={() => { setShowMore(false); router.push('/discover') }}
                className="mb-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 transition"
                style={{ background: 'rgba(99,102,241,0.08)' }}>
                <Compass size={18} /> Discover Community Notes
              </button>

              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Clusters</div>
              <nav className="mb-5 space-y-0.5">
                {defaultClusters.map(cluster => (
                  <button key={cluster} onClick={() => { onChangeView(cluster); setShowMore(false) }} className={itemClass(cluster)}>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: clusterColors[cluster].dot }} />
                    <span className="min-w-0 flex-1 truncate text-left capitalize">{cluster}</span>
                    <span className="text-xs opacity-50">{counts[cluster] ?? 0}</span>
                  </button>
                ))}
              </nav>

              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Tags</span>
                <button onClick={() => setShowAddTag(v => !v)} className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-400 hover:text-indigo-500 transition"><Plus size={14} /></button>
              </div>
              {showAddTag && (
                <div className="mb-2 flex gap-1">
                  <input value={newTagName} onChange={e => setNewTagName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') submitNewTag() }}
                    placeholder="Tag name..." className="flex-1 rounded-lg border px-2 py-1.5 text-xs outline-none focus:border-indigo-400"
                    style={{ borderColor: 'var(--card-border)', background: 'var(--background)' }} />
                  <button onClick={submitNewTag} disabled={!newTagName.trim()} className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs text-white disabled:opacity-40">Add</button>
                </div>
              )}
              <nav className="mb-5 space-y-0.5">
                {tags.length === 0 && <p className="px-3 py-2 text-xs text-zinc-400">No tags yet</p>}
                {tags.map(tag => (
                  <button key={tag.id} onClick={() => { onChangeTag(activeTagId === tag.id ? null : tag.id); setShowMore(false) }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${activeTagId === tag.id ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60'}`}>
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="min-w-0 flex-1 truncate text-left">{tag.name}</span>
                  </button>
                ))}
              </nav>

              <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">Tools</div>
              <nav className="space-y-0.5">
                {[
                  { label: 'Analyzer', icon: BarChart2, path: '/analyze' },
                  { label: 'Chapter Notes', icon: BookOpen, path: '/chapter-notes' },
                  { label: 'Knowledge Graph', icon: Network, path: '/graph' },
                  { label: 'Weekly Digest', icon: CalendarDays, path: '/digest' },
                ].map(t => (
                  <button key={t.path} onClick={() => { setShowMore(false); router.push(t.path) }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition">
                    <t.icon size={17} /><span className="flex-1 text-left">{t.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* ── Sticky footer with safe-area ── */}
            <div className="shrink-0 border-t px-5 py-3" style={{ borderColor: 'var(--card-border)', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
              <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: 'var(--background)' }}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {email[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-400">{email}</span>
                <button onClick={onSignOut} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition">
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
