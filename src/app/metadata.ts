import { Metadata } from 'next'

export const defaultMetadata: Metadata = {
  metadataBase: new URL('https://suni-intellekt.com'),
  title: {
    default: 'Süni İntellekt - AI Praktiki Kurs | Copilot, MCP, Pinokio',
    template: '%s | Süni İntellekt'
  },
  description: 'Azərbaycanda ən yaxşı Süni İntellekt kursu. GitHub Copilot, MCP Protocol, Pinokio, Audio AI, Video AI və daha çoxunu öyrənin. 8 həftə, 100% praktiki, real layihələr.',
  keywords: [
    'süni intellekt kursu',
    'AI kurs Azərbaycan',
    'GitHub Copilot öyrənmək',
    'MCP Protocol',
    'Pinokio AI',
    'Audio AI',
    'Video AI',
    'praktiki AI kursu',
    'Azərbaycanca AI kursu',
    'süni intellekt təlimi',
    'AI alətləri',
    'maşın öyrənməsi',
    'deep learning kurs',
    'Bakı AI kurs',
    'onlayn AI kursu'
  ],
  authors: [{ name: 'Ali Hasanov', url: 'https://www.linkedin.com/in/ali-hasanov/' }],
  creator: 'Ali Hasanov',
  publisher: 'Süni İntellekt',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'az_AZ',
    url: 'https://suni-intellekt.com',
    siteName: 'Süni İntellekt',
    title: 'Süni İntellekt - AI Praktiki Kurs',
    description: 'Azərbaycanda ən yaxşı Süni İntellekt kursu. 8 həftə, 100% praktiki, real layihələr. GitHub Copilot, MCP, Pinokio və daha çox.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Süni İntellekt - AI Praktiki Kurs'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Süni İntellekt - AI Praktiki Kurs',
    description: 'Azərbaycanda ən yaxşı Süni İntellekt kursu. 8 həftə, 100% praktiki, real layihələr.',
    creator: '@ali.hasan0v',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://suni-intellekt.com',
  },
  verification: {
    google: 'google-site-verification-code', // Add your actual verification code
  },
  category: 'education',
}
