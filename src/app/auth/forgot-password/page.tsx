'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

// Icon Components
const MailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
  </svg>
)

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [touchedEmail, setTouchedEmail] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState(false)

  // Check registration status
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const res = await fetch('/api/settings?key=registration_enabled')
        const data = await res.json()
        setRegistrationEnabled(data.value?.enabled === true)
      } catch (error) {
        console.error('Error checking registration status:', error)
        setRegistrationEnabled(false)
      }
    }
    checkRegistration()
  }, [])

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    if (!validateEmail(email)) {
      setError('Düzgün email ünvanı daxil edin')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
      } else {
        setError(data.error || 'Xəta baş verdi')
      }
    } catch (err) {
      console.error('Password reset error:', err)
      setError('Şəbəkə xətası baş verdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-samsung-gray-50 via-samsung-blue/5 to-samsung-cyan/10 relative overflow-hidden">
      {/* Samsung Design Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-samsung-blue/10 to-samsung-cyan/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] bg-gradient-to-tr from-samsung-cyan/10 to-samsung-teal/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-samsung-purple/15 to-samsung-blue/15 rounded-full blur-2xl animate-pulse-gentle"></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-samsung-blue/30 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-samsung-cyan/30 rounded-full animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-32 left-1/3 w-5 h-5 bg-samsung-teal/30 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-20">
        <nav className="glass-card backdrop-blur-xl border-0 shadow-samsung-card bg-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center p-0">
              <div className="flex items-center space-x-4">
                <Logo size="md" uppercase showText />
              </div>
              <div className="flex items-center gap-3">
                <Link href="/" className="hidden sm:inline-flex items-center px-5 py-2 rounded-xl samsung-body text-gray-700 hover:text-samsung-blue transition">Ana Səhifə</Link>
                <Link href="/auth/signin" className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-samsung-blue hover:bg-samsung-blue-dark text-white samsung-body shadow-samsung-card hover:shadow-lg transition">
                  Daxil ol
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-84px)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full space-y-10 mt-4">
          {/* Enhanced Header */}
          <div className="text-center animate-fade-in-up">
            <h2 className="text-5xl samsung-heading text-gray-900 mb-4">
              Şifrəni Yeniləyin
            </h2>
            <p className="samsung-body text-gray-700 text-lg">
              Email ünvanınızı daxil edin və şifrə yeniləmə linki göndərək
            </p>
            <p className="mt-6 samsung-body text-gray-600">
              Şifrənizi xatırladınız?{' '}
              <Link href="/auth/signin" className="font-semibold text-samsung-blue hover:text-samsung-blue-dark transition-colors hover:underline">
                Daxil olun
              </Link>
            </p>
          </div>
          
          {/* Enhanced Form */}
          <div className="glass-card p-10 animate-fade-in-up border border-white/25 shadow-samsung-card hover:shadow-2xl transition-all duration-500" style={{ animationDelay: '0.2s' }}>
            <form className="space-y-8" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl animate-fade-in-scale shadow-samsung-card">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="samsung-body font-semibold">{error}</span>
                  </div>
                </div>
              )}

              {message && (
                <div className="bg-green-50 border-2 border-green-200 text-green-700 px-6 py-4 rounded-2xl animate-fade-in-scale shadow-samsung-card">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="samsung-body font-semibold">{message}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {/* Enhanced Email Field */}
                <div>
                  <label htmlFor="email" className="block samsung-body text-sm font-semibold text-gray-900 mb-2">
                    Email Ünvanı
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-samsung-blue z-10">
                      <MailIcon />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setTouchedEmail(true)
                      }}
                      className={`w-full pl-14 pr-4 py-4 samsung-body text-gray-900 border rounded-xl transition-all duration-300 shadow-sm focus:shadow-samsung-card placeholder-gray-400 ${
                        touchedEmail && !validateEmail(email) && email
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : 'border-gray-300 focus:border-samsung-blue bg-white hover:bg-gray-50'
                      } focus:outline-none focus:ring-2 focus:ring-samsung-blue/20`}
                      placeholder="Email ünvanınızı daxil edin"
                    />
                  </div>
                  {touchedEmail && !validateEmail(email) && email && (
                    <p className="mt-3 text-red-600 animate-fade-in-up samsung-body text-sm font-semibold">Düzgün email ünvanı daxil edin</p>
                  )}
                </div>
              </div>

              {/* Enhanced Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-samsung-blue hover:bg-samsung-blue-dark text-white py-4 rounded-xl samsung-body text-lg font-semibold shadow-samsung-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent mr-3"></div>
                      <span>Göndərilir...</span>
                    </div>
                  ) : (
                    <>
                      <span>Yeniləmə Linki Göndər</span>
                      <svg className="w-6 h-6 ml-3 inline transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Back to Sign In Link */}
              <div className="text-center">
                <Link href="/auth/signin" className="samsung-body text-samsung-blue hover:text-samsung-blue-dark font-semibold transition-colors hover:underline inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Daxil olma səhifəsinə qayıt
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}