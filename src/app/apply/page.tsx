'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ApplicationForm from '@/components/landing/ApplicationForm'
import { Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ApplyPage() {
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean | null>(null)
  const router = useRouter()

  // Force dark mode on mount
  useEffect(() => {
    document.documentElement.style.backgroundColor = '#030712'
    document.documentElement.style.colorScheme = 'dark'
    document.body.style.backgroundColor = '#030712'
    document.body.style.color = '#f9fafb'
    document.documentElement.classList.add('dark')
  }, [])

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

  // Loading state
  if (registrationEnabled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #030712, #111827, #030712)' }}>
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Registration disabled
  if (!registrationEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(to bottom right, #030712, #111827, #030712)' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
            <Clock className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Qeydiyyat Hazırda Bağlıdır
          </h2>
          
          <p className="text-gray-400 mb-8">
            Qeydiyyat hazırda aktiv deyil. Zəhmət olmasa daha sonra yenidən yoxlayın və ya kurs haqqında ətraflı məlumat alın.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/course-details"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all"
            >
              Kurs Haqqında
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-gray-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Ana Səhifə
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return <ApplicationForm />
}
