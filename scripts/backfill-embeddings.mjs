// scripts/backfill-embeddings.mjs
import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually (dotenv may not be installed, so we parse it ourselves)
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !process.env[key]) process.env[key] = val
  }
  console.log('✅ Loaded .env.local')
} catch {
  console.warn('⚠️  Could not load .env.local — make sure env vars are set manually')
}

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service key bypasses RLS for backfill
)

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

const EMBED_MODEL  = 'nomic-embed-text-v1.5'
const BATCH_SIZE   = 10 // process 10 notes at a time
const DELAY_MS     = 500 // wait 500ms between batches to respect rate limits

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function embedText(text) {
  const response = await groq.embeddings.create({
    model: EMBED_MODEL,
    input: text.trim().slice(0, 8000),
  })
  return response.data[0]?.embedding ?? null
}

async function main() {
  console.log('🔍 Finding notes without embeddings...')

  // Fetch all notes that don't have an embedding yet
  // Fetch IDs that already have embeddings
  const { data: existing } = await supabase
    .from('note_embeddings')
    .select('note_id')

  const embeddedIds = (existing ?? []).map(r => r.note_id)

  // Fetch all non-archived notes
  let query = supabase
    .from('notes')
    .select('id, user_id, title, raw_content, formatted_content')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  // Exclude already-embedded notes (if any exist)
  if (embeddedIds.length > 0) {
    query = query.not('id', 'in', `(${embeddedIds.map(id => `"${id}"`).join(',')})`)
  }

  const { data: notes, error } = await query

  if (error) {
    console.error('Failed to fetch notes:', error)
    process.exit(1)
  }

  console.log(`📝 Found ${notes.length} notes to embed`)

  if (notes.length === 0) {
    console.log('✅ All notes already have embeddings!')
    return
  }

  let success = 0
  let failed  = 0

  // Process in batches
  for (let i = 0; i < notes.length; i += BATCH_SIZE) {
    const batch = notes.slice(i, i + BATCH_SIZE)
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(notes.length / BATCH_SIZE)} (notes ${i + 1}–${Math.min(i + BATCH_SIZE, notes.length)})`)

    await Promise.all(batch.map(async (note) => {
      try {
        const parts = []
        if (note.title) parts.push(note.title)
        parts.push(note.formatted_content ?? note.raw_content)
        const text = parts.join('\n\n')

        const vector = await embedText(text)
        if (!vector) { failed++; return }

        const { error: upsertError } = await supabase
          .from('note_embeddings')
          .upsert({
            note_id:   note.id,
            user_id:   note.user_id,
            embedding: JSON.stringify(vector),
          }, { onConflict: 'note_id' })

        if (upsertError) {
          console.error(`  ❌ ${note.id}: ${upsertError.message}`)
          failed++
        } else {
          console.log(`  ✅ ${note.title ?? note.id.slice(0, 8)}`)
          success++
        }
      } catch (err) {
        console.error(`  ❌ ${note.id}: ${err.message}`)
        failed++
      }
    }))

    // Don't hammer the API
    if (i + BATCH_SIZE < notes.length) await sleep(DELAY_MS)
  }

  console.log(`\n🎉 Done! ${success} embedded, ${failed} failed`)
  if (failed > 0) {
    console.log('Re-run the script to retry failed notes — it uses upsert so it\'s safe to run multiple times.')
  }
}

main()
