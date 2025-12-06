"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Mail, Phone, Code, Monitor, Laptop,
  ChevronRight, ChevronLeft, Sparkles, CheckCircle2, 
  Target, Send, AlertCircle, Loader2
} from 'lucide-react'

interface FormData {
  // Page 1
  fullName: string
  email: string
  phoneNumber: string
  // Page 2
  programmingExperience: string
  developmentEnvironment: string
  computerType: string
  // Page 3
  motivation: string
}

const initialFormData: FormData = {
  fullName: '',
  email: '',
  phoneNumber: '+994 ',
  programmingExperience: '',
  developmentEnvironment: '',
  computerType: '',
  motivation: ''
}

// Format phone number to Azerbaijani standard: +994 XX XXX XX XX
const formatAzerbaijaniPhone = (value: string): string => {
  // Remove all non-digit characters except the leading +
  let digits = value.replace(/[^\d]/g, '')
  
  // Ensure it starts with 994
  if (!digits.startsWith('994')) {
    digits = '994' + digits.replace(/^994/, '')
  }
  
  // Limit to 12 digits (994 + 9 digits)
  digits = digits.slice(0, 12)
  
  // Format: +994 XX XXX XX XX
  let formatted = '+994'
  const remaining = digits.slice(3) // Remove 994 prefix
  
  if (remaining.length > 0) {
    formatted += ' ' + remaining.slice(0, 2) // XX
  }
  if (remaining.length > 2) {
    formatted += ' ' + remaining.slice(2, 5) // XXX
  }
  if (remaining.length > 5) {
    formatted += ' ' + remaining.slice(5, 7) // XX
  }
  if (remaining.length > 7) {
    formatted += ' ' + remaining.slice(7, 9) // XX
  }
  
  return formatted
}

// Validate Azerbaijani phone number format
const isValidAzerbaijaniPhone = (phone: string): boolean => {
  // Should match: +994 XX XXX XX XX (with spaces)
  const phoneRegex = /^\+994 \d{2} \d{3} \d{2} \d{2}$/
  return phoneRegex.test(phone)
}

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  const steps = [
    { label: 'Əsas Məlumat', shortLabel: 'Əsas', icon: User },
    { label: 'Texniki', shortLabel: 'Texniki', icon: Code },
    { label: 'Motivasiya', shortLabel: 'Son', icon: Target }
  ]

  return (
    <div className="flex items-center justify-between mb-6 sm:mb-8 px-0 sm:px-4">
      {steps.map((step, index) => {
        const StepIcon = step.icon
        const isActive = index === currentStep
        const isCompleted = index < currentStep
        
        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center gap-1.5 sm:gap-2">
              <motion.div
                className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                    : isActive
                    ? 'bg-gradient-to-br from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-800 text-gray-500'
                }`}
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 2 }}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </motion.div>
              <span className={`text-[10px] sm:text-xs font-medium text-center ${
                isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-gray-500'
              }`}>
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.shortLabel}</span>
              </span>
            </div>
            {index < totalSteps - 1 && (
              <div className="flex-1 mx-2 sm:mx-4 h-0.5 bg-gray-800 relative">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

interface InputFieldProps {
  label: string
  icon: React.ReactNode
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
}

const InputField: React.FC<InputFieldProps> = ({
  label, icon, type = 'text', placeholder, value, onChange, error, required
}) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
      {icon}
      {label}
      {required && <span className="text-red-400">*</span>}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-3.5 bg-gray-800/50 border ${
        error ? 'border-red-500/50' : 'border-white/10'
      } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all`}
    />
    {error && (
      <motion.p 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-red-400 flex items-center gap-1"
      >
        <AlertCircle className="w-4 h-4" />
        {error}
      </motion.p>
    )}
  </div>
)

interface RadioOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface RadioGroupProps {
  label: string
  icon: React.ReactNode
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  showOther?: boolean
  otherValue?: string
  onOtherChange?: (value: string) => void
  error?: string
  required?: boolean
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  label, icon, options, value, onChange, showOther, otherValue, onOtherChange, error, required
}) => (
  <div className="space-y-3">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
      {icon}
      {label}
      {required && <span className="text-red-400">*</span>}
    </label>
    <div className="grid gap-3">
      {options.map((option) => (
        <motion.button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`relative w-full p-4 rounded-xl border text-left transition-all ${
            value === option.value
              ? 'bg-purple-500/20 border-purple-500/50 text-white'
              : 'bg-gray-800/30 border-white/10 text-gray-300 hover:border-white/20'
          }`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              value === option.value ? 'border-purple-500 bg-purple-500' : 'border-gray-600'
            }`}>
              {value === option.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 rounded-full bg-white"
                />
              )}
            </div>
            {option.icon}
            <span className="font-medium">{option.label}</span>
          </div>
        </motion.button>
      ))}
      {showOther && (
        <div className="flex gap-3">
          <motion.button
            type="button"
            onClick={() => onChange('other')}
            className={`p-4 rounded-xl border transition-all ${
              value === 'other'
                ? 'bg-purple-500/20 border-purple-500/50'
                : 'bg-gray-800/30 border-white/10 hover:border-white/20'
            }`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              value === 'other' ? 'border-purple-500 bg-purple-500' : 'border-gray-600'
            }`}>
              {value === 'other' && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </motion.button>
          <input
            type="text"
            placeholder="Digər..."
            value={otherValue || ''}
            onChange={(e) => {
              onChange('other')
              onOtherChange?.(e.target.value)
            }}
            className="flex-1 px-4 py-3.5 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>
      )}
    </div>
    {error && (
      <motion.p 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-red-400 flex items-center gap-1"
      >
        <AlertCircle className="w-4 h-4" />
        {error}
      </motion.p>
    )}
  </div>
)

