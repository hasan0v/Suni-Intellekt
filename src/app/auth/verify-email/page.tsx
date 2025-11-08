'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import ClientOnly from '@/components/ClientOnly'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Təsdiq tokeni tapılmadı')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message)
          // Redirect to signin after 3 seconds
          setTimeout(() => router.push('/auth/signin'), 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Təsdiq zamanı xəta baş verdi')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('Şəbəkə xətası baş verdi')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-samsung-gray-50 via-samsung-blue/5 to-samsung-cyan/10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-samsung-blue/10 to-samsung-cyan/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] bg-gradient-to-tr from-samsung-cyan/10 to-samsung-teal/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-20">
        <nav className="glass-card backdrop-blur-xl border-0 shadow-samsung-card bg-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center p-0">
              <div className="flex items-center space-x-4">
                <ClientOnly>
                  <Logo size="md" uppercase showText />
                </ClientOnly>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-84px)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="glass-card p-10 text-center animate-fade-in-up border border-white/25 shadow-samsung-card">
            {status === 'verifying' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-samsung-blue border-t-transparent"></div>
                </div>
                <h2 className="text-2xl samsung-heading text-gray-900 mb-4">
                  Email Təsdiqlənir...
                </h2>
                <p className="samsung-body text-gray-600">
                  Zəhmət olmasa gözləyin
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl samsung-heading text-gray-900 mb-4">
                  Uğurla Təsdiqləndi!
                </h2>
                <p className="samsung-body text-gray-600 mb-6">
                  {message}
                </p>
                <p className="samsung-body text-sm text-gray-500">
                  Daxil olma səhifəsinə yönləndirilirsiniz...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl samsung-heading text-gray-900 mb-4">
                  Təsdiq Uğursuz Oldu
                </h2>
                <p className="samsung-body text-red-600 mb-8">
                  {message}
                </p>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-samsung-blue hover:bg-samsung-blue-dark text-white samsung-body font-semibold shadow-samsung-card hover:shadow-lg transition"
                >
                  Yenidən Cəhd Et
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-samsung-gray-50 via-samsung-blue/5 to-samsung-cyan/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-samsung-blue border-t-transparent"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}