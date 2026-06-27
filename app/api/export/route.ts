import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function noteToMarkdown(note: {
  title: string | null
  cluster: string | null
  created_at: string
  raw_content: string
  formatted_content: string | null
  tags?: { name: string }[]
}): string {
  const lines: string[] = []
  lines.push(`# ${note.title ?? 'Untitled'}`)
  lines.push('')

  const meta: string[] = []
  if (note.cluster) meta.push(`**Cluster:** ${note.cluster}`)
  meta.push(`**Created:** ${new Date(note.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`)
  if (note.tags && note.tags.length > 0) meta.push(`**Tags:** ${note.tags.map(t => `#${t.name}`).join(', ')}`)
  if (meta.length) { lines.push(...meta); lines.push('') }

  lines.push('---')
  lines.push('')
  lines.push(note.formatted_content ?? note.raw_content)
  lines.push('')

  return lines.join('\n')
}

// GET /api/export?note_id=xxx&user_id=xxx&format=md|txt
export async function GET(request: NextRequest) {
  const note_id = request.nextUrl.searchParams.get('note_id')
  const user_id = request.nextUrl.searchParams.get('user_id')
  const format = request.nextUrl.searchParams.get('format') ?? 'md'

  if (!note_id || !user_id) {
    return NextResponse.json({ error: 'note_id and user_id required' }, { status: 400 })
  }

  const { data: note } = await supabase
    .from('notes')
    .select('id, title, cluster, created_at, raw_content, formatted_content, user_id, note_tags(tags(name))')
    .eq('id', note_id)
    .eq('user_id', user_id)
    .single()

  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Flatten the nested join
  const tags = ((note as unknown as { note_tags?: { tags?: { name: string } | null }[] }).note_tags ?? [])
    .map((nt) => nt.tags)
    .filter(Boolean) as { name: string }[]

  const content = noteToMarkdown({ ...note, tags })
  const filename = `${(note.title ?? 'note').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${format}`
  const mimeType = format === 'md' ? 'text/markdown' : 'text/plain'

  return new NextResponse(content, {
    headers: {
      'Content-Type': `${mimeType}; charset=utf-8`,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

// POST /api/export — bulk export: { user_id, note_ids, format }
export async function POST(request: NextRequest) {
  try {
    const { user_id, note_ids, format = 'md' } = await request.json()
    if (!user_id || !note_ids?.length) {
      return NextResponse.json({ error: 'user_id and note_ids required' }, { status: 400 })
    }

    const { data: notes } = await supabase
      .from('notes')
      .select('id, title, cluster, created_at, raw_content, formatted_content, note_tags(tags(name))')
      .eq('user_id', user_id)
      .in('id', note_ids)
      .order('created_at', { ascending: false })

    if (!notes?.length) return NextResponse.json({ error: 'No notes found' }, { status: 404 })

    const sections = notes.map(note => {
      const tags = ((note as unknown as { note_tags?: { tags?: { name: string } | null }[] }).note_tags ?? [])
        .map(nt => nt.tags)
        .filter(Boolean) as { name: string }[]
      return noteToMarkdown({ ...note, tags })
    })

    const combined = [
      `# ClearMind Export`,
      `*${notes.length} notes · Exported ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*`,
      '',
      '---',
      '',
      ...sections.flatMap(s => [s, '\n---\n']),
    ].join('\n')

    const filename = `clearmind-export-${new Date().toISOString().slice(0, 10)}.${format}`
    const mimeType = format === 'md' ? 'text/markdown' : 'text/plain'

    return new NextResponse(combined, {
      headers: {
        'Content-Type': `${mimeType}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
