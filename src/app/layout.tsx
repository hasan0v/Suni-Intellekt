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

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="az">
      <head>
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Viewport and device optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no, email=no, address=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Süni İntellekt" />
        
        {/* Icons */}
        <link rel="icon" href="/favicon.ico" sizes="32x32" type="image/x-icon" />
        <link rel="icon" href="/favicon.png" sizes="32x32" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//api.supabase.co" />
      </head>
      <body className={`${inter.className} antialiased`}>
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