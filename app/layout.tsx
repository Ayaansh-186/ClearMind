import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarity-delta-two.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Clarity — Self-Organizing Notes',
    template: '%s · Clarity',
  },
  description: 'Clarity is a self-organizing notes app for messy thoughts. Capture ideas quickly and let AI sort, format, and cluster them automatically.',
  keywords: ['notes app', 'AI notes', 'self-organizing notes', 'note taking', 'productivity', 'second brain', 'idea capture'],
  authors: [{ name: 'Clarity' }],
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Clarity',
    title: 'Clarity — Self-Organizing Notes',
    description: 'Capture messy thoughts and let AI sort, format, and cluster them automatically.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clarity — Self-Organizing Notes',
    description: 'Capture messy thoughts and let AI sort, format, and cluster them automatically.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Prevent dark mode flash on load */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (theme === 'dark' || (!theme && prefersDark)) {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="min-h-full bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">{children}</body>
    </html>
  )
}
