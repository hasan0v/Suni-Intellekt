"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, ChevronRight, Brain, Cpu, Zap, Play, ArrowRight } from 'lucide-react'

interface Slide {
  id: string
  title: string
  subtitle: string
  description: string
  cta: {
    text: string
    href: string
    variant: 'primary' | 'secondary'
  }
  secondaryCta?: {
    text: string
    href: string
  }
  badge?: string
  icon: React.ReactNode
  gradient: string
  particles: string[]
}

const slides: Slide[] = [
  {
    id: 'ai-course',
    badge: '🎓 Qeydiyyat Açıqdır',
    title: 'Süni İntellekt Dərsinə Qeydiyyat Başladı',
    subtitle: 'Gələcəyin Texnologiyasını Bu Gün Öyrənin',
    description: 'Copilot, MCP, Pinokio, Audio AI, Video AI və daha çoxunu əhatə edən praktiki kurs. 7 həftə, 40% praktika, 40% layihə, 20% nəzəri.',
    cta: {
      text: 'Ətraflı Məlumat',
      href: '/course-details',
      variant: 'primary'
    },
    secondaryCta: {
      text: 'İndi Müraciət Et',
      href: '/apply'
    },
    icon: <Brain className="w-16 h-16" />,
    gradient: 'from-purple-600 via-indigo-600 to-blue-600',
    particles: ['✨', '🤖', '💡', '🚀', '⚡']
  }
]

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

export const HeroCarousel: React.FC = () => {
  const [currentSlide] = useState(0)
  const [showSignUp, setShowSignUp] = useState(false)

  const slide = slides[currentSlide]

  // Reveal sign up button after interaction or delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSignUp(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section 
      className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
    >
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
        {slide.particles.map((emoji, i) => (
          <FloatingParticle key={i} emoji={emoji} delay={i * 0.5} index={i} />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-8"
            >
              {/* Badge */}
              {slide.badge && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 backdrop-blur-sm"
                >
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-sm font-medium text-purple-300">{slide.badge}</span>
                </motion.div>
              )}

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
              >
                <span className={`bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
                  {slide.title}
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-400 font-medium"
              >
                {slide.subtitle}
              </motion.p>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-gray-500 leading-relaxed max-w-xl"
              >
                {slide.description}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href={slide.cta.href}
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {slide.cta.text}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                </Link>

                {slide.secondaryCta && (
                  <AnimatePresence>
                    {showSignUp && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Link
                          href={slide.secondaryCta.href}
                          className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white border-2 border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10 backdrop-blur-sm transition-all duration-300"
                        >
                          <span>{slide.secondaryCta.text}</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap gap-6 pt-4"
              >
                {[
                  { icon: <Cpu className="w-4 h-4" />, label: '7 Həftə' },
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
          </AnimatePresence>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative hidden lg:block"
          >
            {/* Main Card */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
              
              {/* Card Content */}
              <div className="relative bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${slide.gradient} shadow-lg`}>
                      {slide.icon}
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
                    { name: 'Copilot', progress: 100, color: 'from-purple-500 to-purple-600' },
                    { name: 'MCP', progress: 100, color: 'from-blue-500 to-blue-600' },
                    { name: 'Pinokio', progress: 100, color: 'from-cyan-500 to-cyan-600' },
                    { name: 'Audio AI', progress: 100, color: 'from-green-500 to-green-600' }
                  ].map((course, i) => (
                    <motion.div
                      key={course.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{course.name}</span>
                        <span className="text-xs text-gray-400">{course.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${course.color} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ delay: 0.8 + i * 0.1, duration: 0.8 }}
                        />
                      </div>
                    </motion.div>
                  ))}
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
  )
}

export default HeroCarousel
