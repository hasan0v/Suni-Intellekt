'use client'

import { Inter } from 'next/font/google'
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
  return (
    <html lang="az">
      <head>
        {/* Primary Meta Tags */}
        <title>Süni İntellekt - AI Praktiki Kurs | Copilot, MCP, Pinokio</title>
        <meta name="title" content="Süni İntellekt - AI Praktiki Kurs | Copilot, MCP, Pinokio" />
        <meta name="description" content="Azərbaycanda ən yaxşı Süni İntellekt kursu. GitHub Copilot, MCP Protocol, Pinokio, Audio AI, Video AI və daha çoxunu öyrənin. 8 həftə, 100% praktiki, real layihələr." />
        <meta name="keywords" content="süni intellekt kursu, AI kurs Azərbaycan, GitHub Copilot, MCP Protocol, Pinokio AI, Audio AI, Video AI, praktiki AI kursu, Bakı AI kurs" />
        <meta name="author" content="Ali Hasanov" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="Azerbaijani" />
        <meta name="revisit-after" content="7 days" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://suni-intellekt.com/" />
        <meta property="og:title" content="Süni İntellekt - AI Praktiki Kurs" />
        <meta property="og:description" content="Azərbaycanda ən yaxşı Süni İntellekt kursu. 8 həftə, 100% praktiki, real layihələr." />
        <meta property="og:image" content="https://suni-intellekt.com/logo.png" />
        <meta property="og:locale" content="az_AZ" />
        <meta property="og:site_name" content="Süni İntellekt" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://suni-intellekt.com/" />
        <meta property="twitter:title" content="Süni İntellekt - AI Praktiki Kurs" />
        <meta property="twitter:description" content="Azərbaycanda ən yaxşı Süni İntellekt kursu. 8 həftə, 100% praktiki, real layihələr." />
        <meta property="twitter:image" content="https://suni-intellekt.com/logo.png" />
        <meta property="twitter:creator" content="@ali.hasan0v" />

        {/* Canonical */}
        <link rel="canonical" href="https://suni-intellekt.com/" />
        
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Viewport and device optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no, email=no, address=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Süni İntellekt" />
        <meta name="theme-color" content="#8B5CF6" />
        
        {/* Icons */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" type="image/x-icon" />
        <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//api.supabase.co" />
        
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