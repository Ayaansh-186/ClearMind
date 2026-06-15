'use client'

import { clusterColors, type Note } from '@/lib/types'

type Props = { note: Note; onOpen: (note: Note) => void }

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.floor(diff / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function NoteCard({ note, onOpen }: Props) {
  const colors = note.cluster ? clusterColors[note.cluster] : null
  const isProcessing = !note.title

  return (
    <button
      onClick={() => onOpen(note)}
      className="group flex min-h-[13rem] w-full flex-col rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
    >
      {/* Top row */}
      <div className="mb-4 flex items-center justify-between gap-2">
        {colors ? (
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {note.cluster}
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-400 dark:bg-zinc-900">
            {isProcessing ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '0ms' }} />
                <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '150ms' }} />
                <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '300ms' }} />
              </span>
            ) : 'unsorted'}
          </span>
        )}
        <span className="shrink-0 text-xs text-zinc-400">{relativeTime(note.created_at)}</span>
      </div>

      {/* Title */}
      {isProcessing ? (
        <div className="space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-4 w-1/2 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
        </div>
      ) : (
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-zinc-950 dark:text-zinc-50">
          {note.title}
        </h3>
      )}

      {/* Preview */}
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {note.raw_content}
      </p>

      {/* Relevance dots */}
      <div className="mt-auto flex items-center gap-1 pt-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full transition-colors ${i < note.relevance ? 'bg-zinc-800 dark:bg-zinc-200' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
        ))}
        <span className="ml-1.5 text-xs text-zinc-400">{note.relevance}/10</span>
      </div>
    </button>
  )
}
