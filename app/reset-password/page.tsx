'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Lock } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const [ready, setReady] = useState(false)

  const supabase = createBrowserSupabase()

  useEffect(() => {
    // Supabase puts the session tokens in the URL hash on redirect
    // onAuthStateChange with SIGNED_IN confirms the session is active
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setMessage({ text: 'Passwords do not match.', type: 'error' })
      return
    }
    if (password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters.', type: 'error' })
      return
    }
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({ text: 'Password updated successfully! Redirecting...', type: 'success' })
      setTimeout(() => router.replace('/'), 1500)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Clarity</h1>
            <p className="text-sm text-zinc-500">Set a new password</p>
          </div>
        </div>

        {!ready ? (
          <p className="text-center text-sm text-zinc-500">Verifying reset link...</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium" htmlFor="password">New password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
                required
                autoComplete="new-password"
              />
            </div>

            {message && (
              <p className={`rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'}`}>
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-950"
            >
              <Lock size={15} /> {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
