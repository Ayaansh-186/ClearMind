import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

async function searchGoogle(query: string): Promise<string> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.SERPER_API_KEY!
    },
    body: JSON.stringify({ q: query, num: 5 })
  })
  const data = await res.json()
  if (!res.ok) throw new Error('Serper error: ' + JSON.stringify(data).slice(0, 100))

  // Extract useful snippets
  const results: string[] = []

  if (data.answerBox?.answer) results.push(`Answer: ${data.answerBox.answer}`)
  if (data.answerBox?.snippet) results.push(`Summary: ${data.answerBox.snippet}`)
  if (data.knowledgeGraph?.description) results.push(`Overview: ${data.knowledgeGraph.description}`)

  for (const item of (data.organic ?? []).slice(0, 4)) {
    if (item.snippet) results.push(`• ${item.title}: ${item.snippet}`)
  }

  return results.join('\n')
}

async function enhanceWithGroq(originalNote: string, searchResults: string): Promise<string> {
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
          content: `You are a knowledge enhancer. You take a user's note and enrich it with accurate information from web search results. 
Rules:
- Keep the user's original content intact at the top
- Add a "## Enhanced with Web Knowledge" section below
- Add relevant facts, definitions, explanations and context from the search results
- Use clear markdown formatting with headers and bullet points
- Keep it educational and concise
- Do not make up facts — only use what's in the search results
- Return the full enhanced note in markdown`
        },
        {
          role: 'user',
          content: `Original note:\n${originalNote}\n\nWeb search results:\n${searchResults}\n\nEnhance this note with the web knowledge.`
        }
      ],
      max_tokens: 1000,
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
    // Extract a good search query from the note (first 2 lines or 100 chars)
    const searchQuery = content.split('\n').slice(0, 2).join(' ').replace(/[#*•]/g, '').trim().slice(0, 120)
    console.log('Searching Google for:', searchQuery)

    const searchResults = await searchGoogle(searchQuery)
    console.log('Got search results:', searchResults.slice(0, 150))

    const enhanced = await enhanceWithGroq(content, searchResults)
    console.log('✓ Enhanced note:', enhanced.slice(0, 100))

    // Save as formatted_content
    const { data, error } = await supabase
      .from('notes')
      .update({ formatted_content: enhanced })
      .eq('id', note_id)
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ enhanced_content: enhanced, ...data })
  } catch (err) {
    console.error('ENHANCE FAILED:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
