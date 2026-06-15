import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { randomBytes } from 'crypto'

export async function POST(request: Request) {
  const { note_id, action } = await request.json() as { note_id: string; action: 'enable' | 'disable' }

  if (action === 'enable') {
    // Generate unique share ID
    const share_id = randomBytes(8).toString('hex')
    const { data, error } = await supabase
      .from('notes')
      .update({ is_shared: true, share_id })
      .eq('id', note_id)
      .select('share_id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ share_id: data.share_id })
  }

  if (action === 'disable') {
    const { error } = await supabase
      .from('notes')
      .update({ is_shared: false, share_id: null })
      .eq('id', note_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
