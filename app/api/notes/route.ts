import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

  fetch(`${appUrl(request)}/api/notes/cluster`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note_id: note.id, content: note.raw_content }),
  }).catch((err) => console.error('CLUSTER ERROR:', err))

  return NextResponse.json(note)
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const userId  = searchParams.get('user_id')
  const cluster = searchParams.get('cluster')
  const view    = searchParams.get('view')
  const archived = searchParams.get('archived')

  if (!userId) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
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

  // Pinned notes always sort first, then by relevance desc, then newest first
  const { data, error } = await query
    .order('is_pinned',   { ascending: false })
    .order('relevance',   { ascending: false })
    .order('created_at',  { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
