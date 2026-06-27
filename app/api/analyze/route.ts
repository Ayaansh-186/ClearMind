import { NextResponse } from 'next/server'

type FileData = { name: string; base64: string; type: string }
type HistoryMessage = { role: 'user' | 'assistant'; content: string }

export async function POST(request: Request) {
  const { files, message, history = [] } = await request.json() as {
    files: FileData[]
    message: string
    history: HistoryMessage[]
  }

  try {
    const systemPrompt = `You are a precise academic coach. You only say what you can actually see in the document. You never guess or assume.

STEP 1 — IDENTIFY DOCUMENT TYPE:
Look carefully and determine which one it is:

A) MARKSHEET / RESULT CARD — has a student's name, subject names, and actual marks/grades/scores written next to them
B) MODEL ANSWER SHEET / ANSWER KEY — shows the correct answers written out, full solutions, or has "Model Answer" / "Answer Key" written on it
C) STUDENT'S ANSWER SHEET — shows a student's own handwritten or typed answers to questions
D) QUESTION PAPER — shows only questions with no answers filled in

STEP 2 — RESPOND BASED ON TYPE:

If TYPE A (Marksheet):
- List each subject and its exact marks as shown
- Calculate percentage = total marks obtained / total maximum marks × 100
- ✅ Strongest subjects (highest marks)
- ❌ Weakest subjects (lowest marks)  
- 💡 Targeted study tips for each weak subject
- 🎯 Short encouraging message

If TYPE B (Model Answer Sheet):
- Say clearly: "📋 This is a model answer sheet / answer key"
- List the subjects and topics covered
- For each topic, explain the key concepts a student must understand
- Give a clear study plan to master these topics
- Recommend specific practice strategies

If TYPE C (Student Answer Sheet):
- Identify which questions were attempted
- Point out answers that look correct vs incorrect
- Identify conceptual gaps
- Give targeted improvement tips

If TYPE D (Question Paper):
- List the topics covered by the questions
- Suggest how to prepare for each topic

STRICT RULES:
- NEVER guess marks that are not shown
- NEVER say a student "performed well" or "struggled" unless you can see their actual marks
- If you cannot clearly read something, say "I cannot read this clearly"
- Be concise — no repeating yourself
- Do not recommend specific book titles unless they are standard textbooks for the subject`

    const messages: object[] = [
      ...history.map(h => ({ role: h.role, content: h.content }))
    ]

    if (files.length > 0) {
      const contentParts: object[] = []
      const hasImages = files.some(f => f.type !== 'application/pdf')

      for (const file of files) {
        if (file.type !== 'application/pdf') {
          contentParts.push({
            type: 'image_url',
            image_url: { url: `data:${file.type};base64,${file.base64}` }
          })
        }
      }

      contentParts.push({
        type: 'text',
        text: `${message}\n\nFirst identify the document type (A/B/C/D), then give your analysis. Only report what you can actually see.`
      })

      messages.push({ role: 'user', content: contentParts })

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          // Migrated from meta-llama/llama-4-scout-17b-16e-instruct (deprecated June 2026, decommissioned July 17 2026)
          // qwen/qwen3.6-27b is the recommended vision replacement — 20MB file limit, native multimodal
          model: hasImages
            ? 'qwen/qwen3.6-27b'
            : 'openai/gpt-oss-20b',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          max_tokens: 1500,
          temperature: 0.1,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Groq error')
      return NextResponse.json({ reply: data.choices?.[0]?.message?.content ?? '' })

    } else {
      messages.push({ role: 'user', content: message })
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          max_tokens: 800,
          temperature: 0.2,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Groq error')
      return NextResponse.json({ reply: data.choices?.[0]?.message?.content ?? '' })
    }

  } catch (err) {
    console.error('ANALYZE FAILED:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
