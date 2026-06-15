import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { clusters, type Cluster } from '@/lib/types'

function safeJson(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
  return JSON.parse(cleaned) as { cluster?: Cluster; title?: string; relevance?: number }
}

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 150,
      temperature: 0
    })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? 'Groq error')
  return data.choices?.[0]?.message?.content ?? ''
}

export async function POST(request: Request) {
  const { note_id, content } = await request.json()
  if (!note_id || !content) {
    return NextResponse.json({ error: 'note_id and content are required' }, { status: 400 })
  }

  try {
    const text = await callGroq(
      'You are a notes organizer. Return ONLY a valid JSON object with no markdown, no explanation, no backticks.',
      `Given this note, return exactly: {"cluster":"work","title":"short title max 8 words","relevance":7}
cluster must be one of: work, ideas, personal, learning, health
relevance is 1-10 based on how urgent or actionable the note seems.

Note: ${content}`
    )

    const parsed = safeJson(text)
    const cluster = clusters.includes(parsed.cluster as Cluster) ? parsed.cluster : null
    const relevance = Math.max(1, Math.min(10, Number(parsed.relevance) || 5))

    const { data, error } = await supabase
      .from('notes')
      .update({ title: parsed.title?.slice(0, 80) ?? null, cluster, relevance })
      .eq('id', note_id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    console.log('✓ Clustered:', data.id, '→', cluster)
    return NextResponse.json(data)
  } catch (err) {
    console.error('CLUSTER FAILED:', err)
    return NextResponse.json({ ok: true, skipped: true })
  }
}