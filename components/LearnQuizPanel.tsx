'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Bot, User, Send, BookOpen, Brain, Loader2, RotateCcw, GraduationCap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

type Message = { id: string; role: 'user' | 'assistant'; content: string }
type Mode = 'idle' | 'teach' | 'quiz' | 'chat'

type Props = {
  notes: string
  onClose: () => void
}

export function LearnQuizPanel({ notes, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>('idle')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function startMode(newMode: 'teach' | 'quiz') {
    setMode(newMode)
    setMessages([])
    setLoading(true)

    try {
      const res = await fetch('/api/learn-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode, notes, history: [] })
      })
      const data = await res.json()
      setMessages([{ id: Date.now().toString(), role: 'assistant', content: data.reply }])
    } catch {
      setMessages([{ id: Date.now().toString(), role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/learn-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          notes,
          history: newHistory.map(m => ({ role: m.role, content: m.content })),
          userMessage: userMsg.content
        })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setMode('idle')
    setMessages([])
    setInput('')
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <GraduationCap size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Learn & Quiz</h2>
            <p className="text-xs text-zinc-500">
              {mode === 'idle' ? 'Choose a mode to get started' : mode === 'teach' ? '📖 Teaching mode' : '🧠 Quiz mode'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode !== 'idle' && (
            <button onClick={reset} className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition" title="Reset">
              <RotateCcw size={15} />
            </button>
          )}
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Mode selector */}
      {mode === 'idle' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8">
          <div className="text-center">
            <GraduationCap size={40} className="mx-auto mb-3 text-indigo-500" />
            <h3 className="text-lg font-semibold">How would you like to learn?</h3>
            <p className="mt-1 text-sm text-zinc-500">Pick a mode to start learning from your notes</p>
          </div>

          <div className="w-full space-y-3">
            <button onClick={() => startMode('teach')}
              className="flex w-full items-start gap-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 text-left hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition group">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 group-hover:bg-indigo-200 transition">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="font-semibold">Teach me step by step</p>
                <p className="mt-0.5 text-sm text-zinc-500">AI breaks down the notes into sections and teaches you one at a time. Ask questions at any point.</p>
              </div>
            </button>

            <button onClick={() => startMode('quiz')}
              className="flex w-full items-start gap-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 text-left hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition group">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 group-hover:bg-emerald-200 transition">
                <Brain size={22} />
              </div>
              <div>
                <p className="font-semibold">Test my knowledge</p>
                <p className="mt-0.5 text-sm text-zinc-500">Get a 5-question quiz on the most important concepts. Check your answers and get explanations.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Chat area */}
      {mode !== 'idle' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {loading && messages.length === 0 && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white"><Bot size={15} /></div>
                <div className="rounded-2xl rounded-tl-sm bg-zinc-100 dark:bg-zinc-900 px-4 py-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white mt-0.5">
                    <Bot size={15} />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-tr-sm'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="[&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:mb-1 [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:space-y-1 [&_p]:mb-2 last:[&_p]:mb-0 [&_strong]:font-semibold [&_hr]:border-zinc-300 dark:[&_hr]:border-zinc-700 [&_hr]:my-3">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 mt-0.5">
                    <User size={15} />
                  </div>
                )}
              </div>
            ))}

            {loading && messages.length > 0 && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Bot size={15} />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-zinc-100 dark:bg-zinc-900 px-4 py-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick action chips */}
          {!loading && messages.length > 0 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap shrink-0">
              {mode === 'teach' && (
                <>
                  <button onClick={() => { setInput('Next section please'); setTimeout(sendMessage, 50) }}
                    className="rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                    Next section →
                  </button>
                  <button onClick={() => { setInput('Can you give me an example?'); setTimeout(sendMessage, 50) }}
                    className="rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                    Give an example
                  </button>
                  <button onClick={() => startMode('quiz')}
                    className="rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition">
                    Take quiz instead →
                  </button>
                </>
              )}
              {mode === 'quiz' && (
                <>
                  <button onClick={() => startMode('quiz')}
                    className="rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                    New quiz
                  </button>
                  <button onClick={() => startMode('teach')}
                    className="rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 text-xs text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 transition">
                    Teach me instead →
                  </button>
                </>
              )}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder={mode === 'teach' ? 'Ask a question or say "next"...' : 'Type your answer or ask a question...'}
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
              />
              <button onClick={sendMessage} disabled={!input.trim() || loading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-700 transition">
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
