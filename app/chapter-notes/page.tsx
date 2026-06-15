'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, Upload, Loader2, FileText, X, BookOpen, Download, Copy, Check, FileType, GraduationCap, Layers } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { LearnQuizPanel } from '@/components/LearnQuizPanel'
import { FlashcardsPanel } from '@/components/FlashcardsPanel'

function getBrowserClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

async function extractTextFromPdf(file: File, onProgress: (msg: string) => void): Promise<string> {
  const pdfjsLib = (window as any).pdfjsLib
  if (!pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => resolve(); script.onerror = reject
      document.head.appendChild(script)
    })
  }
  const lib = (window as any).pdfjsLib
  lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await lib.getDocument({ data: arrayBuffer }).promise
  const numPages = Math.min(pdfDoc.numPages, 50)
  let fullText = ''
  for (let i = 1; i <= numPages; i++) {
    onProgress(`Extracting page ${i} of ${numPages}...`)
    const page = await pdfDoc.getPage(i)
    const textContent = await page.getTextContent()
    fullText += `\n--- Page ${i} ---\n${textContent.items.map((item: any) => item.str).join(' ')}`
  }
  return fullText.trim()
}

const NOTE_STYLES = [
  { value: 'detailed', label: 'Detailed Notes', desc: 'Everything important, fully explained', emoji: '📚' },
  { value: 'concise', label: 'Concise Notes', desc: 'Key points only, quick revision', emoji: '⚡' },
  { value: 'exam', label: 'Exam Ready', desc: 'Definitions, formulas, important Q&As', emoji: '🎯' },
  { value: 'mindmap', label: 'Mind Map Style', desc: 'Hierarchical topics and subtopics', emoji: '🗺️' },
]

