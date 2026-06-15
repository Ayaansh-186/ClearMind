import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Sign in to Clarity',
  description: 'Sign in or create your free Clarity account — the self-organizing notes app that turns your messy thoughts into clear, structured notes automatically.',
  alternates: {
    canonical: '/login',
  },
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
