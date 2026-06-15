'use client'

import { Archive, Brain, Clock3, BarChart2, BookOpen, Lightbulb, LogOut, Moon, Sun, Sparkles, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, type ElementType } from 'react'
import { clusterColors, clusters as defaultClusters, type Cluster, type Note } from '@/lib/types'

export type ViewKey = 'surface' | 'all' | 'recent' | 'archived' | string

type Props = {
  activeView: ViewKey
  counts: Record<string, number>
  email?: string
  now: number
  notes: Note[]
  onChangeView: (view: ViewKey) => void
  onSignOut: () => void
}

const mainItems: { key: ViewKey; label: string; icon: ElementType }[] = [
  { key: 'surface', label: 'What matters now', icon: Sparkles },
  { key: 'all', label: 'All notes', icon: Brain },
  { key: 'recent', label: 'Recent', icon: Clock3 },
  { key: 'archived', label: 'Archived', icon: Archive },
]

const CUSTOM_COLORS = [
  { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  { bg: '#FCE7F3', text: '#9D174D', dot: '#EC4899' },
  { bg: '#E0E7FF', text: '#3730A3', dot: '#6366F1' },
  { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  { bg: '#F3E8FF', text: '#6B21A8', dot: '#A855F7' },
]

export function Sidebar({ activeView, counts, email, now, notes, onChangeView, onSignOut }: Props) {
  const router = useRouter()
  const [dark, setDark] = useState(false)
  const [customClusters, setCustomClusters] = useState<string[]>([])
  const [showAddCluster, setShowAddCluster] = useState(false)
  const [newClusterName, setNewClusterName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Dark mode
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved ? saved === 'dark' : prefersDark
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
    // Custom clusters
    const saved2 = localStorage.getItem('custom_clusters')
    if (saved2) {
      try { setCustomClusters(JSON.parse(saved2)) } catch {}
    }
  }, [])

  useEffect(() => {
    if (showAddCluster) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showAddCluster])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  function addCluster() {
    const name = newClusterName.trim().toLowerCase().replace(/\s+/g, '-')
    if (!name || customClusters.includes(name) || defaultClusters.includes(name as Cluster)) return
    const next = [...customClusters, name]
    setCustomClusters(next)
    localStorage.setItem('custom_clusters', JSON.stringify(next))
    setNewClusterName('')
    setShowAddCluster(false)
    onChangeView(name)
  }

  function removeCluster(name: string) {
    const next = customClusters.filter(c => c !== name)
    setCustomClusters(next)
    localStorage.setItem('custom_clusters', JSON.stringify(next))
    if (activeView === name) onChangeView('all')
  }

  function getCustomColor(index: number) {
    return CUSTOM_COLORS[index % CUSTOM_COLORS.length]
  }

  const allClusters = [...defaultClusters, ...customClusters]

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

        {/* Clusters */}
        <div className="mt-6 flex items-center justify-between px-3">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Clusters</span>
          <button onClick={() => setShowAddCluster(v => !v)}
            className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-600 transition"
            title="Add custom cluster">
            <Plus size={13} />
          </button>
        </div>

        {/* Add cluster input */}
        {showAddCluster && (
          <div className="mt-2 mx-1 flex items-center gap-1">
            <input
              ref={inputRef}
              value={newClusterName}
              onChange={e => setNewClusterName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCluster(); if (e.key === 'Escape') setShowAddCluster(false) }}
              placeholder="Cluster name..."
              className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs outline-none focus:border-zinc-500"
            />
            <button onClick={addCluster} disabled={!newClusterName.trim()}
              className="rounded-md bg-zinc-950 dark:bg-white px-2 py-1.5 text-xs text-white dark:text-zinc-950 disabled:opacity-40 hover:bg-zinc-800 transition">
              Add
            </button>
          </div>
        )}

        <nav className="mt-2 space-y-1 flex-1 overflow-y-auto">
          {defaultClusters.map(cluster => (
            <button key={cluster} onClick={() => onChangeView(cluster)} className={itemClass(cluster)}>
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: clusterColors[cluster].dot }} />
              <span className="min-w-0 flex-1 truncate text-left capitalize">{cluster}</span>
              <span className="text-xs opacity-60">{counts[cluster] ?? 0}</span>
            </button>
          ))}
          {customClusters.map((cluster, i) => {
            const color = getCustomColor(i)
            return (
              <div key={cluster} className="group flex items-center">
                <button onClick={() => onChangeView(cluster)} className={`${itemClass(cluster)} flex-1`}>
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color.dot }} />
                  <span className="min-w-0 flex-1 truncate text-left capitalize">{cluster}</span>
                  <span className="text-xs opacity-60">{counts[cluster] ?? 0}</span>
                </button>
                <button onClick={() => removeCluster(cluster)}
                  className="mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                  <X size={11} />
                </button>
              </div>
            )
          })}
        </nav>

        {/* Tools */}
        <div className="mt-4 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Tools</div>
        <nav className="mt-2 space-y-1">
          <button onClick={() => router.push('/analyze')} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition">
            <BarChart2 size={17} /><span className="flex-1 text-left">Performance Analyzer</span>
          </button>
          <button onClick={() => router.push('/chapter-notes')} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition">
            <BookOpen size={17} /><span className="flex-1 text-left">Chapter Notes</span>
          </button>
        </nav>

        {/* User */}
        <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="truncate text-sm font-medium">{email}</div>
          <button onClick={onSignOut} className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-zinc-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        {mainItems.map(item => {
          const Icon = item.icon
          return (
            <button key={item.key} onClick={() => onChangeView(item.key)} className={`flex flex-col items-center gap-1 rounded-md py-2 text-[11px] ${activeView === item.key ? 'text-zinc-950 dark:text-white' : 'text-zinc-500'}`}>
              <Icon size={18} /><span className="truncate max-w-[56px]">{item.label}</span>
            </button>
          )
        })}
        <button onClick={toggleTheme} className="flex flex-col items-center gap-1 rounded-md py-2 text-[11px] text-zinc-500">
          {dark ? <Sun size={18} /> : <Moon size={18} />}<span>Theme</span>
        </button>
      </nav>
    </>
  )
}
