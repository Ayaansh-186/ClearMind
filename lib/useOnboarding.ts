'use client'

import { useCallback, useEffect, useState } from 'react'

const ONBOARDING_KEY = 'clarity_onboarding_done'

/**
 * Returns whether onboarding should be shown, and a function to mark it complete.
 *
 * Logic:
 * - First time a user signs in (no localStorage flag), show the modal.
 * - Once dismissed or completed, set the flag so it never shows again.
 * - If the user already has notes, skip onboarding (they're not new).
 */
export function useOnboarding(noteCount: number | null) {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // Wait until we know the note count
    if (noteCount === null) return

    const done = localStorage.getItem(ONBOARDING_KEY)
    if (done) return

    // Only show if they have 0 or 1 note (truly new user)
    if (noteCount <= 1) {
      setShouldShow(true)
    } else {
      // They have notes — they're not new, mark as done silently
      localStorage.setItem(ONBOARDING_KEY, '1')
    }
  }, [noteCount])

  const complete = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShouldShow(false)
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setShouldShow(false)
  }, [])

  return { shouldShow, complete, dismiss }
}
