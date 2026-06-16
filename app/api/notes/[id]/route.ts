import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabase
    .from('notes')
    .update({ is_archived: true })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const update: Record<string, unknown> = {}

  if (typeof body.is_archived === 'boolean') {
    update.is_archived = body.is_archived
  }
  if (typeof body.title === 'string') {
    update.title = body.title.trim().slice(0, 200) || null
  }
  if (typeof body.raw_content === 'string') {
    const trimmed = body.raw_content.trim()
    if (!trimmed) {
      return NextResponse.json({ error: 'raw_content cannot be empty' }, { status: 400 })
    }
    if (trimmed.length > 20000) {
      return NextResponse.json({ error: 'raw_content is too long (max 20000 characters)' }, { status: 400 })
    }
    update.raw_content = trimmed
    // Editing raw content invalidates any previously generated formatted version
    update.formatted_content = null
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('notes')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
