'use client'

import { useEffect, useState } from 'react'
import { X, Clock, RotateCcw, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react'
import type { Note } from '@/lib/types'

type Version = {
  id: string
  note_id: string
  raw_content: string
  title: string | null
  version_label: string | null
  created_at: string
}

type Props = {
  note: Note
  userId: string
  onClose: () => void
  onRestore: (content: string, title: string | null) => Promise<void>
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function fullDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function VersionHistoryPanel({ note, userId, onClose, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [restored, setRestored] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/notes/${note.id}/versions?user_id=${userId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setVersions(data)
        else setError(data?.error ?? 'Failed to load history')
      })
      .catch(() => setError('Failed to load history'))
      .finally(() => setLoading(false))
  }, [note.id, userId])

  async function handleRestore(version: Version) {
    setRestoring(version.id)
    try {
      await onRestore(version.raw_content, version.title)
      setRestored(version.id)
      setTimeout(() => setRestored(null), 2500)
    } catch {
      // parent shows error
    } finally {
      setRestoring(null)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-zinc-950/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <Clock size={17} className="text-zinc-400" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Version history</h3>
              <p className="text-xs text-zinc-400">Saved before each edit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition dark:hover:bg-zinc-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current version pill */}
        <div className="mx-5 mt-4 mb-2 shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">
                {note.title ?? 'Untitled note'}
              </p>
              <p className="text-xs text-zinc-400">Current version</p>
            </div>
            <span className="shrink-0 text-xs text-zinc-400">{timeAgo(note.updated_at)}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 flex items-center gap-2 shrink-0">
          <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-400">
            {versions.length} saved {versions.length === 1 ? 'version' : 'versions'}
          </span>
          <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading && (
            <div className="flex items-center justify-center py-12 text-zinc-400">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-zinc-400">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && versions.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-zinc-400">
              <Clock size={24} className="opacity-40" />
              <div>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No versions yet</p>
                <p className="mt-1 text-xs leading-relaxed">
                  A snapshot is saved every time you edit this note. Edit it once to see history appear here.
                </p>
              </div>
            </div>
          )}

          {!loading && !error && versions.length > 0 && (
            <div className="space-y-2">
              {versions.map((v, i) => {
                const isExpanded = expanded === v.id
                const isRestoring = restoring === v.id
                const isRestored = restored === v.id
                const preview = v.raw_content.slice(0, 120) + (v.raw_content.length > 120 ? '…' : '')

                return (
                  <div
                    key={v.id}
                    className="rounded-xl border border-zinc-200 bg-white transition dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {/* Version header */}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : v.id)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left"
                    >
                      {/* Timeline dot */}
                      <div className="flex shrink-0 flex-col items-center">
                        <span className="h-2.5 w-2.5 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
                        {i < versions.length - 1 && (
                          <span className="mt-1 h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                            {v.version_label ?? `Version ${versions.length - i}`}
                          </span>
                          {v.title && (
                            <span className="truncate text-xs text-zinc-400">{v.title}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400" title={fullDate(v.created_at)}>
                          {fullDate(v.created_at)}
                        </span>
                      </div>

                      {isExpanded
                        ? <ChevronUp size={14} className="shrink-0 text-zinc-400" />
                        : <ChevronDown size={14} className="shrink-0 text-zinc-400" />
                      }
                    </button>

                    {/* Expanded preview + restore */}
                    {isExpanded && (
                      <div className="border-t border-zinc-100 px-3 pb-3 pt-2 dark:border-zinc-800">
                        <p className="mb-3 whitespace-pre-wrap text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {preview}
                        </p>
                        <button
                          onClick={() => handleRestore(v)}
                          disabled={isRestoring}
                          className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                            isRestored
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100'
                          } disabled:opacity-50`}
                        >
                          {isRestoring ? (
                            <><Loader2 size={12} className="animate-spin" /> Restoring…</>
                          ) : isRestored ? (
                            <>✓ Restored</>
                          ) : (
                            <><RotateCcw size={12} /> Restore this version</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div
          className="shrink-0 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <p className="text-[11px] leading-relaxed text-zinc-400">
            Restoring a version saves the current note as a new version first, so nothing is lost.
          </p>
        </div>
      </div>
    </>
  )
}
