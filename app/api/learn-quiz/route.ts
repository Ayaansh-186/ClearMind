import { NextResponse } from 'next/server'

type Message = { role: 'user' | 'assistant'; content: string }

async function callGroqWithRetry(messages: object[], systemPrompt: string, maxTokens = 800, retries = 5): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: maxTokens,
        temperature: 0.4,
      })
    })
    const data = await res.json()

    if (res.status === 429) {
      const match = data?.error?.message?.match(/try again in ([\d.]+)s/i)
      const waitMs = match ? Math.ceil(parseFloat(match[1]) * 1000) + 2000 : (attempt + 1) * 10000
      console.log(`Learn-quiz rate limited. Waiting ${waitMs / 1000}s...`)
      await new Promise(r => setTimeout(r, waitMs))
      continue
    }

    if (!res.ok) throw new Error(data?.error?.message ?? 'Groq error')
    return data.choices?.[0]?.message?.content ?? ''
  }
  throw new Error('Rate limit exceeded after all retries')
}

export async function POST(request: Request) {
  const { mode, notes, history, userMessage } = await request.json() as {
    mode: 'teach' | 'quiz' | 'chat'
    notes: string
    history: Message[]
    userMessage?: string
  }

  // Trim notes to avoid hitting token limits
  const trimmedNotes = notes.slice(0, 4000)

  try {
    if (mode === 'teach') {
      const system = `You are an expert teacher. Teach the student step by step from these notes.

NOTES:
${trimmedNotes}

Rules:
- Give a brief overview first
- Teach ONE section at a time
- After each section ask "Ready for the next part? Or any questions?"
- Use simple language and real-world examples
- Use **bold** for key terms
- Keep responses short and digestible
- Start teaching the first section now`

      const reply = await callGroqWithRetry([{ role: 'user', content: 'Start teaching me.' }], system, 500)
      return NextResponse.json({ reply })
    }

    if (mode === 'quiz') {
      const system = `You are a quiz master. Create a quiz from these notes.

NOTES:
${trimmedNotes}

Create exactly 5 multiple choice questions. Format each like:

**Q1: [Question]**
A) [Option]
B) [Option]
C) [Option]
D) [Option]

After all 5 questions write "---ANSWERS---" then list correct answers with brief explanations.
Test understanding not just memorization. Cover different topics.`

      const reply = await callGroqWithRetry([{ role: 'user', content: 'Give me a quiz.' }], system, 800)
      return NextResponse.json({ reply })
    }

    if (mode === 'chat') {
      const system = `You are an expert teacher helping a student learn from their notes.

NOTES:
${trimmedNotes}

- Answer questions clearly and concisely
- If continuing teaching, pick up where you left off
- If checking quiz answers, say if correct and explain why
- Be encouraging
- If student says "next", teach the next section
- If student wants another quiz, generate 3 new questions`

      const messages = [
        ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: userMessage }
      ]
      const reply = await callGroqWithRetry(messages, system, 600)
      return NextResponse.json({ reply })
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  } catch (err) {
    console.error('LEARN QUIZ FAILED:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
