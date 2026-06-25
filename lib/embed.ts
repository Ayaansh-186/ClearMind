// lib/embed.ts
//
// Thin wrapper around Groq's embedding endpoint.
// Groq exposes nomic-embed-text-v1.5 via their OpenAI-compatible API —
// we use the openai SDK (already installed) pointed at Groq's base URL.
//
// Output: 768-dimensional float array — one number per dimension.
// Every note and every user question gets turned into one of these vectors.
// Notes with similar meaning will have vectors that point in similar directions
// in this 768-dimensional space. That's what cosine similarity measures.

import OpenAI from 'openai'

// Groq's embedding model via OpenAI-compatible endpoint.
// 768 dims, fast, free on Groq's developer tier.
const EMBED_MODEL = 'nomic-embed-text-v1.5'

// Reuse the client across calls (module singleton — Next.js caches modules).
const groq = new OpenAI({
  apiKey:  process.env.GROQ_API_KEY ?? '',
  baseURL: 'https://api.groq.com/openai/v1',
})

/**
 * Turn any text into a 768-dim embedding vector.
 *
 * @param text  The note content or user question to embed.
 *              We truncate to 8000 chars — Groq's context limit for this model.
 * @returns     Float array of length 768, or null if the API call fails.
 *              Null is safe — callers fall back to recency-based context.
 */
export async function embed(text: string): Promise<number[] | null> {
  try {
    // Groq's nomic model expects a single string (not an array).
    // We trim and truncate to stay within token limits.
    const input = text.trim().slice(0, 8000)
    if (!input) return null

    const response = await groq.embeddings.create({
      model: EMBED_MODEL,
      input,
    })

    // The SDK returns an array of embedding objects — we only send one string
    // so we always get exactly one back at index 0.
    return response.data[0]?.embedding ?? null
  } catch (err) {
    // Log but don't throw — a missing embedding degrades gracefully.
    console.error('[embed] Failed to generate embedding:', err)
    return null
  }
}

/**
 * Embed a note's content for storage.
 * Combines title + formatted content for a richer signal than raw_content alone.
 * Falls back to raw_content if formatted_content isn't ready yet
 * (notes are formatted asynchronously after capture).
 */
export function buildNoteText(opts: {
  title: string | null
  raw_content: string
  formatted_content: string | null
}): string {
  const parts: string[] = []
  if (opts.title) parts.push(opts.title)
  parts.push(opts.formatted_content ?? opts.raw_content)
  return parts.join('\n\n')
}
