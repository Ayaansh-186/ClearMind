'use client'

import { useState } from 'react'
import { X, Loader2, ChevronLeft, ChevronRight, RotateCcw, Shuffle, Check, BookOpen, Layers } from 'lucide-react'

type Flashcard = {
  front: string
  back: string
  category: string
}

type Props = {
  notes: string
  onClose: () => void
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Definition':  { bg: '#EEEDFE', text: '#534AB7' },
  'Concept':     { bg: '#E1F5EE', text: '#0F6E56' },
  'Formula':     { bg: '#FEF3C7', text: '#92400E' },
  'Date':        { bg: '#FCE7F3', text: '#9D174D' },
  'Person':      { bg: '#E0E7FF', text: '#3730A3' },
  'Process':     { bg: '#FAECE7', text: '#993C1D' },
  'Key Fact':    { bg: '#E6F1FB', text: '#185FA5' },
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function FlashcardsPanel({ notes, onClose }: Props) {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [unknown, setUnknown] = useState<Set<number>>(new Set())
  const [mode, setMode] = useState<'idle' | 'study' | 'results'>('idle')
  const [count, setCount] = useState(15)
  const [filter, setFilter] = useState<string>('All')

  async function generate() {
    setLoading(true)
    setError('')
    setKnown(new Set())
    setUnknown(new Set())
    setCurrent(0)
    setFlipped(false)

    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, count })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCards(data.cards)
      setMode('study')
    } catch (err) {
      setError('Failed to generate flashcards. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredCards = filter === 'All' ? cards : cards.filter(c => c.category === filter)
  const card = filteredCards[current]
  const categories = ['All', ...Array.from(new Set(cards.map(c => c.category)))]
  const progress = filteredCards.length > 0 ? Math.round(((known.size + unknown.size) / filteredCards.length) * 100) : 0

  function next() {
    setFlipped(false)
    setTimeout(() => setCurrent(i => Math.min(i + 1, filteredCards.length - 1)), 150)
  }

  function prev() {
    setFlipped(false)
    setTimeout(() => setCurrent(i => Math.max(i - 1, 0)), 150)
  }

  function markKnown() {
    setKnown(prev => new Set([...prev, current]))
    setUnknown(prev => { const n = new Set(prev); n.delete(current); return n })
    if (current < filteredCards.length - 1) next()
    else setMode('results')
  }

  function markUnknown() {
    setUnknown(prev => new Set([...prev, current]))
    setKnown(prev => { const n = new Set(prev); n.delete(current); return n })
    if (current < filteredCards.length - 1) next()
    else setMode('results')
  }

  function restart() {
    setCards(shuffle(cards))
    setCurrent(0)
    setFlipped(false)
    setKnown(new Set())
    setUnknown(new Set())
    setMode('study')
  }

  function shuffleCards() {
    const shuffled = shuffle(filteredCards)
    setCards(prev => {
      const otherCards = filter === 'All' ? [] : prev.filter(c => c.category !== filter)
      return [...otherCards, ...shuffled]
    })
    setCurrent(0)
    setFlipped(false)
  }

  const colors = card ? (CATEGORY_COLORS[card.category] ?? { bg: '#F4F4F5', text: '#52525B' }) : null

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white">
            <Layers size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Flashcards</h2>
            <p className="text-xs text-zinc-500">
              {mode === 'idle' ? 'Auto-generated from your notes' : `${filteredCards.length} cards · ${known.size} known · ${unknown.size} to review`}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition">
          <X size={18} />
        </button>
      </div>

      {/* Idle — setup */}
      {mode === 'idle' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/30">
              <Layers size={32} className="text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold">Generate Flashcards</h3>
            <p className="mt-1 text-sm text-zinc-500">AI will create flashcards from your notes covering definitions, concepts, formulas and key facts</p>
          </div>

          <div className="w-full">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 block">How many cards?</label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 25].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  className={`rounded-xl border py-3 text-sm font-semibold transition ${count === n ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button onClick={generate} disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 transition">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Layers size={16} /> Generate {count} Flashcards</>}
          </button>
        </div>
      )}

      {/* Study mode */}
      {mode === 'study' && card && (
        <>
          {/* Progress bar */}
          <div className="shrink-0 px-4 pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-500">{current + 1} / {filteredCards.length}</span>
              <span className="text-xs font-medium text-amber-500">{progress}% done</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-1.5 rounded-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Category filter */}
          {categories.length > 2 && (
            <div className="shrink-0 px-4 pt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => { setFilter(cat); setCurrent(0); setFlipped(false) }}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${filter === cat ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950' : 'border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900'}`}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Flashcard */}
          <div className="flex-1 flex flex-col items-center justify-center px-5 py-4">
            {/* Category badge */}
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: colors!.bg, color: colors!.text }}>
                {card.category}
              </span>
              {known.has(current) && <span className="rounded-full bg-green-100 dark:bg-green-950/30 px-2 py-1 text-xs text-green-600">✓ Known</span>}
              {unknown.has(current) && <span className="rounded-full bg-red-100 dark:bg-red-950/30 px-2 py-1 text-xs text-red-600">× Review</span>}
            </div>

            {/* Card */}
            <div
              onClick={() => setFlipped(f => !f)}
              className="relative w-full cursor-pointer select-none"
              style={{ perspective: '1000px' }}
            >
              <div className={`relative w-full transition-all duration-500`} style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', minHeight: '220px' }}>
                {/* Front */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 text-center shadow-sm" style={{ backfaceVisibility: 'hidden' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Question</p>
                  <p className="text-lg font-semibold leading-snug text-zinc-950 dark:text-zinc-50">{card.front}</p>
                  <p className="mt-4 text-xs text-zinc-400">Tap to reveal answer</p>
                </div>
                {/* Back */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-6 text-center shadow-sm" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-4">Answer</p>
                  <p className="text-base leading-relaxed text-zinc-800 dark:text-zinc-200">{card.back}</p>
                </div>
              </div>
            </div>

            {/* Mark buttons — only show after flip */}
            {flipped && (
              <div className="mt-5 flex gap-3 w-full">
                <button onClick={markUnknown}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition">
                  <X size={16} /> Still learning
                </button>
                <button onClick={markKnown}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 py-3 text-sm font-semibold text-green-600 dark:text-green-400 hover:bg-green-100 transition">
                  <Check size={16} /> Got it!
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-4 flex items-center gap-4">
              <button onClick={prev} disabled={current === 0}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                <ChevronLeft size={20} />
              </button>
              <button onClick={shuffleCards} className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                <Shuffle size={13} /> Shuffle
              </button>
              <button onClick={next} disabled={current === filteredCards.length - 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 shrink-0 flex gap-2">
            <button onClick={() => { setMode('idle'); setCards([]) }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 py-2.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
              <Layers size={13} /> New set
            </button>
            <button onClick={restart}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 py-2.5 text-xs font-semibold text-white transition">
              <RotateCcw size={13} /> Restart
            </button>
          </div>
        </>
      )}

      {/* Results */}
      {mode === 'results' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/30">
              <span className="text-3xl">{known.size === filteredCards.length ? '🎉' : known.size > filteredCards.length / 2 ? '👍' : '📚'}</span>
            </div>
            <h3 className="text-xl font-bold">Session Complete!</h3>
            <p className="mt-2 text-sm text-zinc-500">You went through all {filteredCards.length} cards</p>
          </div>

          <div className="w-full grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{known.size}</p>
              <p className="mt-1 text-xs text-green-600 font-medium">Got it ✓</p>
            </div>
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4 text-center">
              <p className="text-3xl font-bold text-red-500">{unknown.size}</p>
              <p className="mt-1 text-xs text-red-500 font-medium">Still learning ×</p>
            </div>
          </div>

          {/* Score bar */}
          <div className="w-full">
            <div className="flex justify-between text-xs text-zinc-500 mb-2">
              <span>Score</span>
              <span className="font-semibold">{Math.round((known.size / filteredCards.length) * 100)}%</span>
            </div>
            <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-3 rounded-full bg-green-500 transition-all duration-700"
                style={{ width: `${Math.round((known.size / filteredCards.length) * 100)}%` }} />
            </div>
          </div>

          {unknown.size > 0 && (
            <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 text-left">
              <p className="text-xs font-semibold text-zinc-500 mb-2">Cards to review again:</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {Array.from(unknown).map(idx => (
                  <p key={idx} className="text-xs text-zinc-600 dark:text-zinc-400">• {filteredCards[idx]?.front}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button onClick={() => { setMode('idle'); setCards([]) }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 py-3 text-sm text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
              <Layers size={15} /> New set
            </button>
            <button onClick={restart}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-sm font-semibold text-white transition">
              <RotateCcw size={15} /> Try again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
