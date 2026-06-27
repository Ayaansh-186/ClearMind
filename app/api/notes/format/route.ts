import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

async function callGroq(content: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: 'You are a note formatter. Format the raw note into clean readable markdown. Fix grammar and spelling. Use bullet points or headers only if the content has multiple distinct points. Keep it concise. Preserve all original meaning. Return only the formatted note text, nothing else.'
        },
        { role: 'user', content: `Format this note:\n\n${content}` }
      ],
      max_tokens: 500,
      temperature: 0.3
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
    const formatted = await callGroq(content)
    console.log('✓ Formatted note:', formatted.slice(0, 80))

    const { data, error } = await supabase
      .from('notes')
      .update({ formatted_content: formatted })
      .eq('id', note_id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ formatted_content: formatted, ...data })
  } catch (err) {
    console.error('FORMAT FAILED:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}