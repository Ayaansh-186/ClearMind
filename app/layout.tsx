import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarity-delta-two.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ClearMind — Self-Organizing Notes',
    template: '%s · ClearMind',
  },
  description: 'Drop any thought. ClearMind AI sorts, formats, and clusters it automatically. Free to use.',
  keywords: ['notes app', 'AI notes', 'self-organizing notes', 'note taking', 'productivity', 'second brain', 'idea capture'],
  authors: [{ name: 'ClearMind' }],
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'ClearMind',
    title: 'ClearMind — Self-Organizing Notes',
    description: 'Capture messy thoughts and let AI sort, format, and cluster them automatically.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClearMind — Self-Organizing Notes',
    description: 'Capture messy thoughts and let AI sort, format, and cluster them automatically.',
  },
  verification: {
    google: 'Qo96PyK2oa9EqZfTJwp0TFAtwVQ_j45WQC96H4_KB2w',
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
        {/* Anti-flash: read 'clearmind_theme' — must match the key Sidebar.tsx writes */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('clearmind_theme');
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
