'use client'

import { Pin, CheckCircle2, Circle } from 'lucide-react'
import { clusterColors, type Note } from '@/lib/types'
import { TagChips } from '@/components/TagPicker'

type Props = {
  note: Note
  onOpen: (note: Note) => void
  onTogglePin?: (note: Note) => void
  selectable?: boolean
  selected?: boolean
  onSelect?: (note: Note) => void
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.floor(diff / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function NoteCard({ note, onOpen, onTogglePin, selectable, selected, onSelect }: Props) {
  const colors = note.cluster ? clusterColors[note.cluster] : null
  const isProcessing = !note.title

  function handleClick(e: React.MouseEvent) {
    if (selectable || onSelect) { e.preventDefault(); onSelect?.(note); return }
    onOpen(note)
  }

  function handlePinClick(e: React.MouseEvent) {
    e.stopPropagation()
    onTogglePin?.(note)
  }

  let pressTimer: ReturnType<typeof setTimeout> | null = null
  function onTouchStart() { pressTimer = setTimeout(() => onSelect?.(note), 500) }
  function onTouchEnd() { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null } }

  return (
    <button
      onClick={handleClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchEnd}
      className={`group relative flex min-h-[13rem] w-full flex-col rounded-2xl text-left transition-all duration-200 card-lift overflow-hidden ${
        selected
          ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20'
          : ''
      }`}
      style={{
        background: selected ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--card)',
        border: `1px solid ${selected ? 'transparent' : 'var(--card-border)'}`,
      }}
    >
      {/* Cluster left-border accent */}
      {colors && !selected && (
        <span
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ backgroundColor: colors.dot }}
        />
      )}

      {/* Checkbox — visible on hover (desktop) and always in select mode */}
      {(selectable || onSelect) && (
        <span
          role="button"
          title="Select note"
          onClick={e => { e.stopPropagation(); onSelect?.(note) }}
          className={`absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full transition-opacity ${
            selectable ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {selected
            ? <CheckCircle2 size={20} className="text-white" fill="currentColor" />
            : <Circle size={20} className="text-zinc-300 dark:text-zinc-600" />}
        </span>
      )}

      {/* Pin */}
      {!selectable && onTogglePin && (
        <span
          role="button"
          tabIndex={0}
          onClick={handlePinClick}
          onKeyDown={e => { if (e.key === 'Enter') handlePinClick(e as unknown as React.MouseEvent) }}
          aria-label={note.is_pinned ? 'Unpin' : 'Pin'}
          className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full transition-opacity ${
            note.is_pinned ? 'text-amber-500 opacity-100' : 'text-zinc-300 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100'
          }`}
        >
          <Pin size={14} fill={note.is_pinned ? 'currentColor' : 'none'} />
        </span>
      )}

      <div className="flex flex-1 flex-col p-5 pl-6">
        {/* Cluster badge + time */}
        <div className="mb-3 flex items-center justify-between gap-2 pr-7">
          {colors ? (
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide capitalize"
              style={selected
                ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                : { backgroundColor: colors.bg, color: colors.text }}
            >
              {note.cluster}
            </span>
          ) : (
            <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium text-zinc-400" style={{ background: 'var(--background)' }}>
              {isProcessing ? (
                <span className="flex items-center gap-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="inline-block h-1 w-1 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              ) : 'unsorted'}
            </span>
          )}
          <span className={`shrink-0 text-[11px] ${selected ? 'text-white/70' : 'text-zinc-400'}`}>
            {relativeTime(note.created_at)}
          </span>
        </div>

        {/* Title */}
        {isProcessing ? (
          <div className="space-y-2">
            <div className="h-5 w-3/4 animate-pulse rounded-lg" style={{ background: 'var(--card-border)' }} />
            <div className="h-4 w-1/2 animate-pulse rounded-lg" style={{ background: 'var(--card-border)' }} />
          </div>
        ) : (
          <h3 className={`line-clamp-2 text-[15px] font-semibold leading-snug ${selected ? 'text-white' : 'text-zinc-900 dark:text-zinc-50'}`}>
            {note.title}
          </h3>
        )}

        {/* Preview */}
        <p className={`mt-2 line-clamp-2 text-[13px] leading-relaxed ${selected ? 'text-white/70' : 'text-zinc-500 dark:text-zinc-400'}`}>
          {note.raw_content}
        </p>

        {/* Tags */}
        {note.tags && note.tags.length > 0 && !selected && (
          <div className="mt-3"><TagChips tags={note.tags} /></div>
        )}

        {/* Relevance bar */}
        <div className="mt-auto flex items-center gap-0.5 pt-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                backgroundColor: i < note.relevance
                  ? selected ? 'rgba(255,255,255,0.8)' : (colors?.dot ?? '#6366f1')
                  : selected ? 'rgba(255,255,255,0.15)' : 'var(--card-border)',
              }}
            />
          ))}
          <span className={`ml-2 text-[11px] shrink-0 ${selected ? 'text-white/60' : 'text-zinc-400'}`}>{note.relevance}/10</span>
        </div>
      </div>
    </button>
  )
}
