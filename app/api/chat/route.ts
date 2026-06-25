// app/api/chat/route.ts
//
// ClearMind Chat — now with real RAG (Retrieval-Augmented Generation).
//
// BEFORE: grabbed the 12 most recently updated notes regardless of the question.
//   → User asks "what were my React ideas?" and gets notes about health and work.
//
// AFTER: embeds the user's question, runs cosine similarity against all their
//   note embeddings, returns the 5 most semantically relevant notes as context.
//   → User asks "what were my React ideas?" and gets exactly those notes.
//
// Fallback: if embedding fails (Groq down, rate limited, new user with no
//   embeddings yet), we fall back to the old recency-based approach so the
//   chat never completely breaks.

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { embed } from '@/lib/embed'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

// Use the bigger model for chat — 70b gives much better reasoning and
// note synthesis than 8b-instant. Still very fast on Groq (~400 t/s).
const CHAT_MODEL   = 'llama-3.3-70b-versatile'
const EMBED_FALLBACK_LIMIT = 12   // notes to grab if embedding fails
const MAX_NOTE_CHARS       = 1500 // per note — slightly more than before
const SEMANTIC_MATCH_COUNT = 5    // top K notes by cosine similarity

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

  type NoteContext = {
    title: string | null
    raw_content: string
    formatted_content: string | null
    cluster: string | null
    created_at: string
  }

  let contextNotes: NoteContext[] = []
  let retrievalMethod: 'per-note' | 'semantic' | 'recency-fallback' = 'semantic'

  // ── Per-note mode ──────────────────────────────────────────────────────────
  // User opened a specific note and is chatting about it.
  // No RAG needed — just send that one note as context.
  if (note_id) {
    retrievalMethod = 'per-note'
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

  // ── Global mode — semantic RAG ─────────────────────────────────────────────
  } else {
    // Step 1: embed the user's latest message (the question).
    const latestUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
    const queryVector = await embed(latestUserMessage)

    if (queryVector) {
      // Step 2: call the match_notes Postgres function we created in the migration.
      // It returns note IDs ordered by cosine similarity to our query vector.
      const { data: matches, error: matchError } = await supabase.rpc('match_notes', {
        query_embedding:  queryVector,
        match_user_id:    user_id,
        match_threshold:  0.25, // slightly lower than default — better recall
        match_count:      SEMANTIC_MATCH_COUNT,
      })

      if (!matchError && matches && matches.length > 0) {
        // Step 3: fetch the full note content for the matched IDs.
        const matchedIds = (matches as { note_id: string; similarity: number }[]).map(m => m.note_id)

        const { data: notes } = await supabase
          .from('notes')
          .select('title, raw_content, formatted_content, cluster, created_at')
          .in('id', matchedIds)
          .eq('is_archived', false)

        if (notes && notes.length > 0) {
          // Re-order to match similarity ranking (Supabase .in() doesn't preserve order)
          const noteMap = new Map(notes.map(n => [n.id ?? '', n]))
          contextNotes = matchedIds
            .map(id => noteMap.get(id))
            .filter((n): n is NoteContext => n !== undefined)
        }
      }
    }

    // ── Fallback: no embeddings yet, or Groq embed failed ─────────────────────
    // New users won't have any embeddings until they save their first note.
    // In that case, fall back to the old recency approach silently.
    if (contextNotes.length === 0) {
      retrievalMethod = 'recency-fallback'
      const { data, error } = await supabase
        .from('notes')
        .select('title, raw_content, formatted_content, cluster, created_at')
        .eq('user_id', user_id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(EMBED_FALLBACK_LIMIT)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      contextNotes = data ?? []
    }
  }

  // ── Build the context block ────────────────────────────────────────────────
  const contextBlock = contextNotes.length > 0
    ? contextNotes.map((n, i) => {
        const content = truncate(n.formatted_content ?? n.raw_content, MAX_NOTE_CHARS)
        const date = new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        return `[Note ${i + 1}] ${n.title ?? 'Untitled'} (${n.cluster ?? 'uncategorized'} · ${date})\n${content}`
      }).join('\n\n---\n\n')
    : 'No notes available yet.'

  // ── System prompt ──────────────────────────────────────────────────────────
  const systemPrompt = note_id
    ? `You are ClearMind's assistant, helping the user think through a specific note. Use only the note content below. Be concise and conversational. If the note doesn't answer the question, say so clearly.

---
${contextBlock}
---`
    : `You are ClearMind's AI assistant. You have access to the user's most relevant notes for this conversation, retrieved by semantic similarity to their question.

Rules:
- Answer using the notes as your primary source. Reference note titles when relevant.
- If the notes don't contain the answer, say "I don't see that in your notes" — never make things up.
- Be conversational and concise. Aim for 2-4 sentences unless a longer answer is clearly needed.
- If the user asks to summarize, compare, or find connections across notes, do so.
- Retrieval method used: ${retrievalMethod === 'semantic' ? 'semantic search (your most relevant notes)' : retrievalMethod === 'recency-fallback' ? 'recent notes (no embeddings found yet)' : 'single note context'}.

---
${contextBlock}
---`

  // ── Call Groq ──────────────────────────────────────────────────────────────
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          // Send last 10 messages to stay within context limits
          ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        ],
        max_tokens: 800,
        temperature: 0.5, // slightly lower = more factual, less creative
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message ?? 'Groq error')

    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response."

    return NextResponse.json({
      reply,
      noteCount:        contextNotes.length,
      retrievalMethod,  // exposed so the UI can show "Found 5 relevant notes" vs "Using recent notes"
    })
  } catch (err) {
    console.error('CHAT FAILED:', err)
    return NextResponse.json({ error: 'Failed to get a response. Please try again.' }, { status: 500 })
  }
}
