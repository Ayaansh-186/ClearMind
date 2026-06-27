import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { content } = await request.json()
  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })

  try {
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
            content: `You are a diagram generator. Given a note, extract the key concepts and relationships and return ONLY a valid JSON object with no markdown, no backticks, no explanation.
The JSON must follow this exact structure:
{
  "title": "short diagram title",
  "nodes": [
    { "id": "root", "label": "Main Topic" },
    { "id": "n1", "label": "Key Point 1", "children": ["detail a", "detail b"] },
    { "id": "n2", "label": "Key Point 2", "children": ["detail c"] },
    { "id": "n3", "label": "Key Point 3" }
  ]
}
Rules:
- First node is always the root/main topic
- 3-6 child nodes maximum
- children array is optional, max 3 items each
- Keep labels short (1-5 words)
- Return ONLY the JSON, nothing else`
          },
          {
            role: 'user',
            content: `Generate a diagram for this note:\n\n${content}`
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message ?? 'Groq error')

    const text = data.choices?.[0]?.message?.content ?? ''
    const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
    const diagram = JSON.parse(cleaned)

    return NextResponse.json({ diagram })
  } catch (err) {
    console.error('EXPLAIN FAILED:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
