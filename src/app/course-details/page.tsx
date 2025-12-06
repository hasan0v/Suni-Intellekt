"use client"
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Logo from '@/components/Logo'
import {
  Brain, Code, Cpu, Headphones, Presentation, Video, GraduationCap,
  ChevronRight, ArrowLeft, Clock, Users, Award,
  BookOpen, Target, Sparkles, Play, Download, MessageSquare
} from 'lucide-react'

interface LessonModule {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  practical: string
  project: string
  theoretical: string
  description: string
  tools: string[]
}

const courseModules: LessonModule[] = [
  {
    id: 'copilot',
    name: 'Copilot',
    icon: <Code className="w-6 h-6" />,
    color: 'from-purple-500 to-purple-600',
    practical: 'Code exercises',
    project: 'Full app',
    theoretical: 'Quiz',
    description: 'GitHub Copilot ilə AI-destekli kodlaşdırma. VS Code inteqrasiyası, prompt mühəndisliyi və praktiki kod yazma.',
    tools: ['GitHub Copilot', 'VS Code', 'Chat Copilot']
  },
  {
    id: 'mcp',
    name: 'Copilot + MCP',
    icon: <Cpu className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600',
    practical: 'Integration tasks',
    project: 'GitHub automation',
    theoretical: 'Concepts test',
    description: 'Model Context Protocol (MCP) ilə Copilot-un imkanlarını genişləndirmək. API inteqrasiyası və avtomatlaşdırma.',
    tools: ['MCP SDK', 'GitHub Actions', 'API Integration']
  },
  {
    id: 'pinokio',
    name: 'Pinokio',
    icon: <Brain className="w-6 h-6" />,
    color: 'from-cyan-500 to-cyan-600',
    practical: 'Launcher creation',
    project: 'Custom AI deploy',
    theoretical: 'Platform knowledge',
    description: 'Pinokio platforması ilə yerli AI modellərinin quraşdırılması. Bir kliklə AI alətlərinin deploy edilməsi.',
    tools: ['Pinokio', 'Local LLMs', 'ComfyUI']
  },
  {
    id: 'audio',
    name: 'Audio AI',
    icon: <Headphones className="w-6 h-6" />,
    color: 'from-green-500 to-green-600',
    practical: 'Audio editing',
    project: 'Complete production',
    theoretical: 'Tools comparison',
    description: 'AI ilə audio yaratma və redaktə. Podcast, voiceover və musiqi istehsalı üçün alətlər.',
    tools: ['ElevenLabs', 'Suno AI', 'Whisper']
  },
  {
    id: 'slides',
    name: 'Slides',
    icon: <Presentation className="w-6 h-6" />,
    color: 'from-orange-500 to-orange-600',
    practical: 'Slide design',
    project: 'Professional deck',
    theoretical: 'Best practices',
    description: 'AI-destəkli prezentasiya yaratma. Avtomatik dizayn, məzmun təklifləri və vizuallaşdırma.',
    tools: ['Gamma', 'Beautiful.ai', 'Canva AI']
  },
  {
    id: 'video',
    name: 'Video AI',
    icon: <Video className="w-6 h-6" />,
    color: 'from-red-500 to-red-600',
    practical: 'Video creation',
    project: 'Marketing campaign',
    theoretical: 'Platform expertise',
    description: 'AI ilə video istehsalı. Reklam videoları, sosial media content və avtomatik redaktə.',
    tools: ['Runway', 'Pika', 'HeyGen']
  },
  {
    id: 'academic',
    name: 'Academic',
    icon: <GraduationCap className="w-6 h-6" />,
    color: 'from-indigo-500 to-indigo-600',
    practical: 'Writing exercises',
    project: 'Research paper',
    theoretical: 'Integrity & ethics',
    description: 'Akademik yazı və tədqiqat üçün AI. Etik istifadə, sitatlandırma və plagiat qaydaları.',
    tools: ['ChatGPT', 'Perplexity', 'Consensus']
  }
]

