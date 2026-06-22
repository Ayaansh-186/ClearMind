import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

async function callGroq(prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 60,
    }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Groq ${res.status}: ${txt}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? '[]'
}

export async function POST(request: NextRequest) {
  try {
    const { note_id, user_id } = await request.json()
    if (!note_id || !user_id) {
      return NextResponse.json({ error: 'note_id and user_id required' }, { status: 400 })
    }

    // Fetch source note
    const { data: source } = await supabase
      .from('notes')
      .select('id, title, raw_content, cluster')
      .eq('id', note_id)
      .single()

    if (!source) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

    // Fetch up to 50 other notes for this user
    const { data: candidates } = await supabase
      .from('notes')
      .select('id, title, raw_content, cluster, created_at')
      .eq('user_id', user_id)
      .eq('is_archived', false)
      .neq('id', note_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ related: [] })
    }

    // Use SHORT numeric indexes (not UUIDs) — much more reliable for the model to return
    const candidateList = candidates.map((n, i) =>
      `${i}: [${n.cluster ?? '?'}] ${(n.title ?? 'Untitled').slice(0, 50)} — ${(n.raw_content ?? '').slice(0, 100)}`
    ).join('\n')

    const prompt = `Given this note:
"${(source.title ?? 'Untitled').slice(0, 60)}" — ${(source.raw_content ?? '').slice(0, 300)}

Pick the 4 most related notes from this list by their NUMBER. Return ONLY a JSON array of 4 numbers, like: [2, 7, 14, 23]
No explanation, no text, just the array.

${candidateList}`

    let raw = '[]'
    try {
      raw = await callGroq(prompt)
    } catch (e) {
      console.error('Groq error in related notes:', e)
      return NextResponse.json({ related: [] })
    }

    // Parse the index array
    let indexes: number[] = []
    try {
      // Strip any markdown fences or extra text, grab the first [...] array
      const match = raw.match(/\[[\d,\s]+\]/)
      if (!match) return NextResponse.json({ related: [] })
      indexes = JSON.parse(match[0])
        .filter((n: unknown) => typeof n === 'number' && n >= 0 && n < candidates.length)
        .slice(0, 4)
    } catch {
      return NextResponse.json({ related: [] })
    }

    if (indexes.length === 0) return NextResponse.json({ related: [] })

    // Map indexes back to IDs
    const relatedIds = indexes.map(i => candidates[i].id)

    const { data: related } = await supabase
      .from('notes')
      .select('id, title, raw_content, cluster, created_at, is_pinned, is_archived, relevance, image_url, formatted_content, updated_at, user_id')
      .in('id', relatedIds)

    // Preserve the model's ranking order
    const ordered = relatedIds
      .map(id => (related ?? []).find(n => n.id === id))
      .filter(Boolean)

    return NextResponse.json({ related: ordered })
  } catch (err) {
    console.error('Related notes error:', err)
    return NextResponse.json({ related: [] })
  }
}
