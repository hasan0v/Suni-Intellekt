'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import ClientOnly from '@/components/ClientOnly'

// Icon Components
const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
)

interface PasswordValidation {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  overall: boolean
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    overall: false
  })

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('Təsdiq tokeni tapılmadı')
    } else {
      setToken(tokenParam)
    }
  }, [searchParams])

  const validatePassword = (password: string): PasswordValidation => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      overall: false
    }
    validation.overall = validation.length && validation.uppercase && validation.lowercase && validation.number
    return validation
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    const validation = validatePassword(value)
    setPasswordValidation(validation)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!token) {
      setError('Təsdiq tokeni tapılmadı')
      setLoading(false)
      return
    }

    if (!passwordValidation.overall) {
      setError('Şifrə bütün tələbləri ödəməlidir')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Şifrələr uyğun gəlmir')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/auth/signin'), 3000)
      } else {
        setError(data.error || 'Şifrə yenilənərkən xəta baş verdi')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setError('Şəbəkə xətası baş verdi')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-samsung-gray-50 via-samsung-blue/5 to-samsung-cyan/10 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-samsung-blue/10 to-samsung-cyan/10 rounded-full blur-3xl animate-float"></div>
        </div>
        <header className="relative z-20">
          <nav className="glass-card backdrop-blur-xl border-0 shadow-samsung-card bg-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center p-0">
                <Logo size="md" uppercase showText />
              </div>
            </div>
          </nav>
        </header>
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-84px)] px-4 py-12">
          <div className="max-w-md w-full text-center animate-fade-in-up">
            <div className="glass-card bg-green-50 border-2 border-green-200 text-green-800 px-8 py-8 rounded-3xl shadow-samsung-card">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
              </div>
              <h3 className="samsung-heading text-xl mb-3">Şifrə Uğurla Yeniləndi!</h3>
              <p className="samsung-body text-sm">Daxil olma səhifəsinə yönləndirilirsiniz...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
        <div className="max-w-lg w-full space-y-10 mt-4">
          {/* Header */}
          <div className="text-center animate-fade-in-up">
            <h2 className="text-5xl samsung-heading text-gray-900 mb-4">
              Yeni Şifrə Yaradın
            </h2>
            <p className="samsung-body text-gray-700 text-lg">
              Hesabınız üçün güclü yeni şifrə təyin edin
            </p>
          </div>
          
          {/* Form */}
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
              
              <div className="space-y-6">
                {/* New Password Field */}
                <div>
                  <label htmlFor="password" className="block samsung-body text-sm font-semibold text-gray-900 mb-2">
                    Yeni Şifrə
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-samsung-blue z-10">
                      <LockIcon />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="w-full pl-14 pr-14 py-4 samsung-body text-gray-900 border rounded-xl transition-all duration-300 shadow-sm focus:shadow-samsung-card placeholder-gray-400 border-gray-300 focus:border-samsung-blue bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-samsung-blue/20"
                      placeholder="Güclü şifrə yaradın"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-samsung-blue z-10 transition-all duration-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  
                  {/* Password Requirements */}
                  {password && (
                    <div className="mt-4 p-6 glass-card rounded-2xl animate-fade-in-up border border-white/30">
                      <p className="text-lg font-bold text-gray-700 mb-4">Şifrə Tələbləri:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className={`flex items-center text-base transition-colors duration-300 ${passwordValidation.length ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="mr-3 text-lg">{passwordValidation.length ? '✅' : '❌'}</span>
                          <span className="font-semibold">Ən azı 8 simvol</span>
                        </div>
                        <div className={`flex items-center text-base transition-colors duration-300 ${passwordValidation.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="mr-3 text-lg">{passwordValidation.uppercase ? '✅' : '❌'}</span>
                          <span className="font-semibold">Bir böyük hərf</span>
                        </div>
                        <div className={`flex items-center text-base transition-colors duration-300 ${passwordValidation.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="mr-3 text-lg">{passwordValidation.lowercase ? '✅' : '❌'}</span>
                          <span className="font-semibold">Bir kiçik hərf</span>
                        </div>
                        <div className={`flex items-center text-base transition-colors duration-300 ${passwordValidation.number ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="mr-3 text-lg">{passwordValidation.number ? '✅' : '❌'}</span>
                          <span className="font-semibold">Bir rəqəm</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block samsung-body text-sm font-semibold text-gray-900 mb-2">
                    Şifrəni Təsdiqlə
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-samsung-blue z-10">
                      <LockIcon />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-14 pr-14 py-4 samsung-body text-gray-900 border rounded-xl transition-all duration-300 shadow-sm focus:shadow-samsung-card placeholder-gray-400 border-gray-300 focus:border-samsung-blue bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-samsung-blue/20"
                      placeholder="Şifrəni təkrar daxil edin"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-samsung-blue z-10 transition-all duration-300"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-3 text-red-600 animate-fade-in-up samsung-body text-sm font-semibold">Şifrələr uyğun gəlmir</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !passwordValidation.overall || password !== confirmPassword}
                  className="w-full bg-gradient-to-r from-samsung-blue to-samsung-blue-dark hover:from-samsung-blue-dark hover:to-samsung-blue text-white py-4 rounded-xl samsung-body text-lg font-semibold shadow-samsung-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale group"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent mr-3"></div>
                      <span>Yenilənir...</span>
                    </div>
                  ) : (
                    <>
                      <span>Şifrəni Yenilə</span>
                      <svg className="w-6 h-6 ml-3 inline transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Back Link */}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-samsung-gray-50 via-samsung-blue/5 to-samsung-cyan/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-samsung-blue border-t-transparent"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}