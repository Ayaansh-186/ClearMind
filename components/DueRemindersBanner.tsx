'use client'

import { Bell, X } from 'lucide-react'

type Reminder = {
  id: string
  remind_at: string
  label?: string | null
  note_id: string
  notes: { id: string; title: string | null; raw_content: string } | null
}

type Props = {
  reminders: Reminder[]
  onOpen: (noteId: string, reminderId: string) => void
  onDismiss: (reminderId: string) => void
}

export function DueRemindersBanner({ reminders, onOpen, onDismiss }: Props) {
  if (reminders.length === 0) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
      <div className="mx-auto max-w-5xl px-5 py-2">
        <div className="flex items-start gap-2">
          <Bell size={15} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" fill="currentColor" />
          <div className="min-w-0 flex-1 space-y-1">
            {reminders.map(r => (
              <div key={r.id} className="flex items-center gap-2">
                <button
                  onClick={() => onOpen(r.note_id, r.id)}
                  className="min-w-0 flex-1 truncate text-left text-xs font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-300"
                >
                  {r.notes?.title ?? 'Untitled note'}
                  <span className="ml-1.5 font-normal text-amber-600 dark:text-amber-500">
                    — {new Date(r.remind_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </button>
                <button
                  onClick={() => onDismiss(r.id)}
                  className="shrink-0 rounded p-0.5 text-amber-500 hover:text-amber-700 transition"
                  aria-label="Dismiss reminder"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
