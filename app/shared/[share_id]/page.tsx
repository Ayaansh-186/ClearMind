'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase'
import { Send, Loader2, MessageSquare, Sparkles, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const supabase = createBrowserSupabase()

type Note = {
  id: string
  title: string | null
  raw_content: string
  formatted_content: string | null
  cluster: string | null
  created_at: string
}

type Comment = {
  id: string
  note_id: string
  author_name: string
  content: string
  created_at: string
}

function relTime(s: string) {
  const diff = Date.now() - new Date(s).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(name: string) {
  const colors = ['#7F77DD', '#1D9E75', '#D85A30', '#378ADD', '#639922', '#EC4899', '#F59E0B']
  let hash = 0
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function SharedNotePage() {
  const params = useParams()
  const shareId = params?.share_id as string
  const [note, setNote] = useState<Note | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [authorName, setAuthorName] = useState('')
  const [savedName, setSavedName] = useState('')
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [view, setView] = useState<'note' | 'comments'>('note')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('clarity_display_name')
    if (saved) setSavedName(saved)
  }, [])

  useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function load() {
      const { data: rawData, error } = await supabase
        .from('notes')
        .select('id, title, raw_content, formatted_content, cluster, created_at')
        .eq('share_id', shareId)
        .eq('is_shared', true)
        .single()

      if (cancelled) return
      if (error || !rawData) { setNotFound(true); setLoading(false); return }
      const data = rawData as unknown as Note
      setNote(data)

      // Load comments
      const { data: cData } = await supabase
        .from('note_comments')
        .select('*')
        .eq('note_id', data.id)
        .order('created_at', { ascending: true })
      if (cancelled) return
      setComments(cData ?? [])
      setLoading(false)

      // Subscribe to realtime comments
      channel = supabase.channel(`comments:${data.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'note_comments',
          filter: `note_id=eq.${data.id}`
        }, payload => {
          setComments(prev => {
            const incoming = payload.new as Comment
            return prev.some(c => c.id === incoming.id) ? prev : [...prev, incoming]
          })
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        })
      channel.subscribe()
    }
    if (shareId) load()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [shareId])

  async function postComment() {
    if (!newComment.trim() || !savedName || posting || !note) return
    setPosting(true)
    setCommentError(null)
    try {
      const res = await fetch('/api/note-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: note.id, author_name: savedName, content: newComment.trim() })
      })
      if (res.ok) {
        const created = await res.json()
        setComments(prev => prev.some(c => c.id === created.id) ? prev : [...prev, created])
        setNewComment('')
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        const body = await res.json().catch(() => null)
        setCommentError(body?.error ?? 'Failed to post comment. Please try again.')
      }
    } catch {
      setCommentError('Failed to post comment. Please check your connection and try again.')
    } finally { setPosting(false) }
  }

  function saveName() {
    const n = authorName.trim()
    if (!n) return
    setSavedName(n)
    localStorage.setItem('clarity_display_name', n)
    setAuthorName('')
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-zinc-950">
      <Loader2 size={28} className="animate-spin text-zinc-400" />
    </div>
  )

  if (notFound) return (
    <div className="flex h-screen flex-col items-center justify-center bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 p-8 text-center">
      <Sparkles size={40} className="mb-4 text-zinc-300" />
      <h1 className="text-xl font-semibold">Note not found</h1>
      <p className="mt-2 text-sm text-zinc-500">This note may have been unshared or the link is incorrect.</p>
    </div>
  )

  const content = note?.formatted_content || note?.raw_content || ''

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur px-5 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-950 dark:bg-white text-white dark:text-zinc-950">
              <Sparkles size={14} />
            </div>
            <span className="font-semibold text-sm">Clarity</span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span className="text-sm text-zinc-500">Shared note</span>
          </div>
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden text-xs">
            <button onClick={() => setView('note')}
              className={`px-3 py-1.5 transition ${view === 'note' ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
              Note
            </button>
            <button onClick={() => setView('comments')}
              className={`flex items-center gap-1 px-3 py-1.5 transition ${view === 'comments' ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
              <MessageSquare size={11} /> {comments.length}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-8">
        {/* Note title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{note?.title ?? 'Shared Note'}</h1>
          <p className="mt-1 text-sm text-zinc-500">Shared via Clarity · {relTime(note?.created_at ?? '')}</p>
        </div>

        {/* Note content */}
        {view === 'note' && (
          <div className="prose prose-zinc dark:prose-invert max-w-none text-sm leading-7
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:border-b [&_h1]:border-zinc-200 [&_h1]:pb-3
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-8
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5
            [&_p]:mb-3 [&_strong]:font-semibold
            [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:italic
            [&_table]:w-full [&_table]:border-collapse
            [&_th]:border [&_th]:border-zinc-200 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-zinc-50 [&_th]:font-semibold dark:[&_th]:bg-zinc-900 dark:[&_th]:border-zinc-700
            [&_td]:border [&_td]:border-zinc-200 [&_td]:px-3 [&_td]:py-2 dark:[&_td]:border-zinc-700
            [&_hr]:border-zinc-100 dark:[&_hr]:border-zinc-800 [&_hr]:my-8">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}

        {/* Comments */}
        {view === 'comments' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-base">{comments.length} comment{comments.length !== 1 ? 's' : ''}</h2>

            {comments.length === 0 && (
              <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8 text-center">
                <MessageSquare size={28} className="mx-auto mb-2 text-zinc-300" />
                <p className="text-sm text-zinc-500">No comments yet. Be the first to add one!</p>
              </div>
            )}

            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold"
                  style={{ backgroundColor: getAvatarColor(c.author_name) }}>
                  {getInitials(c.author_name)}
                </div>
                <div className="flex-1 rounded-2xl rounded-tl-sm bg-zinc-100 dark:bg-zinc-900 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">{c.author_name}</span>
                    <span className="text-xs text-zinc-400">{relTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{c.content}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />

            {/* Name setup */}
            {!savedName && (
              <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 p-5">
                <p className="text-sm font-medium mb-3">Enter your name to comment</p>
                <div className="flex gap-2">
                  <input value={authorName} onChange={e => setAuthorName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName() }}
                    placeholder="Your name..."
                    className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-400" />
                  <button onClick={saveName} disabled={!authorName.trim()}
                    className="rounded-xl bg-zinc-950 dark:bg-white dark:text-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-zinc-800 transition">
                    Set name
                  </button>
                </div>
              </div>
            )}

            {/* Comment input */}
            {savedName && (
              <div className="sticky bottom-4 space-y-2">
                {commentError && (
                  <p className="text-xs text-red-500 px-2">{commentError}</p>
                )}
                <div className="flex gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-2 shadow-lg">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold"
                    style={{ backgroundColor: getAvatarColor(savedName) }}>
                    {getInitials(savedName)}
                  </div>
                  <input value={newComment} onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment() } }}
                    placeholder={`Add a comment as ${savedName}...`}
                    className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-zinc-400" />
                  <button onClick={postComment} disabled={!newComment.trim() || posting}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 disabled:opacity-30 hover:bg-zinc-800 transition">
                    {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
