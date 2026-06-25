import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { embed, buildNoteText } from '@/lib/embed'

function appUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
}

export async function POST(request: NextRequest) {
  const { raw_content, user_id } = await request.json()

  if (!raw_content?.trim() || !user_id) {
    return NextResponse.json(
      { error: 'raw_content and user_id are required' },
      { status: 400 }
    )
  }

  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      raw_content: raw_content.trim(),
      user_id,
      relevance: 5,
      is_archived: false,
      is_pinned: false,
    })
    .select('*')
    .single()

  if (error) {
    console.error('INSERT ERROR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fire-and-forget: cluster the note (existing behaviour)
  fetch(`${appUrl(request)}/api/notes/cluster`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note_id: note.id, content: note.raw_content }),
  }).catch((err) => console.error('CLUSTER ERROR:', err))

  // Fire-and-forget: generate and store the embedding for RAG.
  // We don't await this — it runs in the background so the user
  // sees their note immediately. The embedding is ready by the time
  // they open the chat panel (usually < 1s).
  ;(async () => {
    try {
      const text = buildNoteText({
        title: note.title,
        raw_content: note.raw_content,
        formatted_content: note.formatted_content,
      })
      const vector = await embed(text)
      if (!vector) return

      // Upsert — if the note gets re-embedded (e.g. after AI formats it),
      // we overwrite the old vector rather than creating a duplicate.
      const { error: embedError } = await supabase
        .from('note_embeddings')
        .upsert({
          note_id:   note.id,
          user_id:   note.user_id,
          embedding: JSON.stringify(vector),
        }, { onConflict: 'note_id' })

      if (embedError) console.error('EMBED STORE ERROR:', embedError)
    } catch (err) {
      console.error('EMBED BACKGROUND ERROR:', err)
    }
  })()

  return NextResponse.json({ ...note, tags: [] })
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const userId   = searchParams.get('user_id')
  const cluster  = searchParams.get('cluster')
  const view     = searchParams.get('view')
  const archived = searchParams.get('archived')
  const tagId    = searchParams.get('tag_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  // If filtering by tag, first resolve which note_ids carry that tag
  let tagNoteIds: string[] | null = null
  if (tagId) {
    const { data: links } = await supabase
      .from('note_tags')
      .select('note_id')
      .eq('tag_id', tagId)
    tagNoteIds = (links ?? []).map(l => l.note_id)
    if (tagNoteIds.length === 0) {
      return NextResponse.json([]) // no notes have this tag
    }
  }

  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)

  if (archived === 'true') {
    query = query.eq('is_archived', true)
  } else if (archived !== 'all') {
    query = query.eq('is_archived', false)
  }

  if (cluster) {
    query = query.eq('cluster', cluster)
  }

  if (view === 'surface') {
    query = query.gte('relevance', 7)
  }

  if (tagNoteIds) {
    query = query.in('id', tagNoteIds)
  }

  const { data: notes, error } = await query
    .order('is_pinned',  { ascending: false })
    .order('relevance',  { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!notes || notes.length === 0) {
    return NextResponse.json([])
  }

  // ── Embed tags for every note in one batched query ─────────────────────────
  const noteIds = notes.map(n => n.id)
  const { data: tagLinks } = await supabase
    .from('note_tags')
    .select('note_id, tags(*)')
    .in('note_id', noteIds)

  const tagsByNote: Record<string, unknown[]> = {}
  for (const link of tagLinks ?? []) {
    const row = link as unknown as { note_id: string; tags: unknown }
    if (!tagsByNote[row.note_id]) tagsByNote[row.note_id] = []
    if (row.tags) tagsByNote[row.note_id].push(row.tags)
  }

  const withTags = notes.map(n => ({ ...n, tags: tagsByNote[n.id] ?? [] }))

  return NextResponse.json(withTags)
}
