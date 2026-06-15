'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, Upload, Send, Loader2, Bot, User, FileText, X, ChevronDown, RefreshCw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

function getBrowserClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

type Message = { id: string; role: 'user' | 'assistant'; content: string }
type UploadedFile = { name: string; base64: string; type: string }
type DocType = 'auto' | 'marksheet' | 'model' | 'student' | 'question'

const DOC_TYPES: { value: DocType; label: string; desc: string; emoji: string }[] = [
  { value: 'auto', label: 'Auto detect', desc: 'Let AI figure it out', emoji: '🤖' },
  { value: 'marksheet', label: 'Marksheet / Result card', desc: 'Has my subject scores', emoji: '📊' },
  { value: 'model', label: 'Model answer sheet', desc: 'Correct answers / full marks solutions', emoji: '📋' },
  { value: 'student', label: 'My answer sheet', desc: 'My own written answers', emoji: '✍️' },
  { value: 'question', label: 'Question paper', desc: 'Only questions, no answers', emoji: '❓' },
]

async function pdfToImages(file: File): Promise<UploadedFile[]> {
  const pdfjsLib = (window as any).pdfjsLib
  if (!pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => resolve()
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  const lib = (window as any).pdfjsLib
  lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await lib.getDocument({ data: arrayBuffer }).promise
  const images: UploadedFile[] = []
  const numPages = Math.min(pdfDoc.numPages, 4)
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i)
    const viewport = page.getViewport({ scale: 2.0 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
    images.push({ name: `${file.name} page ${i}`, base64: canvas.toDataURL('image/jpeg', 0.85).split(',')[1], type: 'image/jpeg' })
  }
  return images
}

function getDocTypePrompt(type: DocType): string {
  switch (type) {
    case 'marksheet': return 'This is a MARKSHEET / RESULT CARD. List every subject with exact marks shown, calculate percentage, identify strongest and weakest subjects, give targeted study tips.'
    case 'model': return 'This is a MODEL ANSWER SHEET / ANSWER KEY. Do NOT treat this as student performance. State clearly it is a model answer sheet. List topics covered and explain what students must master to score full marks. Give a study plan.'
    case 'student': return 'This is a STUDENT\'S OWN ANSWER SHEET. Identify correct and incorrect answers, point out conceptual gaps, give improvement tips.'
    case 'question': return 'This is a QUESTION PAPER. List all topics covered and give a study plan to prepare for each topic.'
    default: return 'Analyze this document. First identify if it is a marksheet, model answer sheet, student answer sheet, or question paper. Then give appropriate analysis.'
  }
}

export default function AnalyzePage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [analyzed, setAnalyzed] = useState(false)
  const [converting, setConverting] = useState(false)
  const [docType, setDocType] = useState<DocType>('auto')
  const [showDropdown, setShowDropdown] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getBrowserClient().auth.getSession().then(({ data }) => {
      if (!data.session?.user) router.replace('/login')
    })
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    setConverting(true)
    const loaded: UploadedFile[] = []
    for (const file of selected) {
      if (file.type === 'application/pdf') {
        try { loaded.push(...await pdfToImages(file)) }
        catch {
          const base64 = await new Promise<string>(resolve => { const r = new FileReader(); r.onload = () => resolve((r.result as string).split(',')[1]); r.readAsDataURL(file) })
          loaded.push({ name: file.name, base64, type: file.type })
        }
      } else {
        const base64 = await new Promise<string>(resolve => { const r = new FileReader(); r.onload = () => resolve((r.result as string).split(',')[1]); r.readAsDataURL(file) })
        loaded.push({ name: file.name, base64, type: file.type })
      }
    }
    setFiles(prev => [...prev, ...loaded])
    setConverting(false)
    e.target.value = ''
  }

  async function analyzeFiles() {
    if (!files.length) return
    setLoading(true)
    setAnalyzed(true)
    const selectedType = DOC_TYPES.find(d => d.value === docType)!
    const prompt = getDocTypePrompt(docType)
    const userMsg: Message = {
      id: Date.now().toString(), role: 'user',
      content: `📎 ${[...new Set(files.map(f => f.name.replace(/ page \d+$/, '')))].join(', ')}\n📄 ${selectedType.emoji} ${selectedType.label}\n\n${prompt}`
    }
    setMessages([userMsg])
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, message: prompt, docType })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: data.reply ?? 'Could not analyze.' }])
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally { setLoading(false) }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [], message: input.trim(), history: messages.map(m => ({ role: m.role, content: m.content })) })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.reply ?? '' }])
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Something went wrong.' }])
    } finally { setLoading(false) }
  }

  function reset() {
    setAnalyzed(false)
    setMessages([])
    setFiles([])
    setInput('')
  }

  const selectedType = DOC_TYPES.find(d => d.value === docType)!
  const uniqueNames = [...new Set(files.map(f => f.name.replace(/ page \d+$/, '')))]

  return (
    <main className="flex h-screen flex-col bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
      <header className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 shrink-0">
        <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold">📊 Performance Analyzer</h1>
          <p className="text-xs text-zinc-500">Upload marksheets or answer sheets for AI analysis</p>
        </div>
        {analyzed && (
          <button onClick={reset} className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
            <RefreshCw size={12} /> New analysis
          </button>
        )}
      </header>

      {!analyzed && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6">
          {/* Doc type selector */}
          <div className="w-full max-w-md">
            <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">What are you uploading?</p>
            <div className="relative">
              <button onClick={() => setShowDropdown(!showDropdown)}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-3 text-sm transition hover:border-zinc-300">
                <span>{selectedType.emoji} {selectedType.label}</span>
                <ChevronDown size={16} className={`text-zinc-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
                  {DOC_TYPES.map(type => (
                    <button key={type.value} onClick={() => { setDocType(type.value); setShowDropdown(false) }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition ${docType === type.value ? 'bg-zinc-50 dark:bg-zinc-800' : ''}`}>
                      <span className="text-xl">{type.emoji}</span>
                      <div><p className="text-sm font-medium">{type.label}</p><p className="text-xs text-zinc-500">{type.desc}</p></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upload */}
          <div onClick={() => fileRef.current?.click()}
            className="flex w-full max-w-md cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-10 text-center hover:border-zinc-400 dark:hover:border-zinc-500 transition">
            {converting
              ? <><Loader2 size={28} className="animate-spin text-zinc-400" /><p className="text-sm font-medium">Converting PDF...</p></>
              : <><Upload size={28} className="text-zinc-400" /><p className="font-medium text-sm">Click to upload</p><p className="text-xs text-zinc-500">PDF, JPG, PNG, WEBP</p></>
            }
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />

          {files.length > 0 && !converting && (
            <div className="w-full max-w-md space-y-2">
              {uniqueNames.map((name, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5">
                  <FileText size={15} className="text-zinc-400 shrink-0" />
                  <span className="flex-1 truncate text-sm">{name}</span>
                  <span className="text-xs text-zinc-400">{files.filter(f => f.name.startsWith(name)).length}p</span>
                  <button onClick={() => setFiles(prev => prev.filter(f => !f.name.startsWith(name)))} className="text-zinc-400 hover:text-red-500 transition"><X size={14} /></button>
                </div>
              ))}
              <button onClick={analyzeFiles}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-white dark:text-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition">
                <Bot size={17} /> Analyze with AI
              </button>
            </div>
          )}
        </div>
      )}

      {analyzed && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 mt-0.5"><Bot size={15} /></div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-tr-sm'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant'
                    ? <div className="[&_h2]:font-semibold [&_h2]:text-base [&_h2]:mb-2 [&_h3]:font-medium [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-2 [&_strong]:font-semibold"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    : <p className="whitespace-pre-wrap">{msg.content}</p>
                  }
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 mt-0.5"><User size={15} /></div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"><Bot size={15} /></div>
                <div className="rounded-2xl rounded-tl-sm bg-zinc-100 dark:bg-zinc-900 px-4 py-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 shrink-0 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Ask a follow-up question..."
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-zinc-400 transition" />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 disabled:opacity-30 transition hover:bg-zinc-800">
              <Send size={16} />
            </button>
          </div>
        </>
      )}
    </main>
  )
}
