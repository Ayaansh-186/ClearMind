import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/discover?cluster=work&cursor=<created_at>&limit=20
// Returns publicly shared notes opted into the discover feed
export async function GET(request: NextRequest) {
  const cluster = request.nextUrl.searchParams.get('cluster')
  const cursor = request.nextUrl.searchParams.get('cursor')
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? '20'), 40)

  let query = supabase
    .from('notes')
    .select('id, title, raw_content, formatted_content, cluster, relevance, image_url, created_at, updated_at, user_id, is_pinned, is_archived, is_shared, share_id, is_discover')
    .eq('is_discover', true)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cluster) query = query.eq('cluster', cluster)
  if (cursor) query = query.lt('created_at', cursor)

  const { data: notes, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch display names from auth.users via profiles table (if it exists),
  // otherwise fall back to anonymised author labels
  const userIds = [...new Set((notes ?? []).map(n => n.user_id))]
  let authorMap: Record<string, string> = {}

  if (userIds.length > 0) {
    // Try a `profiles` table first (common Supabase pattern)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)

    if (profiles) {
      authorMap = Object.fromEntries(profiles.map(p => [p.id, p.display_name ?? 'Anonymous']))
    }
  }

  const enriched = (notes ?? []).map(n => ({
    ...n,
    author_name: authorMap[n.user_id] ?? 'Anonymous',
    reaction_count: 0, // placeholder until reactions table exists
  }))

  return NextResponse.json({
    notes: enriched,
    nextCursor: enriched.length === limit ? enriched[enriched.length - 1]?.created_at : null,
  })
}

// POST /api/discover — toggle a note's is_discover status
// Body: { note_id, user_id, is_discover: boolean }
export async function POST(request: NextRequest) {
  try {
    const { note_id, user_id, is_discover } = await request.json()
    if (!note_id || !user_id) {
      return NextResponse.json({ error: 'note_id and user_id required' }, { status: 400 })
    }

    // Verify ownership
    const { data: note } = await supabase
      .from('notes')
      .select('id, user_id')
      .eq('id', note_id)
      .eq('user_id', user_id)
      .single()

    if (!note) return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 })

    const { error } = await supabase
      .from('notes')
      .update({ is_discover: !!is_discover })
      .eq('id', note_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, is_discover: !!is_discover })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
