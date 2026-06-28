import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

async function extractTextFromImage(base64Image: string, mimeType: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.6-27b',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            },
            {
              type: 'text',
              text: 'Extract all visible text, ideas, and information from this image. This may be a photo of handwritten notes, a whiteboard, a document, or a screenshot. Transcribe everything accurately and structure it as clean readable markdown. Return only the extracted content, nothing else.'
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    })
  })

  const data = await res.json()
  console.log('Groq vision status:', res.status, JSON.stringify(data).slice(0, 150))
  if (!res.ok) throw new Error(data?.error?.message ?? 'Groq vision error')
  return data.choices?.[0]?.message?.content ?? ''
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = (formData.get('image') ?? formData.get('file')) as File | null
    const userId = formData.get('user_id') as string | null

    if (!file || !userId) {
      return NextResponse.json({ error: 'file and user_id are required' }, { status: 400 })
    }

    console.log('Processing image:', file.name, file.size, 'bytes')

    // Convert to base64 for Groq vision
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('note-images')
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Upload error:', uploadError.message)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('note-images').getPublicUrl(fileName)
    const imageUrl = urlData.publicUrl

    // Extract text using Groq vision
    let extractedText = ''
    try {
      extractedText = await extractTextFromImage(base64, file.type)
      console.log('✓ Extracted text:', extractedText.slice(0, 100))
    } catch (err) {
      console.error('Vision extraction failed:', err)
      extractedText = `📷 Image captured on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.\n\nAI could not extract text from this image. Open the note to view the image.`
    }

    // Save note
    const { data: note, error: insertError } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        raw_content: extractedText,
        image_url: imageUrl,
        title: null,
        cluster: null,
        relevance: 5,
        is_archived: false,
        is_pinned: false,
        is_shared: false,
        is_discover: false,
        share_id: null,
        reaction_count: 0,
      })
      .select('*')
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    // Trigger clustering on extracted text
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? request.headers.get('origin') ?? 'http://localhost:3000'}/api/notes/cluster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_id: note.id, content: extractedText }),
    }).catch(err => console.error('Cluster error:', err))

    console.log('✓ Image note created:', note.id)
    return NextResponse.json(note)
  } catch (err) {
    console.error('IMAGE ROUTE FAILED:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}