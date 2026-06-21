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
  let snapshotBeforeEdit = false

  if (typeof body.is_archived === 'boolean') {
    update.is_archived = body.is_archived
  }
  if (typeof body.is_pinned === 'boolean') {
    update.is_pinned = body.is_pinned
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
      return NextResponse.json({ error: 'raw_content is too long (max 20 000 characters)' }, { status: 400 })
    }
    update.raw_content = trimmed
    update.formatted_content = null
    snapshotBeforeEdit = true
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // ── Snapshot current content before a content edit ────────────────────────
  if (snapshotBeforeEdit) {
    const { data: current } = await supabase
      .from('notes')
      .select('raw_content, title, user_id')
      .eq('id', id)
      .single()

    if (current?.raw_content && current.user_id) {
      await supabase.from('note_versions').insert({
        note_id: id,
        user_id: current.user_id,
        raw_content: current.raw_content,
        title: current.title ?? null,
        version_label: body.version_label as string | undefined ?? null,
      })
    }
  }

  // ── Apply update ──────────────────────────────────────────────────────────
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
