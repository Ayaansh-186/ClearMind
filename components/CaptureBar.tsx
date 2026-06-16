'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, SendHorizonal } from 'lucide-react'
import type { Note } from '@/lib/types'
import { VoiceButton } from '@/components/VoiceButton'

type Props = { userId: string; onCreate: (note: Note) => void }

export function CaptureBar({ userId, onCreate }: Props) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    onCreate(optimistic)
    setText('')
    setBusy(true)
    setStatus('Saving...')

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_content: raw, user_id: userId }),
      })
      if (res.ok) onCreate(await res.json())
    } catch (err) {
      console.error('Failed to save note:', err)
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  async function submitImage(file?: File) {
    if (!file || busy) return
    setBusy(true)
    setStatus('Extracting from image...')

    const formData = new FormData()
    formData.append('image', file)
    formData.append('user_id', userId)

    try {
      const res = await fetch('/api/notes/image', { method: 'POST', body: formData })
      if (res.ok) onCreate(await res.json())
    } catch (err) {
      console.error('Failed to upload image:', err)
    } finally {
      setBusy(false)
      setStatus('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="sticky bottom-0 z-20 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto max-w-5xl">
        {/* Status bar */}
        {status && (
          <div className="mb-2 flex items-center gap-2 px-1">
            <Loader2 size={12} className="animate-spin text-zinc-400" />
            <span className="text-xs text-zinc-400">{status}</span>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2 shadow-sm transition-shadow focus-within:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
          {/* Image upload */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 disabled:opacity-40"
            aria-label="Upload image"
          >
            <Camera size={19} />
          </button>

          {/* Voice recorder */}
          <VoiceButton userId={userId} onCreate={onCreate} disabled={busy} />

          {/* Divider */}
          <span className="h-5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" aria-hidden />

          {/* Text input */}
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitText() } }}
            disabled={busy}
            placeholder="Dump any thought here — AI will sort it..."
            className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-zinc-400 disabled:opacity-50"
          />

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => submitImage(e.target.files?.[0])} />

          {/* Send */}
          <button
            type="button"
            onClick={submitText}
            disabled={busy || !text.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-800 disabled:opacity-30 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            aria-label="Save note"
          >
            {busy ? <Loader2 size={17} className="animate-spin" /> : <SendHorizonal size={17} />}
          </button>
        </div>
      </div>
    </div>
  )
}
