'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useRouter } from 'next/navigation'

interface ValidationState {
  isValid: boolean
  message: string
}

interface PasswordValidation {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  overall: boolean
}

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [emailValidation, setEmailValidation] = useState<ValidationState>({ isValid: true, message: '' })
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    overall: false
  })
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const router = useRouter()

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Password validation function
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

  // Handle email change with validation
  const handleEmailChange = (value: string) => {
    setEmail(value)
    setTouchedFields(prev => new Set([...prev, 'email']))
    
    if (!value) {
      setEmailValidation({ isValid: true, message: '' })
      return
    }
    
    if (!validateEmail(value)) {
      setEmailValidation({ isValid: false, message: 'Please enter a valid email address' })
      return
    }
    
    setEmailValidation({ isValid: true, message: 'Email format is valid' })
  }

  // Handle password change with validation
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setTouchedFields(prev => new Set([...prev, 'password']))
    const validation = validatePassword(value)
    setPasswordValidation(validation)
  }

  // Handle full name change
  const handleFullNameChange = (value: string) => {
    setFullName(value)
    setTouchedFields(prev => new Set([...prev, 'fullName']))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Client-side validation
    if (!fullName.trim()) {
      setError('Tam ad tələb olunur')
      setLoading(false)
      return
    }

    if (!validateEmail(email)) {
      setError('Düzgün email ünvanı daxil edin')
      setLoading(false)
      return
    }

    if (!passwordValidation.overall) {
      setError('Şifrə bütün tələbləri ödəməlidir')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Qeydiyyat zamanı xəta baş verdi')
        return
      }
      
      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)
    } catch (error) {
      console.error('Signup error:', error)
      setError('Şəbəkə xətası baş verdi')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-samsung-gray-50 via-samsung-blue/5 to-samsung-cyan/10 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-samsung-blue/10 to-samsung-cyan/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] bg-gradient-to-tr from-samsung-cyan/10 to-samsung-teal/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-samsung-purple/15 to-samsung-blue/15 rounded-full blur-2xl animate-pulse-gentle"></div>
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
                  <Link href="/auth/signin" className="hidden sm:inline-flex items-center px-5 py-2 rounded-xl samsung-body text-gray-700 hover:text-samsung-blue transition">Daxil ol</Link>
                  <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-samsung-blue hover:bg-samsung-blue-dark text-white samsung-body shadow-samsung-card hover:shadow-lg transition">
                    <span>⚡</span> Qeydiyyat
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        </header>

        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-84px)] px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center animate-fade-in-up">
            <div className="glass-card bg-green-50 border-2 border-green-200 text-green-800 px-8 py-8 rounded-3xl backdrop-blur-md shadow-samsung-card">
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
              </div>
              <h3 className="samsung-heading text-xl mb-3">Qeydiyyat Uğurlu Oldu!</h3>
              <p className="samsung-body text-sm">Email ünvanınızı yoxlayın və hesabınızı təsdiqləyin. Daha sonra daxil ola bilərsiniz.</p>
            </div>
          </div>
        </div>
      </div>
    )
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
      {/* Header aligned with main page */}
      <header className="relative z-20">
        <nav className="glass-card backdrop-blur-xl border-0 shadow-samsung-card bg-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center p-0">
              <div className="flex items-center space-x-4">
                <Logo size="md" uppercase showText />
              </div>
              <div className="flex items-center gap-3">
                <Link href="/auth/signin" className="hidden sm:inline-flex items-center px-5 py-2 rounded-xl samsung-body text-gray-700 hover:text-samsung-blue transition">Daxil ol</Link>
                <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-samsung-blue hover:bg-samsung-blue-dark text-white samsung-body shadow-samsung-card hover:shadow-lg transition">
                  <span>⚡</span> Qeydiyyat
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
              İnqilaba Qoşul
            </h2>
            <p className="samsung-body text-gray-700 text-xl mb-6">
              Hesab yaradın və AI dəstəklı öyrənmə səyahətinə başlayın
            </p>
            <p className="samsung-body text-gray-600">
              Artıq hesabınız var?{' '}
              <Link href="/auth/signin" className="font-semibold text-samsung-blue hover:text-samsung-blue-dark transition-colors hover:underline">
                Buradan daxil olun
              </Link>
            </p>
          </div>

          {/* Enhanced Form */}
          <div className="glass-card p-10 relative z-10 border border-white/25 shadow-samsung-card hover:shadow-2xl transition-all duration-500 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <form className="space-y-8" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl animate-fade-in-scale shadow-samsung-card">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-3 text-xl">⚠️</span>
                    <span className="samsung-body font-semibold">{error}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                {/* Enhanced Full Name Field */}
                <div className="form-group">
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Tam Ad
                  </label>
                  <div className="relative">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => handleFullNameChange(e.target.value)}
                      className={`w-full pl-14 pr-4 py-4 text-base text-gray-900 border rounded-xl transition-all duration-300 shadow focus:shadow-md hover:shadow-md placeholder-gray-400 ${
                        touchedFields.has('fullName') && !fullName.trim() 
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50' 
                          : 'border-gray-300 focus:border-indigo-500 bg-white/60 hover:bg-white/70'
                      } backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-indigo-200/40`}
                      placeholder="Tam adınızı daxil edin"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  {touchedFields.has('fullName') && !fullName.trim() && (
                    <p className="mt-3 text-red-600 font-semibold flex items-center animate-fade-in-up">
                      <span className="mr-2">⚠️</span>
                      Tam ad tələb olunur
                    </p>
                  )}
                </div>
                
                {/* Enhanced Email Field */}
                <div className="form-group">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Email Ünvanı
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`w-full pl-14 pr-14 py-4 text-base text-gray-900 border rounded-xl transition-all duration-300 shadow focus:shadow-md hover:shadow-md placeholder-gray-400 ${
                        touchedFields.has('email') && !emailValidation.isValid
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                          : touchedFields.has('email') && emailValidation.isValid && email
              ? 'border-green-300 focus:border-green-500 bg-green-50/50'
              : 'border-gray-300 focus:border-indigo-500 bg-white/60 hover:bg-white/70'
            } backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-indigo-200/40`}
                      placeholder="Email ünvanınızı daxil edin"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    {touchedFields.has('email') && email && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <span className={`text-2xl ${emailValidation.isValid ? 'text-green-500' : 'text-red-500'}`}>
                          {emailValidation.isValid ? '✅' : '❌'}
                        </span>
                      </div>
                    )}
                  </div>
                  {touchedFields.has('email') && emailValidation.message && (
                    <p className={`mt-3 font-semibold ${emailValidation.isValid ? 'text-green-600' : 'text-red-600'} flex items-center animate-fade-in-up`}>
                      <span className="mr-2">{emailValidation.isValid ? '✅' : '⚠️'}</span>
                      {emailValidation.message}
                    </p>
                  )}
                </div>
                
                {/* Enhanced Password Field */}
                <div className="form-group">
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                    Şifrə
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className={`w-full pl-14 pr-14 py-4 text-base text-gray-900 border rounded-xl transition-all duration-300 shadow focus:shadow-md hover:shadow-md placeholder-gray-400 ${
                        touchedFields.has('password') && !passwordValidation.overall && password
                          ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                          : touchedFields.has('password') && passwordValidation.overall
              ? 'border-green-300 focus:border-green-500 bg-green-50/50'
              : 'border-gray-300 focus:border-indigo-500 bg-white/60 hover:bg-white/70'
            } backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-indigo-200/40`}
                      placeholder="Güclü şifrə yaradın"
                    />
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform duration-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <svg className="w-5 h-5 text-samsung-blue hover:text-samsung-blue-dark transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        ) : (
                          <>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                  
                  {/* Enhanced Password Requirements */}
                  {touchedFields.has('password') && password && (
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
              </div>

              {/* Enhanced Submit Button */}
        <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !emailValidation.isValid || !passwordValidation.overall || !fullName.trim()}
          className="w-full bg-samsung-blue hover:bg-samsung-blue-dark text-white py-4 rounded-xl samsung-body text-lg font-semibold shadow-samsung-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent mr-3"></div>
                      <span>Hesabınız yaradılır...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-3 text-2xl">🚀</span>
                      <span>Hesab Yarat</span>
                    </div>
                  )}
                </button>
                {(!emailValidation.isValid || !passwordValidation.overall || !fullName.trim()) && (
          <p className="mt-4 samsung-body text-gray-600 text-center text-sm">
                    Davam etmək üçün bütün sahələri düzgün doldurun
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