const CourseDetailsPage: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [, setShowSyllabus] = useState(true)
  const [registrationEnabled, setRegistrationEnabled] = useState(false)

  // Force dark mode on mount
  useEffect(() => {
    document.documentElement.style.backgroundColor = '#030712'
    document.documentElement.style.colorScheme = 'dark'
    document.body.style.backgroundColor = '#030712'
    document.body.style.color = '#f9fafb'
    document.documentElement.classList.add('dark')
  }, [])

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

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #030712, #111827, #030712)', backgroundColor: '#030712', color: '#f9fafb' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <Logo size="sm" uppercase showText />
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/auth/signin"
                className="hidden sm:block px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-300"
              >
                Daxil ol
              </Link>
              {registrationEnabled && (
                <Link
                  href="/apply"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/25 transition-all duration-300"
                >
                  Müraciət Et
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 px-6 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto">
            {/* Back Link */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Ana Səhifə
            </Link>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">8 həftəlik İntensiv Proqram</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                >
                  Süni İntellekt
                  <span className="block bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Praktiki Kurs
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg text-gray-400 leading-relaxed"
                >
                  Copilot, MCP, Pinokio, Audio AI, Video AI və daha çoxunu əhatə edən 
                  praktiki kurs. Real layihələr, peşəkar alətlər və gələcəyin bacarıqları.
                </motion.p>

                {/* Stats Row */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
                >
                  {[
                    { icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />, value: '8', label: 'Həftə' },
                    { icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />, value: '7', label: 'Modul' },
                    { icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />, value: '20+', label: 'Alət' },
                    { icon: <Award className="w-4 h-4 sm:w-5 sm:h-5" />, value: '100%', label: 'Praktiki' }
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-gray-800/50 text-purple-400">
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 pt-4"
                >
                  {registrationEnabled && (
                    <Link
                      href="/apply"
                      className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 transition-all"
                    >
                      İndi Müraciət Et
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                  <a
                    href="/Sillabus.pdf"
                    download="AI-Kurs-Sillabus.pdf"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white border-2 border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Sillabus
                  </a>
                </motion.div>
              </div>

              {/* Right - Weight Distribution Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Qiymətləndirmə Strukturu
                  </h3>

                  <div className="space-y-6">
                    {[
                      { label: 'Praktiki', value: 40, color: 'from-purple-500 to-purple-600', desc: 'Kod terminləri, alət öyrənmə' },
                      { label: 'Layihə', value: 40, color: 'from-blue-500 to-blue-600', desc: 'Real layihələr, portfolio' },
                      { label: 'Nəzəri', value: 20, color: 'from-cyan-500 to-cyan-600', desc: 'Quiz, konsept testləri' }
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{item.label}</span>
                          <span className="text-2xl font-bold text-white">{item.value}%</span>
                        </div>
                        <div className="h-3 bg-gray-800 rounded-full overflow-hidden mb-2">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Ümumi</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        100%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Syllabus Section */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Kurs Sillabusu
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Hər həftə yeni AI aləti öyrənəcək, praktiki tapşırıqlar yerinə yetirəcək və 
                real layihələr üzərində işləyəcəksiniz.
              </p>
            </div>

            {/* Syllabus Table - Desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden lg:block bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
            >
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 p-4 bg-gray-800/50 border-b border-white/10 text-sm font-medium text-gray-400">
                <div>Dərs</div>
                <div className="text-center">Praktiki (40%)</div>
                <div className="text-center">Layihə (40%)</div>
                <div className="text-center">Nəzəri (20%)</div>
                <div className="text-center">Ümumi</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-white/5">
                {courseModules.map((module, index) => (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    {/* Main Row */}
                    <div
                      className={`grid grid-cols-5 gap-4 p-4 cursor-pointer transition-all ${
                        activeModule === module.id
                          ? 'bg-purple-500/10'
                          : 'hover:bg-gray-800/30'
                      }`}
                      onClick={() => setActiveModule(activeModule === module.id ? null : module.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${module.color} text-white`}>
                          {module.icon}
                        </div>
                        <span className="font-medium text-white">{module.name}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-sm text-gray-300 bg-purple-500/20 px-3 py-1 rounded-full">
                          {module.practical}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-sm text-gray-300 bg-blue-500/20 px-3 py-1 rounded-full">
                          {module.project}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-sm text-gray-300 bg-cyan-500/20 px-3 py-1 rounded-full">
                          {module.theoretical}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-bold text-green-400">100%</span>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {activeModule === module.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 bg-gray-800/30 border-t border-white/5">
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Təsvir</h4>
                                <p className="text-white">{module.description}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-400 mb-2">Alətlər</h4>
                                <div className="flex flex-wrap gap-2">
                                  {module.tools.map((tool, i) => (
                                    <span
                                      key={i}
                                      className="px-3 py-1 rounded-lg bg-gray-700/50 text-sm text-gray-300"
                                    >
                                      {tool}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Syllabus Cards - Mobile/Tablet */}
            <div className="lg:hidden space-y-4">
              {courseModules.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
                >
                  <div
                    className={`p-4 cursor-pointer transition-all ${
                      activeModule === module.id ? 'bg-purple-500/10' : ''
                    }`}
                    onClick={() => setActiveModule(activeModule === module.id ? null : module.id)}
                  >
                    {/* Module Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${module.color} text-white`}>
                          {module.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{module.name}</h3>
                          <span className="text-xs text-green-400 font-bold">100%</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                        activeModule === module.id ? 'rotate-90' : ''
                      }`} />
                    </div>

                    {/* Module Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-purple-500/10 rounded-lg">
                        <p className="text-xs text-purple-300 font-medium">Praktiki</p>
                        <p className="text-xs text-gray-400 truncate">{module.practical}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                        <p className="text-xs text-blue-300 font-medium">Layihə</p>
                        <p className="text-xs text-gray-400 truncate">{module.project}</p>
                      </div>
                      <div className="text-center p-2 bg-cyan-500/10 rounded-lg">
                        <p className="text-xs text-cyan-300 font-medium">Nəzəri</p>
                        <p className="text-xs text-gray-400 truncate">{module.theoretical}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {activeModule === module.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-gray-800/30 border-t border-white/5 space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Təsvir</h4>
                            <p className="text-sm text-white">{module.description}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Alətlər</h4>
                            <div className="flex flex-wrap gap-2">
                              {module.tools.map((tool, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-lg bg-gray-700/50 text-xs text-gray-300"
                                >
                                  {tool}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Play className="w-6 h-6" />,
                  title: 'Video Dərslər',
                  description: 'HD keyfiyyətli video dərslər, ekran paylaşımı və praktiki nümunələr'
                },
                {
                  icon: <Code className="w-6 h-6" />,
                  title: 'Kod Praktika',
                  description: 'Hər mövzu üzrə praktiki kod yazma tapşırıqları və həll nümunələri'
                },
                {
                  icon: <Target className="w-6 h-6" />,
                  title: 'Real Layihələr',
                  description: 'Portfolio üçün real layihələr: app, video, audio və daha çox'
                },
                {
                  icon: <MessageSquare className="w-6 h-6" />,
                  title: 'Dəstək',
                  description: '7/24 Discord dəstəyi, sual-cavab sessiyaları və mentorluq'
                },
                {
                  icon: <Award className="w-6 h-6" />,
                  title: 'Sertifikat',
                  description: 'Kursu bitirdikdən sonra tamamlama sertifikatı'
                },
                {
                  icon: <Users className="w-6 h-6" />,
                  title: 'İcma',
                  description: 'Eyni maraqları paylaşan tələbələr ilə networking'
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Hazırsınız?
                </h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                  {registrationEnabled 
                    ? 'AI gələcəyin texnologiyasıdır. Bu kursu keçərək gələcəyinizə investisiya edin. Qeydiyyat məhduddur!'
                    : 'AI gələcəyin texnologiyasıdır. Qeydiyyat tezliklə açılacaq. Daha çox məlumat üçün bizimlə əlaqə saxlayın!'
                  }
                </p>
                {registrationEnabled ? (
                  <Link
                    href="/apply"
                    className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 transition-all"
                  >
                    İndi Müraciət Et
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-semibold text-white border-2 border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all"
                  >
                    Ana Səhifəyə Qayıt
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} SÜNİ İNTELLEKT. Bütün hüquqlar qorunur.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default CourseDetailsPage
