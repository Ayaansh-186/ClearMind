'use client'

import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { Archive, Globe, GlobeLock, Loader2, Network, Sparkles, X, Copy, Check, Link, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { clusterColors, type Note } from '@/lib/types'

type Props = {
  note: Note | null
  onClose: () => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onUpdate: (note: Note) => void
}

type DiagramNode = { id: string; label: string; children?: string[] }
type Diagram = { title: string; nodes: DiagramNode[] }

function MindMap({ diagram }: { diagram: Diagram }) {
  const root = diagram.nodes[0]
  const children = diagram.nodes.slice(1)
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-zinc-400">{diagram.title}</p>
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-lg bg-zinc-950 px-4 py-2 text-center text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">{root?.label}</div>
        {children.length > 0 && <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />}
        <div className="flex flex-wrap justify-center gap-2">
          {children.map((node, i) => {
            const color = ['#7F77DD','#1D9E75','#D85A30','#378ADD','#639922'][i % 5]
            return (
              <div key={node.id} className="flex flex-col items-center gap-1">
                <div className="rounded-md px-3 py-1.5 text-center text-xs font-medium text-white" style={{ backgroundColor: color }}>{node.label}</div>
                {node.children && node.children.length > 0 && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-2 w-px bg-zinc-300 dark:bg-zinc-700" />
                    <div className="flex flex-wrap justify-center gap-1">
                      {node.children.map((child, j) => (
                        <div key={j} className="rounded px-2 py-1 text-center text-xs" style={{ backgroundColor: color + '22', color }}>{child}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function NoteDetail({ note, onClose, onArchive, onRestore, onUpdate }: Props) {
  const [view, setView] = useState<'raw' | 'formatted' | 'diagram'>('raw')
  const [formatting, setFormatting] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [explaining, setExplaining] = useState(false)
  const [diagram, setDiagram] = useState<Diagram | null>(null)
  const [diagError, setDiagError] = useState('')
  const [sharing, setSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [isShared, setIsShared] = useState(false)

  if (!note) return null
  const colors = note.cluster ? clusterColors[note.cluster] : null

  async function formatNote() {
    setFormatting(true)
    try {
      const res = await fetch('/api/notes/format', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note_id: note!.id, content: note!.raw_content }) })
      if (res.ok) { const data = await res.json(); onUpdate({ ...note!, formatted_content: data.formatted_content }); setView('formatted') }
    } finally { setFormatting(false) }
  }

  async function enhanceNote() {
    setEnhancing(true)
    try {
      const res = await fetch('/api/notes/enhance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note_id: note!.id, content: note!.raw_content }) })
      if (res.ok) { const data = await res.json(); onUpdate({ ...note!, formatted_content: data.enhanced_content }); setView('formatted') }
    } finally { setEnhancing(false) }
  }

  async function explainNote() {
    setExplaining(true); setDiagError(''); setView('diagram')
    try {
      const res = await fetch('/api/notes/explain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: note!.raw_content }) })
      if (res.ok) { const data = await res.json(); setDiagram(data.diagram) }
      else setDiagError('Could not generate diagram. Try again.')
    } catch { setDiagError('Could not generate diagram. Try again.') }
    finally { setExplaining(false) }
  }

  async function toggleShare() {
    setSharing(true)
    try {
      if (!isShared) {
        const res = await fetch('/api/notes/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note_id: note!.id, action: 'enable' }) })
        const data = await res.json()
        const url = `${window.location.origin}/shared/${data.share_id}`
        setShareUrl(url)
        setIsShared(true)
      } else {
        await fetch('/api/notes/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note_id: note!.id, action: 'disable' }) })
        setShareUrl('')
        setIsShared(false)
      }
    } finally { setSharing(false) }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[440px] border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 p-4 shrink-0">
        <div className="min-w-0 pr-2">
          <h2 className="truncate text-lg font-semibold">{note.title ?? 'Untitled note'}</h2>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {colors && <span className="rounded-full px-2.5 py-1 text-xs font-medium capitalize" style={{ backgroundColor: colors.bg, color: colors.text }}>{note.cluster}</span>}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < note.relevance ? 'bg-zinc-950 dark:bg-zinc-50' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
              ))}
              <span className="ml-1 text-xs text-zinc-400">{note.relevance}/10</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"><X size={19} /></button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {note.image_url && (
          <div className="relative mb-5 aspect-video overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Image src={note.image_url} alt="Source image" fill className="object-cover" sizes="440px" />
          </div>
        )}

        {/* Share section */}
        <div className={`mb-4 rounded-xl border p-3 transition ${isShared ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isShared ? <Globe size={15} className="text-green-600 shrink-0" /> : <GlobeLock size={15} className="text-zinc-400 shrink-0" />}
              <span className="text-xs font-medium">{isShared ? 'Anyone with link can view & comment' : 'Note is private'}</span>
            </div>
            <button onClick={toggleShare} disabled={sharing}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isShared ? 'bg-red-100 dark:bg-red-950/30 text-red-600 hover:bg-red-200' : 'bg-zinc-950 dark:bg-white dark:text-zinc-950 text-white hover:bg-zinc-800'} disabled:opacity-50`}>
              {sharing ? <Loader2 size={12} className="animate-spin inline" /> : isShared ? 'Stop sharing' : 'Share'}
            </button>
          </div>
          {isShared && shareUrl && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-500 truncate">{shareUrl}</div>
              <button onClick={copyLink} className="flex items-center gap-1 rounded-lg bg-green-600 hover:bg-green-700 px-2.5 py-1.5 text-xs text-white transition">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* View tabs */}
        <div className="mb-5 flex rounded-md bg-zinc-100 p-1 dark:bg-zinc-900">
          {(['raw', 'formatted', 'diagram'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-1 rounded px-2 py-2 text-xs font-medium capitalize transition ${view === v ? 'bg-white shadow-sm dark:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
              {v === 'diagram' ? '🗺 Diagram' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {view === 'raw' && <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-300">{note.raw_content}</p>}

        {view === 'formatted' && note.formatted_content && (
          <div className="text-sm leading-7 text-zinc-700 dark:text-zinc-300 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:font-medium [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_p]:mb-3 [&_strong]:font-semibold">
            <ReactMarkdown>{note.formatted_content}</ReactMarkdown>
          </div>
        )}
        {view === 'formatted' && !note.formatted_content && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
            <Sparkles size={24} className="mb-3" />
            <p className="text-sm">Click "Format with AI" or "Enhance with Google" below</p>
          </div>
        )}
        {view === 'diagram' && explaining && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
            <Loader2 size={24} className="mb-3 animate-spin" /><p className="text-sm">Building diagram...</p>
          </div>
        )}
        {view === 'diagram' && !explaining && diagError && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">{diagError}</div>}
        {view === 'diagram' && !explaining && diagram && <MindMap diagram={diagram} />}
        {view === 'diagram' && !explaining && !diagram && !diagError && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400">
            <Network size={24} className="mb-3" /><p className="text-sm">Click "Explain with Diagram" to visualize this note</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 p-4 shrink-0">
        <button onClick={enhanceNote} disabled={enhancing} className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60 hover:bg-emerald-700">
          {enhancing ? <Loader2 size={17} className="animate-spin" /> : <Globe size={17} />}
          {enhancing ? 'Searching Google...' : 'Enhance with Google'}
        </button>
        <button onClick={explainNote} disabled={explaining} className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60 hover:bg-indigo-700">
          {explaining ? <Loader2 size={17} className="animate-spin" /> : <Network size={17} />}
          {explaining ? 'Building diagram...' : 'Explain with Diagram'}
        </button>
        <button onClick={formatNote} disabled={formatting} className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 py-3 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-950">
          {formatting ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
          {formatting ? 'Formatting...' : 'Format with AI'}
        </button>
        {note.is_archived ? (
          <button onClick={() => onRestore(note.id)} className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <RotateCcw size={17} /> Restore note
          </button>
        ) : (
          <button onClick={() => onArchive(note.id)} className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <Archive size={17} /> Archive note
          </button>
        )}
      </div>
    </div>
  )
}
