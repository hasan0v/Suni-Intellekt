import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/admin/',
          '/auth/reset-password',
          '/test-*',
        ],
      },
    ],
    sitemap: 'https://suni-intellekt.com/sitemap.xml',
  }
}
