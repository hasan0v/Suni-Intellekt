"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, ChevronRight, Brain, Cpu, Zap, Play, ArrowRight,
  Headphones, Presentation, Video, GraduationCap, Code, Menu, X, Clock
} from 'lucide-react'

// Floating Particle Component
const FloatingParticle: React.FC<{ emoji: string; delay: number; index: number }> = ({ emoji, delay, index }) => {
  const positions = [
    { x: '10%', y: '20%' },
    { x: '85%', y: '15%' },
    { x: '75%', y: '70%' },
    { x: '15%', y: '75%' },
    { x: '50%', y: '10%' }
  ]
  
  const pos = positions[index % positions.length]
  
  return (
    <motion.div
      className="absolute text-3xl md:text-4xl opacity-20 pointer-events-none select-none"
      style={{ left: pos.x, top: pos.y }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0.1, 0.3, 0.1],
        scale: [0.8, 1.2, 0.8],
        y: [0, -20, 0],
        rotate: [0, 10, -10, 0]
      }}
      transition={{
        duration: 4,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {emoji}
    </motion.div>
  )
}

// Glowing Orb Component
const GlowingOrb: React.FC<{ color: string; size: string; position: { x: string; y: string }; delay: number }> = ({ 
  color, size, position, delay 
}) => (
  <motion.div
    className={`absolute ${size} rounded-full blur-3xl opacity-30 pointer-events-none`}
    style={{ 
      left: position.x, 
      top: position.y,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`
    }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.2, 0.4, 0.2]
    }}
    transition={{
      duration: 5,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
)

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState(false)

  useEffect(() => setMounted(true), [])
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

  // Reveal sign up button after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSignUp(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const particles = ['✨', '🤖', '💡', '🚀', '⚡']

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #030712, #111827, #030712)', backgroundColor: '#030712' }}>
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-purple-500/20" />
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-purple-500 border-t-transparent absolute top-0 left-0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse">
              <Logo size="lg" showText uppercase={false} />
            </div>
          </div>
        </div>
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
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-300"
              >
                Kurs Haqqında
              </Link>
              <Link
                href="/auth/signin"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-300"
              >
                Daxil ol
              </Link>
              <AnimatePresence>
                {showSignUp && registrationEnabled && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Link
                      href="/auth/signup"
                      className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/25 transition-all duration-300"
                    >
                      Qeydiyyat
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden"
              >
                <div className="py-4 space-y-2 border-t border-white/5">
                  <Link
                    href="/course-details"
                    className="block px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Kurs Haqqında
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="block px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Daxil ol
                  </Link>
                  {registrationEnabled && (
                    <Link
                      href="/auth/signup"
                      className="block px-4 py-3 rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Qeydiyyat
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section - Course Advertisement Carousel */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
          {/* Animated Background */}
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
            
            {/* Glowing Orbs */}
            <GlowingOrb color="#8B5CF6" size="w-96 h-96" position={{ x: '10%', y: '20%' }} delay={0} />
            <GlowingOrb color="#3B82F6" size="w-80 h-80" position={{ x: '70%', y: '60%' }} delay={1} />
            <GlowingOrb color="#06B6D4" size="w-64 h-64" position={{ x: '80%', y: '10%' }} delay={2} />
            <GlowingOrb color="#8B5CF6" size="w-72 h-72" position={{ x: '5%', y: '70%' }} delay={1.5} />

            {/* Floating Particles */}
            {particles.map((emoji, i) => (
              <FloatingParticle key={i} emoji={emoji} delay={i * 0.5} index={i} />
            ))}
          </div>

          {/* Main Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="space-y-8"
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                    registrationEnabled 
                      ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30'
                      : 'bg-gradient-to-r from-gray-500/20 to-gray-500/20 border border-gray-500/30'
                  } backdrop-blur-sm`}
                >
                  {registrationEnabled ? (
                    <>
                      <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                      <span className="text-sm font-medium text-purple-300">🎓 Qeydiyyat Açıqdır</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-400">⏳ Qeydiyyat Tezliklə</span>
                    </>
                  )}
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                >
                  <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Süni İntellekt Dərsinə Qeydiyyat Başladı
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl md:text-2xl text-gray-400 font-medium"
                >
                  Gələcəyin Texnologiyasını Bu Gün Öyrənin
                </motion.p>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg text-gray-500 leading-relaxed max-w-xl"
                >
                  Copilot, MCP, Pinokio, Audio AI, Video AI və daha çoxunu əhatə edən praktiki kurs. 
                  8 həftə, 40% praktika, 40% layihə, 20% nəzəri.
                </motion.p>

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                >
                  <Link
                    href="/course-details"
                    className="group relative inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 overflow-hidden text-sm sm:text-base"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Ətraflı Məlumat
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                  </Link>

                  <AnimatePresence>
                    {showSignUp && registrationEnabled && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Link
                          href="/apply"
                          className="group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-white border-2 border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10 backdrop-blur-sm transition-all duration-300 text-sm sm:text-base"
                        >
                          <span>İndi Müraciət Et</span>
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-wrap gap-6 pt-4"
                >
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
                </motion.div>
              </motion.div>

              {/* Right Visual - Course Preview Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="relative hidden lg:block"
              >
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
                
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

                  {/* Course Preview Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { name: 'Copilot', icon: <Code className="w-4 h-4" />, color: 'from-purple-500 to-purple-600' },
                      { name: 'MCP', icon: <Cpu className="w-4 h-4" />, color: 'from-blue-500 to-blue-600' },
                      { name: 'Pinokio', icon: <Brain className="w-4 h-4" />, color: 'from-cyan-500 to-cyan-600' },
                      { name: 'Audio AI', icon: <Headphones className="w-4 h-4" />, color: 'from-green-500 to-green-600' }
                    ].map((course, i) => (
                      <motion.div
                        key={course.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${course.color} text-white`}>
                            {course.icon}
                          </div>
                          <span className="text-sm font-medium text-white">{course.name}</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${course.color} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ delay: 0.8 + i * 0.1, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
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

                {/* Floating Elements */}
                <motion.div
                  className="absolute -right-4 top-1/4 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Video Dərslər</p>
                      <p className="text-xs text-gray-400">HD Keyfiyyət</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -left-4 bottom-1/4 bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">AI Alətləri</p>
                      <p className="text-xs text-gray-400">7+ Platform</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
              <motion.div
                className="w-1.5 h-3 rounded-full bg-white/40"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </section>

        {/* Course Modules Preview */}
        <section className="py-20 px-6 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-white mb-4"
              >
                Kurs Modulları
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-gray-400 max-w-2xl mx-auto"
              >
                8 həftə ərzində ən populyar AI alətlərini praktiki şəkildə öyrənəcəksiniz
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[
                { name: 'Copilot', icon: <Code className="w-6 h-6" />, color: 'from-purple-500 to-purple-600', desc: 'AI-destəkli kodlaşdırma' },
                { name: 'MCP', icon: <Cpu className="w-6 h-6" />, color: 'from-blue-500 to-blue-600', desc: 'Model Context Protocol' },
                { name: 'Pinokio', icon: <Brain className="w-6 h-6" />, color: 'from-cyan-500 to-cyan-600', desc: 'Yerli AI modelləri' },
                { name: 'Audio AI', icon: <Headphones className="w-6 h-6" />, color: 'from-green-500 to-green-600', desc: 'Səs yaratma və redaktə' },
                { name: 'Slides', icon: <Presentation className="w-6 h-6" />, color: 'from-orange-500 to-orange-600', desc: 'AI prezentasiyalar' },
                { name: 'Video AI', icon: <Video className="w-6 h-6" />, color: 'from-red-500 to-red-600', desc: 'Video istehsalı' },
                { name: 'Academic', icon: <GraduationCap className="w-6 h-6" />, color: 'from-indigo-500 to-indigo-600', desc: 'Akademik yazı' }
              ].map((module, i) => (
                <motion.div
                  key={module.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all group"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {module.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{module.name}</h3>
                  <p className="text-sm text-gray-400">{module.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link
                href="/course-details"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 transition-all"
              >
                Tam Sillabusu Gör
                <ChevronRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
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
              {[
                {
                  step: '01',
                  title: 'Müraciət Edin',
                  description: 'Onlayn formu doldurun. Ad, email və motivasiyanızı qeyd edin.'
                },
                {
                  step: '02',
                  title: 'Təsdiq Alın',
                  description: '24 saat ərzində email vasitəsilə nəticənizi öyrənin.'
                },
                {
                  step: '03',
                  title: 'Öyrənməyə Başlayın',
                  description: 'Kursa qoşulun və AI dünyasını kəşf etməyə başlayın.'
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
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
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {/* Footer */}
        <footer className="border-t border-white/10 py-8 sm:py-12 px-4 sm:px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8">
              <div className="col-span-2 md:col-span-1 space-y-4">
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
                  <li><Link href="/auth/signup" className="text-gray-400 hover:text-white transition">Qeydiyyat</Link></li>
                  <li><Link href="/auth/signin" className="text-gray-400 hover:text-white transition">Giriş</Link></li>
                </ul>
              </div>

              <div className="col-span-2 md:col-span-1">
                <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">Əlaqə</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
                  <li>WhatsApp Dəstəyi</li>
                  <li>Email</li>
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
