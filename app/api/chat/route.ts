import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const MODEL = 'llama-3.1-8b-instant'
const MAX_CONTEXT_NOTES = 12
const MAX_NOTE_CHARS = 1200

function truncate(text: string | null, max: number): string {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (!rateLimit(`chat:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  const { user_id, messages, note_id } = await request.json() as {
    user_id?: string
    messages?: ChatMessage[]
    note_id?: string | null
  }

  if (!user_id || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'user_id and messages are required' }, { status: 400 })
  }

  let contextNotes: { title: string | null; raw_content: string; formatted_content: string | null; cluster: string | null; created_at: string }[] = []

  if (note_id) {
    // Per-note mode: context is just this one note
    const { data, error } = await supabase
      .from('notes')
      .select('title, raw_content, formatted_content, cluster, created_at')
      .eq('id', note_id)
      .eq('user_id', user_id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }
    contextNotes = [data]
  } else {
    // Global mode: pull the user's notes (most recent first), capped
    const { data, error } = await supabase
      .from('notes')
      .select('title, raw_content, formatted_content, cluster, created_at')
      .eq('user_id', user_id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(MAX_CONTEXT_NOTES)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    contextNotes = data ?? []
  }

  const contextBlock = contextNotes.length > 0
    ? contextNotes.map((n, i) => {
        const content = truncate(n.formatted_content ?? n.raw_content, MAX_NOTE_CHARS)
        const date = new Date(n.created_at).toLocaleDateString()
        return `[Note ${i + 1}] ${n.title ?? 'Untitled'} (${n.cluster ?? 'uncategorized'}, ${date})\n${content}`
      }).join('\n\n---\n\n')
    : 'No notes available.'

  const systemPrompt = note_id
    ? `You are Clarity's assistant, helping the user understand and discuss a single note. Use the note content below as your primary context. Be concise, friendly, and conversational. If the note doesn't contain the answer, say so honestly rather than making things up.\n\n${contextBlock}`
    : `You are Clarity's assistant, a helpful AI that knows the user's notes. Use the notes below as context to answer questions, find information, summarize, or make connections across notes. Be concise, friendly, and conversational. If the answer isn't in the notes, say so honestly rather than making things up. Reference note titles when relevant.\n\n${contextBlock}`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        ],
        max_tokens: 700,
        temperature: 0.6
      })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message ?? 'Groq error')

    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't come up with a response."

    return NextResponse.json({ reply, noteCount: contextNotes.length })
  } catch (err) {
    console.error('CHAT FAILED:', err)
    return NextResponse.json({ error: 'Failed to get a response. Please try again.' }, { status: 500 })
  }
}
