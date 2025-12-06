"use client"
import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Sparkles, ChevronRight, Brain, Cpu, Zap, Play, ArrowRight,
  Headphones, Presentation, Video, GraduationCap, Code, Menu, X, Clock
} from 'lucide-react'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

// Static Orb Component - CSS only, no JS animations
const StaticOrb: React.FC<{ color: string; size: string; position: { x: string; y: string }; className?: string }> = ({ 
  color, size, position, className = ''
}) => (
  <div
    className={`absolute ${size} rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
    style={{ 
      left: position.x, 
      top: position.y,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      willChange: 'opacity',
    }}
  />
)

// Simple fade-in animation using CSS
const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ 
  children, delay = 0, className = '' 
}) => (
  <div 
    className={`animate-fadeIn ${className}`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    {children}
  </div>
)

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  useEffect(() => setMounted(true), [])
  
  // Force dark mode on mount
  useEffect(() => {
    document.documentElement.style.backgroundColor = '#030712'
    document.documentElement.style.colorScheme = 'dark'
    document.body.style.backgroundColor = '#030712'
    document.body.style.color = '#f9fafb'
    document.documentElement.classList.add('dark')
  }, [])
  
  useEffect(() => { 
    if (!loading && user && pathname !== '/dashboard') router.replace('/dashboard') 
  }, [user, loading, router, pathname])

  // Check if registration is enabled
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

  // Reveal sign up button after delay - reduced delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSignUp(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Memoize static course modules to prevent re-renders
  const courseModules = useMemo(() => [
    { name: 'Copilot', icon: <Code className="w-6 h-6" />, color: 'from-purple-500 to-purple-600', desc: 'AI-destəkli kodlaşdırma' },
    { name: 'MCP', icon: <Cpu className="w-6 h-6" />, color: 'from-blue-500 to-blue-600', desc: 'Model Context Protocol' },
    { name: 'Pinokio', icon: <Brain className="w-6 h-6" />, color: 'from-cyan-500 to-cyan-600', desc: 'Yerli AI modelləri' },
    { name: 'Audio AI', icon: <Headphones className="w-6 h-6" />, color: 'from-green-500 to-green-600', desc: 'Səs yaratma və redaktə' },
    { name: 'Slides', icon: <Presentation className="w-6 h-6" />, color: 'from-orange-500 to-orange-600', desc: 'AI prezentasiyalar' },
    { name: 'Video AI', icon: <Video className="w-6 h-6" />, color: 'from-red-500 to-red-600', desc: 'Video istehsalı' },
    { name: 'Academic', icon: <GraduationCap className="w-6 h-6" />, color: 'from-indigo-500 to-indigo-600', desc: 'Akademik yazı' }
  ], [])

  const steps = useMemo(() => [
    { step: '01', title: 'Müraciət Edin', description: 'Onlayn formu doldurun. Ad, email və motivasiyanızı qeyd edin.' },
    { step: '02', title: 'Təsdiq Alın', description: '24 saat ərzində email vasitəsilə nəticənizi öyrənin.' },
    { step: '03', title: 'Öyrənməyə Başlayın', description: 'Kursa qoşulun və AI dünyasını kəşf etməyə başlayın.' }
  ], [])

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="text-center space-y-6">
          {/* 3D Rotating Loader */}
          <div className="relative w-16 h-16 mx-auto" style={{ perspective: '800px' }}>
            <div className="loader-inner loader-one" />
            <div className="loader-inner loader-two" />
            <div className="loader-inner loader-three" />
          </div>
          
          {/* Loading text */}
          <div className="space-y-2">
            <p className="text-lg font-medium text-white">Yüklənir...</p>
            <p className="text-sm text-gray-400">Xahiş olunur bir az gözləyin...</p>
          </div>
        </div>

        <style jsx>{`
          .loader-inner {
            position: absolute;
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            border-radius: 50%;
          }

          .loader-one {
            left: 0%;
            top: 0%;
            animation: rotate-one 1s linear infinite;
            border-bottom: 3px solid #8B5CF6;
          }

          .loader-two {
            right: 0%;
            top: 0%;
            animation: rotate-two 1s linear infinite;
            border-right: 3px solid #3B82F6;
          }

          .loader-three {
            right: 0%;
            bottom: 0%;
            animation: rotate-three 1s linear infinite;
            border-top: 3px solid #06B6D4;
          }

          @keyframes rotate-one {
            0% {
              transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg);
            }
            100% {
              transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg);
            }
          }

          @keyframes rotate-two {
            0% {
              transform: rotateX(50deg) rotateY(10deg) rotateZ(0deg);
            }
            100% {
              transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg);
            }
          }

          @keyframes rotate-three {
            0% {
              transform: rotateX(35deg) rotateY(55deg) rotateZ(0deg);
            }
            100% {
              transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #030712, #111827, #030712)', backgroundColor: '#030712', color: '#f9fafb' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-4">
            <Logo size="md" uppercase showText />
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/course-details"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200"
              >
                Kurs Haqqında
              </Link>
              <Link
                href="/auth/signin"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200"
              >
                Daxil ol
              </Link>
              {showSignUp && registrationEnabled && (
                <Link
                  href="/auth/signup"
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/25 transition-colors duration-200 animate-fadeIn"
                >
                  Qeydiyyat
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu - Simple transition */}
          {mobileMenuOpen && (
            <div className="md:hidden animate-slideDown">
              <div className="py-4 space-y-2 border-t border-white/5">
                <Link
                  href="/course-details"
                  className="block px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Kurs Haqqında
                </Link>
                <Link
                  href="/auth/signin"
                  className="block px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Daxil ol
                </Link>
                {registrationEnabled && (
                  <Link
                    href="/auth/signup"
                    className="block px-4 py-3 rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Qeydiyyat
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section - Optimized for performance */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
          {/* Static Background - No JS animations */}
          <div className="absolute inset-0">
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}
            />
            
            {/* Static Orbs - CSS only, no JS animations */}
            <StaticOrb color="#8B5CF6" size="w-96 h-96" position={{ x: '10%', y: '20%' }} />
            <StaticOrb color="#3B82F6" size="w-80 h-80" position={{ x: '70%', y: '60%' }} />
            <StaticOrb color="#06B6D4" size="w-64 h-64" position={{ x: '80%', y: '10%' }} className="hidden md:block" />
          </div>

          {/* Main Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <FadeIn className="space-y-8">
                {/* Badge - Only show when registration is enabled */}
                {registrationEnabled && (
                  <FadeIn delay={100}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 backdrop-blur-sm">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">🎓 Qeydiyyat Açıqdır</span>
                    </div>
                  </FadeIn>
                )}

                {/* Title */}
                <FadeIn delay={200}>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {registrationEnabled ? 'Süni İntellekt Dərsinə Qeydiyyat Başladı' : 'Süni İntellekt'}
                    </span>
                  </h1>
                </FadeIn>

                {/* Subtitle */}
                <FadeIn delay={300}>
                  <p className="text-xl md:text-2xl text-gray-400 font-medium">
                    Gələcəyin Texnologiyasını Bu Gün Öyrənin
                  </p>
                </FadeIn>

                {/* Description */}
                <FadeIn delay={400}>
                  <p className="text-lg text-gray-500 leading-relaxed max-w-xl">
                    Copilot, MCP, Pinokio, Audio AI, Video AI və daha çoxunu əhatə edən praktiki kurs. 
                    8 həftə, 40% praktika, 40% layihə, 20% nəzəri.
                  </p>
                </FadeIn>

                {/* CTAs */}
                <FadeIn delay={500} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link
                    href="/apply"
                    className="group relative inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 overflow-hidden text-sm sm:text-base"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Müraciət Et
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  </Link>

                  <Link
                    href="/course-details"
                    className="group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-white border-2 border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10 backdrop-blur-sm transition-all duration-200 text-sm sm:text-base"
                  >
                    <span>Ətraflı Məlumat</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </FadeIn>

                {/* Quick Stats */}
                <FadeIn delay={600} className="flex flex-wrap gap-6 pt-4">
                  {[
                    { icon: <Cpu className="w-4 h-4" />, label: '8 həftə' },
                    { icon: <Brain className="w-4 h-4" />, label: '7 AI Alət' },
                    { icon: <Zap className="w-4 h-4" />, label: 'Praktiki Layihələr' }
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-400">
                      <div className="p-2 rounded-lg bg-white/5 text-purple-400">
                        {stat.icon}
                      </div>
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                  ))}
                </FadeIn>
              </FadeIn>

              {/* Right Visual - Course Preview Card - Static, no animations */}
              <FadeIn delay={300} className="relative hidden lg:block">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-50" />
                
                {/* Card Content */}
                <div className="relative bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
                        <Brain className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">AI Kurs Proqramı</h3>
                        <p className="text-sm text-gray-400">Praktiki Süni İntellekt</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                      Aktiv
                    </div>
                  </div>

                  {/* Course Preview Grid - Static */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { name: 'Copilot', icon: <Code className="w-4 h-4" />, color: 'from-purple-500 to-purple-600' },
                      { name: 'MCP', icon: <Cpu className="w-4 h-4" />, color: 'from-blue-500 to-blue-600' },
                      { name: 'Pinokio', icon: <Brain className="w-4 h-4" />, color: 'from-cyan-500 to-cyan-600' },
                      { name: 'Audio AI', icon: <Headphones className="w-4 h-4" />, color: 'from-green-500 to-green-600' }
                    ].map((course) => (
                      <div
                        key={course.name}
                        className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${course.color} text-white`}>
                            {course.icon}
                          </div>
                          <span className="text-sm font-medium text-white">{course.name}</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full w-full bg-gradient-to-r ${course.color} rounded-full`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* More Courses */}
                  <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
                    <div className="flex -space-x-2">
                      {[Presentation, Video, GraduationCap].map((Icon, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                    <span>+3 daha çox modul</span>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">40%</p>
                      <p className="text-xs text-gray-400">Praktiki</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">40%</p>
                      <p className="text-xs text-gray-400">Layihə</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">20%</p>
                      <p className="text-xs text-gray-400">Nəzəri</p>
                    </div>
                  </div>
                </div>

                {/* Floating Elements - Static positioning, CSS hover only */}
                <div className="absolute -right-4 top-1/4 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Video Dərslər</p>
                      <p className="text-xs text-gray-400">HD Keyfiyyət</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -left-4 bottom-1/4 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">AI Alətləri</p>
                      <p className="text-xs text-gray-400">7+ Platform</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* Scroll Indicator - Simple CSS animation */}
          {!prefersReducedMotion && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" style={{ animationDuration: '2s' }}>
              <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
                <div className="w-1.5 h-3 rounded-full bg-white/40 animate-scrollIndicator" />
              </div>
            </div>
          )}
        </section>

        {/* Course Modules Preview - Optimized */}
        <section className="py-20 px-6 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Kurs Modulları
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                8 həftə ərzində ən populyar AI alətlərini praktiki şəkildə öyrənəcəksiniz
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courseModules.map((module) => (
                <div
                  key={module.name}
                  className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-colors duration-200 group"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    {module.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{module.name}</h3>
                  <p className="text-sm text-gray-400">{module.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/course-details"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 transition-colors duration-200"
              >
                Tam Sillabusu Gör
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works - Optimized */}
        <section className="py-20 px-6 sm:px-8 lg:px-12 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Necə Başlamaq?
              </h2>
              <p className="text-gray-400">
                3 sadə addımda kursumuzda yerinizi təmin edin
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="text-6xl font-bold bg-gradient-to-br from-purple-500/20 to-blue-500/20 bg-clip-text text-transparent mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 -right-6 text-purple-500/30">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 sm:py-12 px-4 sm:px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-8">
              <div className="col-span-1 md:col-span-1 space-y-4">
                <Logo size="sm" uppercase showText />
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Praktiki süni intellekt kursu - AI alətlərini öyrən, gələcəyini qur.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Kurs</h4>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li><Link href="/course-details" className="text-gray-400 hover:text-white transition">Sillabus</Link></li>
                  <li><Link href="/apply" className="text-gray-400 hover:text-white transition">Müraciət</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Platform</h4>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li><Link href="/auth/signin" className="text-gray-400 hover:text-white transition">Giriş</Link></li>
                </ul>
              </div>

              <div className="col-span-1 md:col-span-1">
                <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Əlaqə</h4>
                <ul className="space-y-3 text-xs sm:text-sm">
                  <li>
                    <a href="https://wa.me/994553858220" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      +994 55 385 82 20
                    </a>
                  </li>
                  <li>
                    <a href="mailto:contact@suni-intellekt.com" className="text-gray-400 hover:text-purple-400 transition flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      contact@suni-intellekt.com
                    </a>
                  </li>
                  <li>
                    <a href="https://instagram.com/ali.hasan0v" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 transition flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      @ali.hasan0v
                    </a>
                  </li>
                  <li>
                    <a href="https://www.linkedin.com/in/ali-hasanov/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      Ali Hasanov
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-gray-500">
              <p>© {new Date().getFullYear()} SÜNİ İNTELLEKT. Bütün hüquqlar qorunur.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
