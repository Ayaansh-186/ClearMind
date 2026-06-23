'use client'

import { useRef, useState } from 'react'
import { Camera, LayoutTemplate, Loader2, SendHorizonal } from 'lucide-react'
import type { Note } from '@/lib/types'
import { VoiceButton } from '@/components/VoiceButton'
import { TemplatesModal } from '@/components/TemplatesModal'

type Props = { userId: string; onCreate: (note: Note) => void }

export function CaptureBar({ userId, onCreate }: Props) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function submitText() {
    const raw = text.trim()
    if (!raw || busy) return
    const optimistic: Note = {
      id: `temp-${crypto.randomUUID()}`,
      user_id: userId,
      raw_content: raw,
      formatted_content: null,
      title: null,
      cluster: null,
      relevance: 5,
      image_url: null,
      is_archived: false,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    onCreate(optimistic)
    setText('')
    setBusy(true)
    setStatus('Thinking...')
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_content: raw, user_id: userId }),
      })
      if (res.ok) onCreate(await res.json())
    } finally { setBusy(false); setStatus('') }
  }

  async function submitImage(file?: File) {
    if (!file || busy) return
    setBusy(true)
    setStatus('Reading image...')
    const formData = new FormData()
    formData.append('image', file)
    formData.append('user_id', userId)
    try {
      const res = await fetch('/api/notes/image', { method: 'POST', body: formData })
      if (res.ok) onCreate(await res.json())
    } finally {
      setBusy(false)
      setStatus('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      {showTemplates && <TemplatesModal onSelect={body => setText(body)} onClose={() => setShowTemplates(false)} />}

      <div className="fixed inset-x-0 bottom-[var(--mobile-nav-offset)] z-20 md:sticky md:inset-x-auto md:bottom-0"
        style={{ background: 'var(--background)', borderTop: '1px solid var(--card-border)' }}>
        <div className="mx-auto max-w-5xl px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          {status && (
            <div className="mb-2 flex items-center gap-2 px-1">
              <Loader2 size={11} className="animate-spin text-indigo-400" />
              <span className="text-xs text-zinc-400">{status}</span>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-2xl p-2 shadow-lg transition-shadow focus-within:shadow-xl"
            style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>

            <button type="button" onClick={() => setShowTemplates(true)} disabled={busy}
              className={`${recording ? 'hidden sm:flex' : 'flex'} h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 disabled:opacity-40`}
              title="Templates">
              <LayoutTemplate size={18} />
            </button>

            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
              className={`${recording ? 'hidden sm:flex' : 'flex'} h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 disabled:opacity-40`}
              title="Upload image">
              <Camera size={18} />
            </button>

            <VoiceButton userId={userId} onCreate={onCreate} disabled={busy} onRecordingChange={setRecording} />

            <span className="h-5 w-px shrink-0" style={{ background: 'var(--card-border)' }} />

            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitText() } }}
              disabled={busy}
              placeholder="What's on your mind? AI will organise it..."
              className={`min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-zinc-400 disabled:opacity-50 ${recording ? 'hidden sm:block' : ''}`}
            />

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => submitImage(e.target.files?.[0])} />

            <button type="button" onClick={submitText} disabled={busy || !text.trim()}
              className={`${recording ? 'hidden sm:flex' : 'flex'} h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition disabled:opacity-30`}
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {busy ? <Loader2 size={17} className="animate-spin" /> : <SendHorizonal size={17} />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
