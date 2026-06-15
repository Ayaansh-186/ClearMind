import { NextResponse } from 'next/server'

async function callGroqWithRetry(messages: object[], system: string, maxTokens = 1500, retries = 4): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: maxTokens,
        temperature: 0.3,
      })
    })
    const data = await res.json()
    if (res.status === 429) {
      const match = data?.error?.message?.match(/try again in ([\d.]+)s/i)
      const waitMs = match ? Math.ceil(parseFloat(match[1]) * 1000) + 2000 : (attempt + 1) * 12000
      console.log(`Flashcards rate limited. Waiting ${waitMs / 1000}s...`)
      await new Promise(r => setTimeout(r, waitMs))
      continue
    }
    if (!res.ok) throw new Error(data?.error?.message ?? 'Groq error')
    return data.choices?.[0]?.message?.content ?? ''
  }
  throw new Error('Rate limit exceeded')
}

export async function POST(request: Request) {
  const { notes, count = 15 } = await request.json() as { notes: string; count?: number }

  const system = `You are a flashcard generator. Create exactly ${count} flashcards from the study notes provided.

Return ONLY a valid JSON array with no markdown, no explanation, no backticks:
[
  {
    "front": "Question or term",
    "back": "Answer or definition",
    "category": "one of: Definition | Concept | Formula | Date | Person | Process | Key Fact"
  }
]

Rules:
- Mix different types: definitions, key concepts, formulas, important facts, dates, people
- Front should be a clear question or term (not too long)
- Back should be a complete but concise answer (1-3 sentences max)
- Cover the most important and exam-worthy content
- Make questions test real understanding, not trivial facts
- Return ONLY the JSON array, nothing else`

  try {
    const text = await callGroqWithRetry(
      [{ role: 'user', content: `Generate ${count} flashcards from these notes:\n\n${notes.slice(0, 5000)}` }],
      system, 2000
    )

    const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
    const cards = JSON.parse(cleaned)

    if (!Array.isArray(cards)) throw new Error('Invalid response format')
    console.log(`✓ Generated ${cards.length} flashcards`)
    return NextResponse.json({ cards })
  } catch (err) {
    console.error('FLASHCARDS FAILED:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
