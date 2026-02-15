import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/components/ui/NotificationSystem'
import { ConfirmDialogProvider } from '@/components/ui/ConfirmDialog'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import ToastProvider from '@/components/ToastProvider'
import { OfflineIndicator, PWAUpdateBanner } from '@/components/PWAManager'
import PerformanceTracker from '@/components/PerformanceTracker'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://suni-intellekt.com'),
  title: {
    default: 'Süni İntellekt - AI Praktiki Kurs | Copilot, MCP, Pinokio',
    template: '%s | Süni İntellekt'
  },
  description: 'Azərbaycanda ən yaxşı Süni İntellekt kursu. GitHub Copilot, MCP Protocol, Pinokio, Audio AI, Video AI və daha çoxunu öyrənin. 8 həftə, 100% praktiki, real layihələr.',
  keywords: ['süni intellekt kursu', 'AI kurs Azərbaycan', 'GitHub Copilot', 'MCP Protocol', 'Pinokio AI', 'Audio AI', 'Video AI', 'praktiki AI kursu', 'Bakı AI kurs'],
  authors: [{ name: 'Ali Hasanov' }],
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
    url: 'https://suni-intellekt.com/',
    title: 'Süni İntellekt - AI Praktiki Kurs',
    description: 'Azərbaycanda ən yaxşı Süni İntellekt kursu. 8 həftə, 100% praktiki, real layihələr.',
    siteName: 'Süni İntellekt',
    images: [{
      url: '/logo.png',
      width: 1200,
      height: 630,
      alt: 'Süni İntellekt Logo',
    }],
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Süni İntellekt',
  },
  alternates: {
    canonical: '/',
  },
}

// Structured Data for Organization
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Süni İntellekt',
  alternateName: 'AI Praktiki Kurs',
  url: 'https://suni-intellekt.com',
  logo: 'https://suni-intellekt.com/logo.png',
  description: 'Azərbaycanda ən yaxşı Süni İntellekt praktiki kursu',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'AZ',
    addressLocality: 'Bakı'
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+994553858220',
    contactType: 'customer support',
    availableLanguage: ['Azerbaijani', 'Russian', 'English']
  },
  sameAs: [
    'https://www.linkedin.com/in/ali-hasanov/',
    'https://instagram.com/ali.hasan0v'
  ]
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Süni İntellekt',
    alternateName: 'AI Praktiki Kurs',
    url: 'https://suni-intellekt.com',
    logo: 'https://suni-intellekt.com/logo.png',
    description: 'Azərbaycanda ən yaxşı Süni İntellekt praktiki kursu',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AZ',
      addressLocality: 'Bakı'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+994553858220',
      contactType: 'customer support',
      availableLanguage: ['Azerbaijani', 'Russian', 'English']
    },
    sameAs: [
      'https://www.linkedin.com/in/ali-hasanov/',
      'https://instagram.com/ali.hasan0v'
    ]
  }

  return (
    <html lang="az">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-817YD3KLTK"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-817YD3KLTK');
          `}
        </Script>

        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//api.supabase.co" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        
        {/* Preconnect for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Structured Data */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema)
          }}
        />
        
        <ErrorBoundary resetOnPropsChange={true}>
          <AuthProvider>
            <ToastProvider>
              <NotificationProvider>
                <ConfirmDialogProvider>
                  {children}
                  <OfflineIndicator />
                  <PWAUpdateBanner />
                  <PerformanceTracker />
                </ConfirmDialogProvider>
              </NotificationProvider>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}