export const ApplicationForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [otherEnvironment, setOtherEnvironment] = useState('')
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {}
    
    if (step === 0) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Ad Soyad tələb olunur'
      if (!formData.email.trim()) newErrors.email = 'Email tələb olunur'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Düzgün email formatı daxil edin'
      }
      if (!formData.phoneNumber.trim() || formData.phoneNumber === '+994 ') {
        newErrors.phoneNumber = 'Telefon nömrəsi tələb olunur'
      } else if (!isValidAzerbaijaniPhone(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Format: +994 XX XXX XX XX'
      }
    }
    
    if (step === 1) {
      if (!formData.programmingExperience) {
        newErrors.programmingExperience = 'Proqramlaşdırma təcrübənizi seçin'
      }
      if (!formData.developmentEnvironment) {
        newErrors.developmentEnvironment = 'Development environment seçin'
      }
      if (!formData.computerType) {
        newErrors.computerType = 'Kompüter növünü seçin'
      }
    }
    
    if (step === 2) {
      if (!formData.motivation.trim()) {
        newErrors.motivation = 'Motivasiyanızı yazın'
      } else if (formData.motivation.length > 300) {
        newErrors.motivation = `Maksimum 300 simvol (${formData.motivation.length}/300)`
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          developmentEnvironment: formData.developmentEnvironment === 'other' 
            ? otherEnvironment 
            : formData.developmentEnvironment
        })
      })

      if (!response.ok) throw new Error('Submission failed')
      
      setIsSuccess(true)
    } catch (error) {
      console.error('Error submitting application:', error)
      setErrors({ ...errors, motivation: 'Xəta baş verdi. Yenidən cəhd edin.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Success Screen
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center px-4"
      >
        <div className="max-w-md w-full">
          <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-2"
            >
              ✅ Müraciətiniz qəbul edildi!
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 mb-8"
            >
              Təşəkkürlər, {formData.fullName}!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4 text-left bg-gray-800/50 rounded-xl p-5 mb-6"
            >
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">📧 Email Cavabı</p>
                  <p className="text-sm text-gray-400">24 saat ərzində email cavab alacaqsınız.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">💬 Suallarınız varsa</p>
                  <p className="text-sm text-gray-400">WhatsApp: +994 55 385 82 20</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">🎓 Kurs haqqında</p>
                  <a href="/course-details" className="text-sm text-purple-400 hover:underline">
                    Ətraflı məlumat üçün klikləyin
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl"
            >
              Təşəkkürlər! 🚀
            </motion.p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen py-6 sm:py-12 px-3 sm:px-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-0 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-3 sm:mb-4">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
            <span className="text-xs sm:text-sm font-medium text-purple-300">AI Kurs Müraciəti</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            Qeydiyyat Forması
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Süni İntellekt kursu üçün müraciət edin
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8"
        >
          <StepIndicator currentStep={currentStep} totalSteps={3} />

          <AnimatePresence mode="wait">
            {/* Step 1: Basic Information */}
            {currentStep === 0 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Əsas Məlumat</h2>
                  <p className="text-sm text-gray-400">Sizinlə əlaqə üçün məlumatlar</p>
                </div>

                <InputField
                  label="Ad Soyad"
                  icon={<User className="w-4 h-4 text-purple-400" />}
                  placeholder="Adınız və Soyadınız"
                  value={formData.fullName}
                  onChange={(v) => updateField('fullName', v)}
                  error={errors.fullName}
                  required
                />

                <InputField
                  label="Email"
                  icon={<Mail className="w-4 h-4 text-purple-400" />}
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(v) => updateField('email', v)}
                  error={errors.email}
                  required
                />

                <InputField
                  label="WhatsApp/Telegram nömrəsi"
                  icon={<Phone className="w-4 h-4 text-purple-400" />}
                  type="tel"
                  placeholder="+994 XX XXX XX XX"
                  value={formData.phoneNumber}
                  onChange={(v) => updateField('phoneNumber', formatAzerbaijaniPhone(v))}
                  error={errors.phoneNumber}
                  required
                />
              </motion.div>
            )}

            {/* Step 2: Technical Readiness */}
            {currentStep === 1 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Texniki Hazırlıq</h2>
                  <p className="text-sm text-gray-400">Sizi daha yaxşı tanımaq üçün bir neçə sual ✨</p>
                </div>

                <RadioGroup
                  label="Proqramlaşdırma təcrübəniz?"
                  icon={<Code className="w-4 h-4 text-purple-400" />}
                  options={[
                    { value: 'none', label: 'Heç yoxdur' },
                    { value: 'beginner', label: 'Başlanğıc (HTML/CSS)' },
                    { value: 'intermediate', label: 'Orta (Python/JavaScript)' },
                    { value: 'professional', label: 'Peşəkar (3+ il)' }
                  ]}
                  value={formData.programmingExperience}
                  onChange={(v) => updateField('programmingExperience', v)}
                  error={errors.programmingExperience}
                  required
                />

                <RadioGroup
                  label="Hansı development environment istifadə edirsiniz?"
                  icon={<Monitor className="w-4 h-4 text-purple-400" />}
                  options={[
                    { value: 'vscode', label: 'VS Code' },
                    { value: 'jetbrains', label: 'PyCharm/IntelliJ IDEA' },
                    { value: 'visualstudio', label: 'Visual Studio' },
                    { value: 'none', label: 'Heç biri (öyrənəcəyəm)' }
                  ]}
                  value={formData.developmentEnvironment}
                  onChange={(v) => updateField('developmentEnvironment', v)}
                  showOther
                  otherValue={otherEnvironment}
                  onOtherChange={setOtherEnvironment}
                  error={errors.developmentEnvironment}
                  required
                />

                <RadioGroup
                  label="Kompüteriniz:"
                  icon={<Laptop className="w-4 h-4 text-purple-400" />}
                  options={[
                    { value: 'laptop', label: 'Laptop (əsas istifadə)' },
                    { value: 'desktop_medium', label: 'Desktop (orta GPU)' },
                    { value: 'desktop_powerful', label: 'Desktop (güclü GPU - RTX/Gaming)' },
                    { value: 'not_sure', label: 'Əmin deyiləm' }
                  ]}
                  value={formData.computerType}
                  onChange={(v) => updateField('computerType', v)}
                  error={errors.computerType}
                  required
                />
              </motion.div>
            )}

            {/* Step 3: Motivation */}
            {currentStep === 2 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Motivasiya</h2>
                  <p className="text-sm text-gray-400">Son bir şey! 🎯</p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Target className="w-4 h-4 text-purple-400" />
                    Bu kursu nə üçün keçmək istəyirsiniz?
                    <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    placeholder="Motivasiyanızı buraya yazın..."
                    value={formData.motivation}
                    onChange={(e) => updateField('motivation', e.target.value)}
                    rows={5}
                    className={`w-full px-4 py-3.5 bg-gray-800/50 border ${
                      errors.motivation ? 'border-red-500/50' : 'border-white/10'
                    } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none`}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className={`${
                      formData.motivation.length > 300 
                        ? 'text-red-400' 
                        : 'text-green-400'
                    }`}>
                      {formData.motivation.length}/300 simvol
                    </span>
                    {errors.motivation && (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.motivation}
                      </span>
                    )}
                  </div>
                </div>

                {/* Example motivations */}
                <div className="bg-gray-800/30 rounded-xl p-4 border border-white/5">
                  <p className="text-xs font-medium text-gray-400 mb-3">Nümunələr:</p>
                  <div className="space-y-2">
                    {[
                      '"AI ilə işimdə daha məhsuldar olmaq"',
                      '"Freelance üçün video/audio content yaratmaq"',
                      '"Karyera dəyişikliyi və yeni bacarıqlar"'
                    ].map((example, i) => (
                      <p key={i} className="text-xs text-gray-500 italic">• {example}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
            {currentStep > 0 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all text-sm sm:text-base"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Geri</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 2 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 transition-all text-sm sm:text-base"
              >
                Növbəti
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-lg shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span className="hidden sm:inline">Göndərilir...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Müraciət Et</span>
                    <span className="sm:hidden">Göndər</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ApplicationForm
