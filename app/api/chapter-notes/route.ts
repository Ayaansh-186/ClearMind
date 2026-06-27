import { NextResponse } from 'next/server'

type FileData = { name: string; base64: string; type: string }

const STYLE_PROMPTS: Record<string, string> = {
  detailed: `Create COMPREHENSIVE notes:
- Every concept, definition, and term clearly explained
- All facts, dates, names, values, formulas
- Key points in **bold**
- Include everything from the text`,
  concise: `Create CONCISE revision notes:
- Most important points only as short bullets
- Key terms bolded, formulas and definitions only`,
  exam: `Create EXAM-FOCUSED notes:
- All definitions: **Term** — definition
- All formulas in a ## Formulas section
- ## Important Questions with model answers
- ⭐ for highest priority points`,
  mindmap: `Create MIND MAP STYLE notes:
- Main topic as # H1, subtopics as ## H2
- Key points as bullets, sub-details indented
- Use → for cause/effect`,
}

async function callGroqWithRetry(body: object, retries = 5): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(body)
    })

    const data = await res.json()

    if (res.status === 429) {
      const match = data?.error?.message?.match(/try again in ([\d.]+)s/i)
      const waitMs = match ? Math.ceil(parseFloat(match[1]) * 1000) + 2000 : (attempt + 1) * 15000
      console.log(`Rate limited. Waiting ${waitMs / 1000}s...`)
      await new Promise(r => setTimeout(r, waitMs))
      continue
    }

    if (!res.ok) throw new Error(data?.error?.message ?? `Groq error ${res.status}`)
    return data.choices?.[0]?.message?.content ?? ''
  }
  throw new Error('Rate limit exceeded after all retries')
}

export async function POST(request: Request) {
  const { textContent, style, subject, isFirstChunk, totalChunks, chunkIndex } = await request.json() as {
    textContent: string
    style: string
    subject: string
    isFirstChunk: boolean
    totalChunks: number
    chunkIndex: number
  }

  const stylePrompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.detailed

  const systemPrompt = `You are an expert academic note-taker. Create study notes from textbook content.
${stylePrompt}
Use ## for sections, ### for subsections, tables for comparisons, > for key definitions.
${subject ? `Subject: ${subject}.` : ''}
${totalChunks > 1 ? `Part ${chunkIndex + 1} of ${totalChunks}. ${isFirstChunk ? 'Start from the beginning.' : 'Continue naturally. Do NOT repeat previous content. Do NOT add introduction.'}` : ''}`

  try {
    const notes = await callGroqWithRetry({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create study notes from this content:\n\n${textContent}` }
      ],
      max_tokens: 2000,
      temperature: 0.2,
    })

    console.log(`✓ Chunk ${chunkIndex + 1}/${totalChunks}, length: ${notes.length}`)
    return NextResponse.json({ notes })
  } catch (err) {
    console.error('CHAPTER NOTES FAILED:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
