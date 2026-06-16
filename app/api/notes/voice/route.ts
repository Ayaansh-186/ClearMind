import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/notes/voice
 *
 * Accepts multipart/form-data with:
 *   - audio: Blob (webm/ogg/wav from MediaRecorder)
 *   - user_id: string
 *
 * Pipeline:
 *   1. Forward audio to Groq Whisper (whisper-large-v3-turbo) for transcription
 *   2. Insert note with transcript as raw_content
 *   3. Fire-and-forget cluster/title/relevance tagging
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as File | null
    const userId = formData.get('user_id') as string | null

    if (!audio || !userId) {
      return NextResponse.json(
        { error: 'audio and user_id are required' },
        { status: 400 }
      )
    }

    // ── 1. Transcribe with Groq Whisper ──────────────────────────────────────
    const groqForm = new FormData()
    // Groq requires a filename with a recognised extension — rename blob to .webm
    const audioFile = new File([audio], 'recording.webm', { type: audio.type || 'audio/webm' })
    groqForm.append('file', audioFile)
    groqForm.append('model', 'whisper-large-v3-turbo')
    groqForm.append('response_format', 'json')
    groqForm.append('language', 'en')
    groqForm.append(
      'prompt',
      'This is a voice note. Transcribe accurately, preserving all ideas, names, and details.'
    )

    const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: groqForm,
    })

    if (!whisperRes.ok) {
      const err = await whisperRes.json().catch(() => ({}))
      console.error('Whisper error:', err)
      return NextResponse.json(
        { error: err?.error?.message ?? 'Transcription failed' },
        { status: 502 }
      )
    }

    const { text: transcript } = await whisperRes.json() as { text: string }

    if (!transcript?.trim()) {
      return NextResponse.json(
        { error: 'No speech detected in recording' },
        { status: 422 }
      )
    }

    console.log('✓ Transcribed:', transcript.slice(0, 120))

    // ── 2. Insert note ────────────────────────────────────────────────────────
    const raw_content = `🎙️ ${transcript.trim()}`

    const { data: note, error: insertError } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        raw_content,
        title: null,
        cluster: null,
        relevance: 5,
        is_archived: false,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // ── 3. Trigger clustering (fire-and-forget) ───────────────────────────────
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      request.headers.get('origin') ??
      'http://localhost:3000'

    fetch(`${origin}/api/notes/cluster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_id: note.id, content: raw_content }),
    }).catch(err => console.error('Cluster error:', err))

    console.log('✓ Voice note created:', note.id)
    return NextResponse.json(note)
  } catch (err) {
    console.error('VOICE ROUTE FAILED:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
