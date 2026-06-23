'use client'

import { useEffect, useState } from 'react'
import { Download, X, Smartphone, Share } from 'lucide-react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Register service worker (required for Android install prompt)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }

    // Already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
    if (isStandalone) return

    // Dismissed recently (14 days)
    const lastDismissed = localStorage.getItem('clearmind_install_dismissed')
    if (lastDismissed && Date.now() - Number(lastDismissed) < 14 * 24 * 60 * 60 * 1000) return

    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !('MSStream' in window)

    if (ios) {
      // iOS Safari — show instructions after 4s
      setTimeout(() => { setIsIos(true); setShow(true) }, 4000)
      return
    }

    // Android/Chrome — capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('clearmind_install_dismissed', String(Date.now()))
    setDismissed(true)
    setShow(false)
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') { setShow(false); setDeferredPrompt(null) }
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-[calc(var(--mobile-nav-offset)+0.75rem)] inset-x-3 z-30 md:hidden">
      <div className="flex items-start gap-3 rounded-2xl p-4 shadow-2xl"
        style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Smartphone size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install ClearMind</p>
          {isIos ? (
            <p className="mt-0.5 text-xs text-zinc-500">
              Tap <Share size={11} className="inline" /> then <span className="font-medium">"Add to Home Screen"</span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-zinc-500">Works offline · Faster launch · Feels native</p>
          )}
          {!isIos && (
            <button onClick={install}
              className="mt-2.5 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Download size={13} /> Install app
            </button>
          )}
        </div>
        <button onClick={dismiss} className="shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
