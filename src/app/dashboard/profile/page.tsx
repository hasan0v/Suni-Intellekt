'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { uploadProfileImage, deleteFile } from '@/lib/storage'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface ExtendedProfile {
  id: string
  full_name: string
  email?: string
  phone_number?: string
  profile_image_url?: string
  bio?: string
  role: 'student' | 'admin'
  created_at: string
}

interface FormData {
  full_name: string
  email: string
  phone_number: string
  bio: string
}

interface ProfileUpdateData {
  full_name: string
  profile_image_url?: string | null
  phone_number?: string | null
  bio?: string | null
}

interface ValidationErrors {
  full_name?: string
  email?: string
  phone_number?: string
  bio?: string
}

interface Notification {
  type: 'success' | 'error'
  message: string
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone_number: '',
    bio: ''
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile | null>(null)

  useEffect(() => {
    const fetchExtendedProfile = async () => {
      if (!user) return
      
      setLoading(true)
      try {
        // First, try to get all columns including bio and phone_number
        let { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        const { error: initialError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        // If bio/phone_number columns don't exist yet, fallback to basic columns
        if (initialError && initialError.message.includes('column')) {
          console.log('Bio/phone columns not found, using basic profile data')
          const { data: basicData, error: basicError } = await supabase
            .from('user_profiles')
            .select('id, full_name, profile_image_url, role, created_at')
            .eq('id', user.id)
            .single()

          if (basicError) throw basicError
          
          data = {
            ...basicData,
            phone_number: null,
            bio: null,
            email: user.email || ''
          }
        }

        if (initialError && !initialError.message.includes('column')) throw initialError
        
        setExtendedProfile({
          ...data,
          email: user.email || '',
          phone_number: data?.phone_number || '',
          bio: data?.bio || ''
        })
        
        setFormData({
          full_name: data?.full_name || '',
          email: user.email || '',
          phone_number: data?.phone_number || '',
          bio: data?.bio || ''
        })
        
        setProfileImage(data?.profile_image_url || null)
      } catch (error) {
        console.error('Error fetching extended profile:', error)
        // Fallback to basic profile data from context
        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            email: user.email || '',
            phone_number: '',
            bio: ''
          })
          setProfileImage(profile.profile_image_url || null)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchExtendedProfile()
  }, [user, profile])

  useEffect(() => {
    if (profile && user && !extendedProfile) {
      setFormData({
        full_name: profile.full_name || '',
        email: user.email || '',
        phone_number: profile.phone_number || '',
        bio: profile.bio || ''
      })
      setProfileImage(profile.profile_image_url || null)
    }
  }, [profile, user, extendedProfile])

  // Validation rules
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'full_name':
        if (!value.trim()) return 'Full name is required'
        if (value.trim().length < 2) return 'Name must be at least 2 characters'
        return undefined
      case 'email':
        if (!value.trim()) return 'Email is required'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) return 'Please enter a valid email address'
        return undefined
      case 'phone_number':
        if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return 'Please enter a valid phone number'
        }
        return undefined
      case 'bio':
        if (value.length > 500) return 'Bio must be less than 500 characters'
        return undefined
      default:
        return undefined
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value)
      if (error) {
        newErrors[key as keyof ValidationErrors] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Add to touched fields
    setTouchedFields(prev => new Set([...prev, name]))
    
    // Real-time validation for touched fields
    if (touchedFields.has(name) || value !== '') {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showNotification('error', 'Image size must be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Please select a valid image file')
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Upload image to Supabase Storage
  const uploadImageToCloud = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated')
    
    const result = await uploadProfileImage(file, user.id)
    
    if (result.error) {
      console.error('Profile image upload failed:', result.error)
      
      // Show helpful error message for storage setup
      if (result.error.includes('not found') || result.error.includes('does not exist')) {
        showNotification('error', 'Storage not configured. Please contact administrator to run: POST /api/setup-storage')
      } else {
        showNotification('error', result.error)
      }
      
      throw new Error(result.error)
    }
    
    if (!result.url) {
      throw new Error('Upload failed: No URL returned')
    }
    
    return result.url
  }

  const handleRemoveImage = async () => {
    if (profileImage && user) {
      try {
        // Extract file path from URL if it's a Supabase storage URL
        if (profileImage.includes('supabase')) {
          const urlParts = profileImage.split('/storage/v1/object/public/profile-images/')
          if (urlParts.length > 1) {
            await deleteFile('profile-images', urlParts[1])
          }
        }
      } catch (error) {
        console.error('Error deleting image from storage:', error)
      }
    }
    
    setProfileImage(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleSave = async () => {
    if (!validateForm()) {
      showNotification('error', 'Please fix the errors before saving')
      return
    }

    setSaving(true)
    try {
      let imageUrl = profileImage

      // Upload image if a new file was selected
      if (imageFile) {
        try {
          imageUrl = await uploadImageToCloud(imageFile)
          showNotification('success', 'Profile image uploaded successfully!')
        } catch (error) {
          console.error('Image upload error:', error)
          showNotification('error', 'Failed to upload image. Profile will be updated without new image.')
          imageUrl = extendedProfile?.profile_image_url || null
        }
      }

      // Update user profile - try with new columns first, fallback if they don't exist
      const profileUpdateData: ProfileUpdateData = {
        full_name: formData.full_name,
        profile_image_url: imageUrl
      }

      // Only include bio and phone_number if the columns exist
      try {
        profileUpdateData.phone_number = formData.phone_number || null
        profileUpdateData.bio = formData.bio || null

        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(profileUpdateData)
          .eq('id', user?.id)

        if (profileError && profileError.message.includes('column')) {
          // Fallback: update only basic fields
          console.log('Bio/phone columns not found, updating basic fields only')
          const { error: basicError } = await supabase
            .from('user_profiles')
            .update({
              full_name: formData.full_name,
              profile_image_url: imageUrl
            })
            .eq('id', user?.id)
          
          if (basicError) throw basicError
          showNotification('success', 'Profile updated (bio and phone number will be available after database migration)')
        } else if (profileError) {
          throw profileError
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('column')) {
          // Fallback: update only basic fields
          const { error: basicError } = await supabase
            .from('user_profiles')
            .update({
              full_name: formData.full_name,
              profile_image_url: imageUrl
            })
            .eq('id', user?.id)
          
          if (basicError) throw basicError
          showNotification('success', 'Profile updated (bio and phone number will be available after database migration)')
        } else {
          throw error
        }
      }

      // Update email if changed
      if (formData.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        if (emailError) throw emailError
        showNotification('success', 'Email update initiated. Please check your inbox to confirm the change.')
      }

      await refreshProfile()
      
      // Refresh extended profile data
      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!error) {
          setExtendedProfile({
            ...data,
            email: formData.email
          })
        }
      }

      setIsEditing(false)
      setImageFile(null)
      showNotification('success', 'Profile updated successfully!')
    } catch (error: unknown) {
      console.error('Error updating profile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
      showNotification('error', errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    const profileData = extendedProfile || profile
    if (profileData && user) {
      setFormData({
        full_name: profileData.full_name || '',
        email: user.email || '',
        phone_number: profileData.phone_number || '', 
        bio: profileData.bio || ''
      })
      setProfileImage(profileData.profile_image_url || null)
      setImageFile(null)
      setErrors({})
      setTouchedFields(new Set())
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-card p-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-samsung-blue flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl samsung-heading text-gray-900">My Profile</h1>
              <p className="mt-1 samsung-body text-gray-600">
                Manage your personal information
              </p>
            </div>
          </div>
          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </motion.button>
          )}
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`glass-card p-4 border-l-4 ${
                notification.type === 'success'
                  ? 'border-green-500 bg-green-50/50'
                  : 'border-red-500 bg-red-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {notification.type === 'success' ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <p className={`samsung-body text-sm ${
                  notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {notification.message}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Picture & Quick Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Picture Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6"
            >
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden bg-samsung-blue/10 shadow-samsung-card mx-auto">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-10 h-10 bg-samsung-blue rounded-2xl shadow-samsung-card flex items-center justify-center text-white hover:bg-samsung-blue-dark transition-all duration-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                </div>
                <h2 className="text-xl samsung-heading text-gray-900 mb-1">
                  {extendedProfile?.full_name || profile?.full_name || 'User'}
                </h2>
                <p className="samsung-body text-sm text-gray-600 capitalize mb-4">
                  {extendedProfile?.role || profile?.role}
                </p>
                {isEditing && profileImage && (
                  <button
                    onClick={handleRemoveImage}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs samsung-body text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-300 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove Photo
                  </button>
                )}
              </div>
            </motion.div>

            {/* Account Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h3 className="text-base samsung-heading text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-samsung-blue/5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-samsung-blue/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs samsung-body text-gray-600">Role</p>
                    <p className="text-sm samsung-body text-gray-900 capitalize">
                      {extendedProfile?.role || profile?.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-samsung-cyan/5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-samsung-cyan/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-samsung-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs samsung-body text-gray-600">Member Since</p>
                    <p className="text-sm samsung-body text-gray-900">
                      {new Date(extendedProfile?.created_at || profile?.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Profile Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 glass-card p-8"
          >
            <h3 className="text-lg samsung-heading text-gray-900 mb-6">Personal Details</h3>
            
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm samsung-body text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className={`block w-full border-2 rounded-xl px-4 py-3 samsung-body text-gray-900 transition-all duration-300 ${
                      errors.full_name
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                        : 'border-samsung-gray-100 focus:border-samsung-blue focus:ring-4 focus:ring-samsung-blue/20'
                    }`}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="px-4 py-3 samsung-body text-gray-900 bg-samsung-gray-50 rounded-xl">
                    {formData.full_name || 'Not provided'}
                  </p>
                )}
                {errors.full_name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs samsung-body mt-1 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.full_name}
                  </motion.p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm samsung-body text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`block w-full border-2 rounded-xl px-4 py-3 samsung-body text-gray-900 transition-all duration-300 ${
                      errors.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                        : 'border-samsung-gray-100 focus:border-samsung-blue focus:ring-4 focus:ring-samsung-blue/20'
                    }`}
                    placeholder="Enter your email address"
                  />
                ) : (
                  <p className="px-4 py-3 samsung-body text-gray-900 bg-samsung-gray-50 rounded-xl">
                    {formData.email || 'Not provided'}
                  </p>
                )}
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs samsung-body mt-1 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm samsung-body text-gray-700 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    className={`block w-full border-2 rounded-xl px-4 py-3 samsung-body text-gray-900 transition-all duration-300 ${
                      errors.phone_number
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                        : 'border-samsung-gray-100 focus:border-samsung-blue focus:ring-4 focus:ring-samsung-blue/20'
                    }`}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="px-4 py-3 samsung-body text-gray-900 bg-samsung-gray-50 rounded-xl">
                    {formData.phone_number || 'Not provided'}
                  </p>
                )}
                {errors.phone_number && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-xs samsung-body mt-1 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.phone_number}
                  </motion.p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm samsung-body text-gray-700 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <motion.textarea
                    whileFocus={{ scale: 1.01 }}
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={5}
                    className={`block w-full border-2 rounded-xl px-4 py-3 samsung-body text-gray-900 resize-none transition-all duration-300 ${
                      errors.bio
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
                        : 'border-samsung-gray-100 focus:border-samsung-blue focus:ring-4 focus:ring-samsung-blue/20'
                    }`}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="px-4 py-3 samsung-body text-gray-900 bg-samsung-gray-50 rounded-xl min-h-[120px] whitespace-pre-wrap">
                    {formData.bio || 'No bio provided'}
                  </p>
                )}
                <div className="flex justify-between items-center mt-1">
                  {errors.bio && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 text-xs samsung-body flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.bio}
                    </motion.p>
                  )}
                  {isEditing && (
                    <p className={`text-xs samsung-body ml-auto ${
                      formData.bio.length > 450 ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {formData.bio.length}/500
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-samsung-gray-100"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl samsung-body border-2 border-samsung-gray-100 text-gray-700 bg-white hover:bg-samsung-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </DashboardLayout>
  )
}
