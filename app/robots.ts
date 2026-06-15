import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarity-delta-two.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/shared/'],
        disallow: ['/api/', '/analyze', '/chapter-notes'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
