import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const note_id = searchParams.get('note_id')
  if (!note_id) return NextResponse.json({ error: 'note_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('note_comments')
    .select('*')
    .eq('note_id', note_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  if (!rateLimit(`comment:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many comments. Please wait a moment before posting again.' }, { status: 429 })
  }

  const { note_id, author_name, content } = await request.json()
  if (!note_id || !author_name?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'note_id, author_name and content required' }, { status: 400 })
  }

  if (content.trim().length > 2000) {
    return NextResponse.json({ error: 'Comment is too long (max 2000 characters)' }, { status: 400 })
  }
  if (author_name.trim().length > 50) {
    return NextResponse.json({ error: 'Name is too long (max 50 characters)' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('note_comments')
    .insert({ note_id, author_name: author_name.trim(), content: content.trim() })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
