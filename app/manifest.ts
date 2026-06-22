import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Clarity — Self-Organizing Notes',
    short_name: 'Clarity',
    description: 'Capture messy thoughts and let AI sort, format, and cluster them automatically.',
    start_url: '/login',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#09090b',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [
      {
        src: '/og-image.png',
        sizes: '1200x630',
        type: 'image/png',
        // @ts-expect-error: form_factor not yet in Next.js MetadataRoute types but valid manifest field
        form_factor: 'wide',
      },
    ],
  }
}
