'use client'

import { useState } from 'react'
import { Bell, BellOff, Check, Loader2, X } from 'lucide-react'

type Props = {
  noteId: string
  userId: string
  existingReminder?: { id: string; remind_at: string; label?: string } | null
  onReminderSet: (reminder: { id: string; remind_at: string; label?: string } | null) => void
  onReminderChanged?: () => void
}

const QUICK_OPTIONS = [
  { label: 'In 1 hour', hours: 1 },
  { label: 'Tomorrow', hours: 24 },
  { label: 'In 3 days', hours: 72 },
  { label: 'Next week', hours: 168 },
]

export function ReminderButton({ noteId, userId, existingReminder, onReminderSet, onReminderChanged }: Props) {
  const [open, setOpen] = useState(false)
  const [customDate, setCustomDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  const hasReminder = !!existingReminder

  async function setReminder(remind_at: Date) {
    setSaving(true)
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, note_id: noteId, remind_at: remind_at.toISOString() }),
      })
      if (res.ok) {
        const data = await res.json()
        onReminderSet({ id: data.id, remind_at: data.remind_at })
        onReminderChanged?.()
        setOpen(false)
        setCustomDate('')
      }
    } finally {
      setSaving(false)
    }
  }

  async function dismissReminder() {
    if (!existingReminder) return
    setDismissing(true)
    try {
      await fetch(`/api/reminders?id=${existingReminder.id}`, { method: 'DELETE' })
      onReminderSet(null)
      onReminderChanged?.()
      setOpen(false)
    } finally {
      setDismissing(false)
    }
  }

  function handleQuick(hours: number) {
    const t = new Date(Date.now() + hours * 60 * 60 * 1000)
    setReminder(t)
  }

  function handleCustom() {
    if (!customDate) return
    setReminder(new Date(customDate))
  }

  const formattedReminder = existingReminder
    ? new Date(existingReminder.remind_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
          hasReminder
            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20'
            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
        }`}
        aria-label={hasReminder ? `Reminder set: ${formattedReminder}` : 'Set reminder'}
        title={hasReminder ? `Reminder: ${formattedReminder}` : 'Set reminder'}
      >
        <Bell size={16} fill={hasReminder ? 'currentColor' : 'none'} />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Popover */}
          <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {hasReminder ? 'Update reminder' : 'Set reminder'}
              </span>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X size={14} />
              </button>
            </div>

            {hasReminder && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-2 dark:bg-amber-950/20">
                <Bell size={12} className="text-amber-500 shrink-0" fill="currentColor" />
                <span className="text-xs text-amber-700 dark:text-amber-400">{formattedReminder}</span>
                <button
                  onClick={dismissReminder}
                  disabled={dismissing}
                  className="ml-auto text-amber-500 hover:text-amber-700 transition"
                  title="Clear reminder"
                >
                  {dismissing ? <Loader2 size={12} className="animate-spin" /> : <BellOff size={12} />}
                </button>
              </div>
            )}

            <div className="space-y-1">
              {QUICK_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => handleQuick(opt.hours)}
                  disabled={saving}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} className="opacity-0" />}
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
              <p className="mb-1.5 text-xs text-zinc-400">Pick a date & time</p>
              <div className="flex gap-1">
                <input
                  type="datetime-local"
                  value={customDate}
                  onChange={e => setCustomDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="flex-1 rounded-md border border-zinc-200 bg-transparent px-2 py-1.5 text-xs outline-none focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-500"
                />
                <button
                  onClick={handleCustom}
                  disabled={!customDate || saving}
                  className="rounded-md bg-zinc-950 px-2.5 py-1.5 text-xs text-white disabled:opacity-40 hover:bg-zinc-800 transition dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : 'Set'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
