'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Video, Link as LinkIcon, ExternalLink, Download, Trash2 } from 'lucide-react'

interface ClassMaterial {
  id: string
  class_id: string
  title: string
  description: string | null
  file_url: string | null
  file_path: string | null
  material_type: 'document' | 'video' | 'link' | 'other'
  created_by: string
  created_at: string
  updated_at: string
}

interface ClassInfo {
  id: string
  name: string
  description: string | null
}

export default function ClassMaterialsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const { showConfirm } = useConfirmDialog()
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [materials, setMaterials] = useState<ClassMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    material_type: 'document' as 'document' | 'video' | 'link' | 'other',
    link_url: '',
    file: null as File | null
  })

  const classId = params?.id as string

  useEffect(() => {
    if (profile?.role === 'admin' && classId) {
      fetchClassInfo()
      fetchMaterials()
    }
  }, [profile, classId])

  const fetchClassInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, description')
        .eq('id', classId)
        .single()

      if (error) throw error
      setClassInfo(data)
    } catch (error) {
      console.error('Error fetching class info:', error)
      showError('Error', 'Failed to load class information')
    }
  }

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('class_materials')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
      showError('Error', 'Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async () => {
    if (!user || !formData.title) return

    setUploading(true)
    try {
      let fileUrl = null
      let filePath = null

      // Upload file if provided
      if (formData.file && formData.material_type !== 'link') {
        const fileExt = formData.file.name.split('.').pop()
        const fileName = `${classId}/${Date.now()}.${fileExt}`
        filePath = fileName

        const { error: uploadError } = await supabase.storage
          .from('class-materials')
          .upload(fileName, formData.file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('class-materials')
          .getPublicUrl(fileName)

        fileUrl = urlData.publicUrl
      } else if (formData.material_type === 'link') {
        fileUrl = formData.link_url
      }

      const { error } = await supabase
        .from('class_materials')
        .insert([{
          class_id: classId,
          title: formData.title,
          description: formData.description || null,
          file_url: fileUrl,
          file_path: filePath,
          material_type: formData.material_type,
          created_by: user.id
        }])

      if (error) throw error

      await fetchMaterials()
      resetForm()
      setShowUploadModal(false)
      showSuccess('Success', 'Material added successfully!')
    } catch (error) {
      console.error('Error uploading material:', error)
      showError('Error', 'Failed to add material')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMaterial = async (materialId: string, filePath: string | null) => {
    showConfirm({
      title: 'Delete Material',
      message: 'Are you sure you want to delete this material? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Delete file from storage if exists
          if (filePath) {
            await supabase.storage
              .from('class-materials')
              .remove([filePath])
          }

          const { error } = await supabase
            .from('class_materials')
            .delete()
            .eq('id', materialId)

          if (error) throw error

          await fetchMaterials()
          showSuccess('Success', 'Material deleted successfully!')
        } catch (error) {
          console.error('Error deleting material:', error)
          showError('Error', 'Failed to delete material')
        }
      }
    })
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      material_type: 'document',
      link_url: '',
      file: null
    })
  }

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-6 h-6" />
      case 'video':
        return <Video className="w-6 h-6" />
      case 'link':
        return <LinkIcon className="w-6 h-6" />
      default:
        return <FileText className="w-6 h-6" />
    }
  }

  const getMaterialColor = (type: string) => {
    switch (type) {
      case 'document':
        return 'bg-samsung-blue'
      case 'video':
        return 'bg-samsung-purple'
      case 'link':
        return 'bg-samsung-cyan'
      default:
        return 'bg-samsung-teal'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-samsung-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="glass-card p-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-xl bg-samsung-blue/10 flex items-center justify-center hover:bg-samsung-blue/20 transition-colors"
              >
                <svg className="w-5 h-5 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl samsung-heading text-gray-900">{classInfo?.name} - Materials</h1>
                <p className="mt-1 samsung-body text-gray-600">
                  Manage learning materials for this class
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300"
            >
              <Upload className="w-4 h-4" />
              Add Material
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-samsung-blue rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl samsung-heading text-gray-900">
                    {materials.filter(m => m.material_type === 'document').length}
                  </div>
                  <div className="text-sm samsung-body text-gray-600">Documents</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-samsung-purple rounded-2xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl samsung-heading text-gray-900">
                    {materials.filter(m => m.material_type === 'video').length}
                  </div>
                  <div className="text-sm samsung-body text-gray-600">Videos</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-samsung-cyan rounded-2xl flex items-center justify-center">
                  <LinkIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl samsung-heading text-gray-900">
                    {materials.filter(m => m.material_type === 'link').length}
                  </div>
                  <div className="text-sm samsung-body text-gray-600">Links</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-samsung-teal rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl samsung-heading text-gray-900">{materials.length}</div>
                  <div className="text-sm samsung-body text-gray-600">Total Materials</div>
                </div>
              </div>
            </div>
          </div>

          {/* Materials Grid */}
          {materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => (
                <div key={material.id} className="glass-card p-6 hover:shadow-samsung-float transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${getMaterialColor(material.material_type)} flex items-center justify-center text-white`}>
                      {getMaterialIcon(material.material_type)}
                    </div>
                    <div className="flex gap-2">
                      {material.file_url && (
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue hover:text-white transition-all duration-300"
                        >
                          {material.material_type === 'link' ? (
                            <ExternalLink className="w-4 h-4" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </a>
                      )}
                      <button
                        onClick={() => handleDeleteMaterial(material.id, material.file_path)}
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg samsung-heading text-gray-900 mb-2">{material.title}</h3>
                  
                  {material.description && (
                    <p className="samsung-body text-gray-600 text-sm mb-4 line-clamp-2">
                      {material.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs samsung-body text-gray-500">
                    <span className="px-3 py-1 rounded-xl bg-samsung-blue/10 text-samsung-blue">
                      {material.material_type}
                    </span>
                    <span>{new Date(material.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card py-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-samsung-blue/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-samsung-blue" />
                </div>
                <h3 className="text-lg samsung-heading text-gray-900 mb-2">No materials yet</h3>
                <p className="samsung-body text-gray-500 mb-4">Add learning materials for students in this class</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300"
                >
                  <Upload className="w-4 h-4" />
                  Add Material
                </button>
              </div>
            </div>
          )}

          {/* Upload Modal */}
          <AnimatePresence>
            {showUploadModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => {
                  setShowUploadModal(false)
                  resetForm()
                }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="glass-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="px-8 py-6 border-b-2 border-samsung-gray-100">
                    <h3 className="text-xl samsung-heading text-gray-900">Add Material</h3>
                  </div>

                  <div className="px-8 py-6 space-y-6">
                    <div>
                      <label className="block text-sm samsung-body text-gray-700 mb-2">
                        Material Type *
                      </label>
                      <select
                        value={formData.material_type}
                        onChange={(e) => setFormData({ ...formData, material_type: e.target.value as 'document' | 'video' | 'link' | 'other' })}
                        className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                      >
                        <option value="document">Document</option>
                        <option value="video">Video</option>
                        <option value="link">Link</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm samsung-body text-gray-700 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                        placeholder="e.g., Lecture Notes Chapter 1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm samsung-body text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                        placeholder="Brief description of the material"
                      />
                    </div>

                    {formData.material_type === 'link' ? (
                      <div>
                        <label className="block text-sm samsung-body text-gray-700 mb-2">
                          URL *
                        </label>
                        <input
                          type="url"
                          value={formData.link_url}
                          onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                          className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                          placeholder="https://example.com"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm samsung-body text-gray-700 mb-2">
                          File
                        </label>
                        <input
                          type="file"
                          onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                          className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:samsung-body file:bg-samsung-blue/10 file:text-samsung-blue hover:file:bg-samsung-blue/20 transition-all duration-300"
                        />
                      </div>
                    )}
                  </div>

                  <div className="px-8 py-6 border-t-2 border-samsung-gray-100 flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowUploadModal(false)
                        resetForm()
                      }}
                      className="px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue/20 transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFileUpload}
                      disabled={!formData.title || uploading || (formData.material_type === 'link' ? !formData.link_url : false)}
                      className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Uploading...
                        </>
                      ) : (
                        'Add Material'
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