export default function ChapterNotesPage() {
  const router = useRouter()
  const [pdfText, setPdfText] = useState('')
  const [fileName, setFileName] = useState('')
  const [converting, setConverting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [currentChunk, setCurrentChunk] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [notes, setNotes] = useState('')
  const [noteStyle, setNoteStyle] = useState('detailed')
  const [subject, setSubject] = useState('')
  const [copied, setCopied] = useState(false)
  const [pageCount, setPageCount] = useState(0)
  const [downloadingWord, setDownloadingWord] = useState(false)
  const [showLearn, setShowLearn] = useState(false)
  const [showFlashcards, setShowFlashcards] = useState(false)
  const notesRef = useRef<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getBrowserClient().auth.getSession().then(({ data }) => {
      if (!data.session?.user) router.replace('/login')
    })
  }, [router])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setConverting(true); setPdfText(''); setNotes(''); notesRef.current = []
    try {
      const text = await extractTextFromPdf(file, setProgress)
      if (text.length > 200) {
        setPdfText(text); setFileName(file.name)
        const pages = (text.match(/--- Page \d+ ---/g) ?? []).length
        setPageCount(pages); setProgress(`✓ ${pages} pages extracted`)
      } else { setProgress('Could not extract text — may be a scanned PDF.') }
    } catch { setProgress('Error reading PDF.') }
    setConverting(false); e.target.value = ''
  }

  async function generateNotes() {
    if (!pdfText) return
    setGenerating(true); setNotes(''); notesRef.current = []
    const CHUNK_SIZE = 4000
    const chunks: string[] = []
    for (let i = 0; i < pdfText.length; i += CHUNK_SIZE) chunks.push(pdfText.slice(i, i + CHUNK_SIZE))
    setTotalChunks(chunks.length)
    try {
      for (let i = 0; i < chunks.length; i++) {
        setCurrentChunk(i + 1)
        setProgress(`Generating part ${i + 1} of ${chunks.length}...`)
        const res = await fetch('/api/chapter-notes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ textContent: chunks[i], style: noteStyle, subject, isFirstChunk: i === 0, totalChunks: chunks.length, chunkIndex: i })
        })
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        if (data.notes) {
          notesRef.current = [...notesRef.current, data.notes]
          setNotes(notesRef.current.join('\n\n---\n\n'))
        }
        if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 3000))
      }
      setProgress('')
    } catch (err) {
      console.error(err); setProgress('Error generating notes. Please try again.')
    } finally { setGenerating(false); setCurrentChunk(0); setTotalChunks(0) }
  }

  async function copyNotes() {
    await navigator.clipboard.writeText(notes)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function downloadMd() {
    const blob = new Blob([notes], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `notes-${subject || fileName || 'chapter'}.md`; a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadWord() {
    setDownloadingWord(true)
    try {
      const res = await fetch('/api/export-docx', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: notes, title: subject || fileName || 'Chapter Notes' })
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `notes-${subject || fileName || 'chapter'}.docx`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err); alert('Word export failed. Try downloading as Markdown instead.')
    } finally { setDownloadingWord(false) }
  }

  const progressPct = totalChunks > 0 ? Math.round((currentChunk / totalChunks) * 100) : 0

  return (
    <main className="flex h-screen flex-col bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
      <header className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 shrink-0">
        <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold">📖 Chapter Notes Generator</h1>
          <p className="text-xs text-zinc-500">Upload any chapter — up to 50 pages</p>
        </div>
        {notes && (
          <div className="flex gap-2 flex-wrap justify-end">
            <button onClick={() => setShowFlashcards(true)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs text-white transition">
              <Layers size={13} /> Flashcards
            </button>
            <button onClick={() => setShowLearn(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs text-white transition">
              <GraduationCap size={13} /> Learn & Quiz
            </button>
            <button onClick={copyNotes} className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={downloadMd} className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
              <Download size={13} /> Markdown
            </button>
            <button onClick={downloadWord} disabled={downloadingWord}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs text-white disabled:opacity-60 transition">
              {downloadingWord ? <Loader2 size={13} className="animate-spin" /> : <FileType size={13} />}
              {downloadingWord ? 'Exporting...' : 'Word (.docx)'}
            </button>
          </div>
        )}
      </header>

      {generating && totalChunks > 0 && (
        <div className="shrink-0">
          <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
            <div className="h-1 bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-50 dark:bg-zinc-900/50">
            <span className="text-xs text-zinc-500">{progress}</span>
            <span className="text-xs font-semibold text-blue-500">{progressPct}%</span>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col p-4 gap-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">Subject (optional)</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Chemistry, Biology..."
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400 transition" />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">Note Style</label>
            <div className="space-y-2">
              {NOTE_STYLES.map(style => (
                <button key={style.value} onClick={() => setNoteStyle(style.value)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${noteStyle === style.value ? 'border-zinc-950 dark:border-white bg-zinc-50 dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
                  <span className="text-base">{style.emoji}</span>
                  <div><p className="text-sm font-medium">{style.label}</p><p className="text-xs text-zinc-500">{style.desc}</p></div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 block">Upload Chapter PDF</label>
            <div onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-5 text-center hover:border-zinc-400 transition">
              {converting
                ? <><Loader2 size={20} className="animate-spin text-zinc-400" /><p className="text-xs text-zinc-500">{progress}</p></>
                : <><Upload size={20} className="text-zinc-400" /><p className="text-xs font-medium">Click to upload PDF</p><p className="text-xs text-zinc-400">Up to 50 pages</p></>}
            </div>
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
          </div>

          {pdfText && !converting && (
            <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-green-600 shrink-0" />
                <span className="flex-1 truncate text-xs font-medium text-green-700 dark:text-green-400">{fileName}</span>
                <button onClick={() => { setPdfText(''); setFileName(''); setPageCount(0); setNotes(''); notesRef.current = [] }} className="text-green-500 hover:text-green-700"><X size={13} /></button>
              </div>
              <p className="mt-1 text-xs text-green-600">✓ {pageCount} pages ready</p>
            </div>
          )}

          {progress && !converting && !generating && (
            <p className="text-xs text-center text-zinc-500 rounded-lg bg-zinc-50 dark:bg-zinc-900 px-3 py-2">{progress}</p>
          )}

          <button onClick={generateNotes} disabled={!pdfText || generating || converting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-white dark:text-zinc-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-30 hover:bg-zinc-800 transition">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
            {generating ? `Generating... ${progressPct}%` : 'Generate Notes'}
          </button>

          {notes && !generating && (
            <div className="space-y-2">
              <button onClick={() => setShowFlashcards(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition">
                <Layers size={16} /> Flashcards
              </button>
              <button onClick={() => setShowLearn(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3 text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 transition">
                <GraduationCap size={16} /> Learn & Quiz
              </button>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {!notes && !generating && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-10">
                <BookOpen size={40} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                <p className="font-semibold text-zinc-600 dark:text-zinc-300">Your notes will appear here</p>
                <p className="mt-1 text-sm text-zinc-400">Upload a PDF and click Generate Notes</p>
                <div className="mt-5 space-y-2 text-left">
                  <div className="flex items-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-500">
                    <Download size={12} /> Download as Markdown or Word (.docx)
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                    <Layers size={12} /> Auto-generate flashcards to memorize
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400">
                    <GraduationCap size={12} /> Learn step by step or take a quiz
                  </div>
                </div>
              </div>
            </div>
          )}
          {generating && !notes && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Loader2 size={32} className="mb-4 animate-spin text-blue-500" />
              <p className="font-semibold text-zinc-600 dark:text-zinc-300">Generating your notes...</p>
              <p className="mt-1 text-sm text-zinc-400">{progress}</p>
              <div className="mt-4 h-2 w-48 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="h-2 rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}
          {notes && (
            <div className="prose prose-zinc dark:prose-invert max-w-none text-sm leading-7
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:border-b [&_h1]:border-zinc-200 [&_h1]:pb-3
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-8
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5
              [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5
              [&_p]:mb-3 [&_strong]:font-semibold
              [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-600 dark:[&_blockquote]:text-zinc-400
              [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
              [&_th]:border [&_th]:border-zinc-200 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-zinc-50 [&_th]:font-semibold dark:[&_th]:bg-zinc-900 dark:[&_th]:border-zinc-700
              [&_td]:border [&_td]:border-zinc-200 [&_td]:px-3 [&_td]:py-2 dark:[&_td]:border-zinc-700
              [&_hr]:border-zinc-100 dark:[&_hr]:border-zinc-800 [&_hr]:my-8">
              <ReactMarkdown>{notes}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {showLearn && <LearnQuizPanel notes={notes} onClose={() => setShowLearn(false)} />}
      {showFlashcards && <FlashcardsPanel notes={notes} onClose={() => setShowFlashcards(false)} />}
    </main>
  )
}
