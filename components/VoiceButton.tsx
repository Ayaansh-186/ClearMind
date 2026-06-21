'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Loader2, X } from 'lucide-react'
import type { Note } from '@/lib/types'

type RecordingState = 'idle' | 'recording' | 'transcribing' | 'error'

type Props = {
  userId: string
  onCreate: (note: Note) => void
  disabled?: boolean
  onRecordingChange?: (recording: boolean) => void
}

const MAX_DURATION_MS = 120_000 // 2 minutes

export function VoiceButton({ userId, onCreate, disabled, onRecordingChange }: Props) {
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [bars, setBars] = useState<number[]>(Array(12).fill(3))

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // ── Waveform animation ────────────────────────────────────────────────────
  const animateBars = useCallback(() => {
    if (!analyserRef.current) return
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Sample 12 evenly-spaced frequency buckets
    const bucketSize = Math.floor(dataArray.length / 12)
    const newBars = Array.from({ length: 12 }, (_, i) => {
      const start = i * bucketSize
      const slice = dataArray.slice(start, start + bucketSize)
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length
      // Map 0-255 → 3-28px
      return Math.max(3, Math.round((avg / 255) * 28))
    })

    setBars(newBars)
    animFrameRef.current = requestAnimationFrame(animateBars)
  }, [])

  // ── Start recording ───────────────────────────────────────────────────────
  async function startRecording() {
    setErrorMsg(null)
    setState('recording')
    setDuration(0)
    chunksRef.current = []
    onRecordingChange?.(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up Web Audio analyser for waveform
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      animFrameRef.current = requestAnimationFrame(animateBars)

      // Choose a supported MIME type
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ].find(t => MediaRecorder.isTypeSupported(t)) ?? ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => submitRecording()

      recorder.start(100) // collect in 100ms chunks

      // Duration counter
      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d + 1 >= MAX_DURATION_MS / 1000) stopRecording()
          return d + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Mic error:', err)
      setState('error')
      setErrorMsg('Microphone access denied.')
      onRecordingChange?.(false)
      setTimeout(() => setState('idle'), 3000)
    }
  }

  // ── Stop recording ────────────────────────────────────────────────────────
  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    setBars(Array(12).fill(3))
    onRecordingChange?.(false)

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }

  // ── Cancel recording ──────────────────────────────────────────────────────
  function cancelRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    setBars(Array(12).fill(3))
    onRecordingChange?.(false)

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      // Prevent onstop from firing submission
      recorder.onstop = null
      recorder.stop()
    }

    chunksRef.current = []
    setState('idle')
    setDuration(0)
    setErrorMsg(null)
  }

  // ── Submit to /api/notes/voice ────────────────────────────────────────────
  async function submitRecording() {
    setState('transcribing')

    const mimeType = chunksRef.current[0]?.type || 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })

    if (blob.size < 1000) {
      setState('error')
      setErrorMsg('Recording too short.')
      setTimeout(() => setState('idle'), 3000)
      return
    }

    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')
    formData.append('user_id', userId)

    // Optimistic placeholder
    const optimistic: Note = {
      id: `temp-${crypto.randomUUID()}`,
      user_id: userId,
      raw_content: '🎙️ Transcribing voice note…',
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

    try {
      const res = await fetch('/api/notes/voice', { method: 'POST', body: formData })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Transcription failed')
      }

      const note: Note = await res.json()
      onCreate(note) // replace optimistic
      setState('idle')
      setDuration(0)
    } catch (err) {
      console.error('Voice note error:', err)
      setState('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  function formatDuration(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (state === 'recording') {
    return (
      <div className="flex items-center gap-2">
        {/* Waveform visualiser */}
        <div className="flex items-end gap-[2px] h-7 px-1" aria-hidden>
          {bars.map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-red-500 transition-all duration-75"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        {/* Duration */}
        <span className="text-xs tabular-nums text-red-500 font-medium min-w-[32px]">
          {formatDuration(duration)}
        </span>

        {/* Cancel */}
        <button
          type="button"
          onClick={cancelRecording}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition dark:hover:bg-zinc-800"
          aria-label="Cancel recording"
        >
          <X size={15} />
        </button>

        {/* Stop / send */}
        <button
          type="button"
          onClick={stopRecording}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-red-500 px-3 text-xs font-medium text-white hover:bg-red-600 transition active:scale-95"
          aria-label="Stop and transcribe"
        >
          <MicOff size={14} />
          Done
        </button>
      </div>
    )
  }

  if (state === 'transcribing') {
    return (
      <div className="flex items-center gap-2">
        <Loader2 size={15} className="animate-spin text-zinc-400" />
        <span className="text-xs text-zinc-400">Transcribing…</span>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <span className="text-xs text-red-500">{errorMsg}</span>
    )
  }

  // idle
  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white hover:text-red-500 dark:hover:bg-zinc-800 dark:hover:text-red-400 disabled:opacity-40"
      aria-label="Record voice note"
      title="Record voice note"
    >
      <Mic size={19} />
    </button>
  )
}
