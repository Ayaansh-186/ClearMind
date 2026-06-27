// app/api/thought-engine/route.ts
//
// Thought Engine — transforms raw, unstructured thoughts into structured knowledge.
//
// Input:  a messy user thought / idea / goal
// Output: title, type, concepts, structured steps, connections to existing notes

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MODEL = 'openai/gpt-oss-20b'

type ThoughtType = 'idea' | 'project' | 'task' | 'learning' | 'question'

export type ThoughtEngineResult = {
  title: string
  type: ThoughtType
  cluster: string
  summary: string
  concepts: string[]
  structure: {
    label: string
    items: string[]
  }
  relatedNoteIds: string[]
}

function safeJson<T>(text: string): T {
  const cleaned = text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()
  return JSON.parse(cleaned) as T
}

async function callGroq(system: string, user: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 700,
      temperature: 0.4,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? 'Groq error')
  return data.choices?.[0]?.message?.content ?? ''
}

export async function POST(request: Request) {
  const { thought, user_id } = await request.json() as {
    thought?: string
    user_id?: string
  }

  if (!thought?.trim() || !user_id) {
    return NextResponse.json({ error: 'thought and user_id are required' }, { status: 400 })
  }

  try {
    // ── Step 1: Structure the thought with AI ──────────────────────────────────
    const raw = await callGroq(
      `You are ClearMind's Thought Engine. You transform raw, unstructured thoughts into structured knowledge.
Return ONLY a valid JSON object. No markdown, no backticks, no explanation.`,
      `Transform this thought into structured knowledge:

"${thought.trim()}"

Return exactly this JSON shape:
{
  "title": "Short descriptive title (max 6 words)",
  "type": "idea | project | task | learning | question",
  "cluster": "work | ideas | personal | learning | health",
  "summary": "One sentence explaining what this is about",
  "concepts": ["concept1", "concept2", "concept3"],
  "structure": {
    "label": "Next Steps | Key Points | Action Plan | Research Areas (pick the most fitting)",
    "items": ["step or point 1", "step or point 2", "step or point 3", "step or point 4"]
  }
}

Rules:
- title must be a real descriptive title, never a template placeholder
- concepts are the core topics/ideas extracted from the thought (3-5 items)
- structure.items are concrete, actionable, specific to this thought (3-5 items)
- type reflects what kind of thought this is`
    )

    const parsed = safeJson<Omit<ThoughtEngineResult, 'relatedNoteIds'>>(raw)

    // ── Step 2: Find related existing notes ────────────────────────────────────
    // Search user's notes for semantic overlap using the extracted concepts
    let relatedNoteIds: string[] = []

    if (parsed.concepts?.length > 0) {
      const searchTerms = [parsed.title, ...parsed.concepts].join(' ')

      // Simple keyword search across title and content
      // (When RAG embeddings are working, replace with match_notes() RPC)
      const { data: notes } = await supabase
        .from('notes')
        .select('id, title, raw_content, formatted_content')
        .eq('user_id', user_id)
        .eq('is_archived', false)
        .limit(50)

      if (notes && notes.length > 0) {
        const lowerTerms = searchTerms.toLowerCase().split(' ').filter(t => t.length > 3)

        const scored = notes
          .map(note => {
            const text = `${note.title ?? ''} ${note.formatted_content ?? note.raw_content}`.toLowerCase()
            const score = lowerTerms.reduce((acc, term) => acc + (text.includes(term) ? 1 : 0), 0)
            return { id: note.id, score }
          })
          .filter(n => n.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)

        relatedNoteIds = scored.map(n => n.id)
      }
    }

    // ── Step 3: Save the structured thought as a note ──────────────────────────
    const formattedContent = [
      `## ${parsed.title}`,
      '',
      parsed.summary,
      '',
      `**Type:** ${parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1)}`,
      '',
      '**Key Concepts:**',
      parsed.concepts.map(c => `- ${c}`).join('\n'),
      '',
      `**${parsed.structure.label}:**`,
      parsed.structure.items.map((item, i) => `${i + 1}. ${item}`).join('\n'),
    ].join('\n')

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id,
        raw_content: thought.trim(),
        formatted_content: formattedContent,
        title: parsed.title,
        cluster: parsed.cluster,
        relevance: parsed.type === 'task' ? 8 : parsed.type === 'project' ? 7 : 6,
        is_archived: false,
        is_pinned: false,
        is_shared: false,
        is_discover: false,
        share_id: null,
        reaction_count: 0,
      })
      .select('*')
      .single()

    if (error) {
      console.error('THOUGHT ENGINE NOTE INSERT ERROR:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result: ThoughtEngineResult = {
      ...parsed,
      relatedNoteIds,
    }

    return NextResponse.json({ note, result })
  } catch (err) {
    console.error('THOUGHT ENGINE ERROR:', err)
    return NextResponse.json({ error: 'Failed to process thought. Please try again.' }, { status: 500 })
  }
}
