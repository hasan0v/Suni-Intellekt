'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AdminPageHeader,
  AdminStatCard,
  AdminActionButton,
  AdminSearchInput,
  AdminFilterTabs,
  AdminLoadingSpinner,
  AdminEmptyState,
  AdminModal,
  AdminIcons,
} from '@/components/admin/AdminComponents'
import { 
  FileText, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  User,
  Code,
  Monitor,
  Laptop,
  MessageSquare,
  Calendar,
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react'

interface Application {
  id: string
  full_name: string
  email: string
  phone_number: string
  programming_experience: string
  development_environment: string
  computer_type: string
  motivation: string
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'contacted'
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

const statusConfig = {
  pending: { 
    label: 'Gözləyir', 
    color: 'bg-amber-100 text-amber-700 ring-amber-600/20',
    icon: Clock 
  },
  reviewed: { 
    label: 'Baxılıb', 
    color: 'bg-blue-100 text-blue-700 ring-blue-600/20',
    icon: Eye 
  },
  accepted: { 
    label: 'Qəbul', 
    color: 'bg-green-100 text-green-700 ring-green-600/20',
    icon: CheckCircle 
  },
  rejected: { 
    label: 'Rədd', 
    color: 'bg-red-100 text-red-700 ring-red-600/20',
    icon: XCircle 
  },
  contacted: { 
    label: 'Əlaqə saxlanıb', 
    color: 'bg-purple-100 text-purple-700 ring-purple-600/20',
    icon: Phone 
  },
}

const experienceLabels: Record<string, string> = {
  none: 'Heç yoxdur',
  beginner: 'Başlanğıc',
  intermediate: 'Orta',
  professional: 'Peşəkar'
}

const computerLabels: Record<string, string> = {
  laptop: 'Laptop',
  desktop_medium: 'Desktop (orta)',
  desktop_powerful: 'Desktop (güclü)',
  not_sure: 'Əmin deyil'
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('course_applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: Application['status'], notes?: string) => {
    setUpdating(true)
    try {
      const updateData: Partial<Application> = {
        status,
        reviewed_at: new Date().toISOString(),
      }
      
      if (notes !== undefined) {
        updateData.admin_notes = notes
      }

      const { error } = await supabase
        .from('course_applications')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      setApplications(prev => 
        prev.map(app => 
          app.id === id 
            ? { ...app, ...updateData }
            : app
        )
      )

      if (selectedApplication?.id === id) {
        setSelectedApplication(prev => prev ? { ...prev, ...updateData } : null)
      }
    } catch (error) {
      console.error('Error updating application:', error)
    } finally {
      setUpdating(false)
    }
  }

  const deleteApplication = async (id: string) => {
    if (!confirm('Bu müraciəti silmək istədiyinizə əminsiniz?')) return

    try {
      const { error } = await supabase
        .from('course_applications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setApplications(prev => prev.filter(app => app.id !== id))
      setIsModalOpen(false)
      setSelectedApplication(null)
    } catch (error) {
      console.error('Error deleting application:', error)
    }
  }

  const exportToCSV = () => {
    const headers = ['Ad Soyad', 'Email', 'Telefon', 'Təcrübə', 'Environment', 'Kompüter', 'Motivasiya', 'Status', 'Tarix']
    const rows = filteredApplications.map(app => [
      app.full_name,
      app.email,
      app.phone_number,
      experienceLabels[app.programming_experience] || app.programming_experience,
      app.development_environment,
      computerLabels[app.computer_type] || app.computer_type,
      `"${app.motivation.replace(/"/g, '""')}"`,
      statusConfig[app.status]?.label || app.status,
      new Date(app.created_at).toLocaleDateString('az-AZ')
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `applications_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone_number.includes(searchQuery)

    const matchesTab = activeTab === 'all' || app.status === activeTab

    return matchesSearch && matchesTab
  })

  // Stats
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  const tabs = [
    { key: 'all', label: 'Hamısı', count: stats.total },
    { key: 'pending', label: 'Gözləyir', count: stats.pending },
    { key: 'accepted', label: 'Qəbul', count: stats.accepted },
    { key: 'contacted', label: 'Əlaqə', count: applications.filter(a => a.status === 'contacted').length },
    { key: 'rejected', label: 'Rədd', count: stats.rejected },
  ]

  const openDetailModal = (app: Application) => {
    setSelectedApplication(app)
    setAdminNotes(app.admin_notes || '')
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <AdminLoadingSpinner size="lg" />
      </DashboardLayout>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <AdminPageHeader
            title="Kurs Müraciətləri"
            description="Kursa müraciət edən namizədləri idarə edin"
            icon={FileText}
            iconColor="bg-gradient-to-br from-purple-500 to-purple-600"
            actions={
              <div className="flex gap-3">
                <AdminActionButton
                  variant="secondary"
                  icon={RefreshCw}
                  onClick={fetchApplications}
                >
                  Yenilə
                </AdminActionButton>
                <AdminActionButton
                  variant="primary"
                  icon={Download}
                  onClick={exportToCSV}
                >
                  CSV Export
                </AdminActionButton>
              </div>
            }
          />

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <AdminStatCard
              title="Cəmi Müraciət"
              value={stats.total}
              icon={FileText}
              iconColor="bg-gradient-to-br from-blue-500 to-blue-600"
              delay={0}
            />
            <AdminStatCard
              title="Gözləyir"
              value={stats.pending}
              icon={Clock}
              iconColor="bg-gradient-to-br from-amber-500 to-amber-600"
              delay={1}
            />
            <AdminStatCard
              title="Qəbul edilib"
              value={stats.accepted}
              icon={CheckCircle}
              iconColor="bg-gradient-to-br from-green-500 to-green-600"
              delay={2}
            />
            <AdminStatCard
              title="Rədd edilib"
              value={stats.rejected}
              icon={XCircle}
              iconColor="bg-gradient-to-br from-red-500 to-red-600"
              delay={3}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <AdminFilterTabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
            <AdminSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Ad, email və ya telefon axtar..."
              className="w-full sm:w-80"
            />
          </div>

          {/* Applications List */}
          {filteredApplications.length === 0 ? (
            <AdminEmptyState
              icon={FileText}
              title="Müraciət tapılmadı"
              description={searchQuery ? "Axtarış nəticəsi tapılmadı" : "Hələ heç bir müraciət yoxdur"}
            />
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app, index) => {
                const StatusIcon = statusConfig[app.status]?.icon || Clock
                const isExpanded = expandedId === app.id

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card rounded-2xl overflow-hidden"
                  >
                    {/* Main Row */}
                    <div 
                      className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                              {app.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{app.full_name}</h3>
                              <p className="text-sm text-gray-500">{app.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Status & Date */}
                        <div className="flex items-center gap-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ring-1 ring-inset ${statusConfig[app.status]?.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig[app.status]?.label}
                          </span>
                          <span className="text-sm text-gray-500 hidden sm:block">
                            {new Date(app.created_at).toLocaleDateString('az-AZ')}
                          </span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-6 pb-6 border-t border-gray-100 pt-4">
                            {/* Quick Info Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{app.phone_number}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Code className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{experienceLabels[app.programming_experience]}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Monitor className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{app.development_environment}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Laptop className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{computerLabels[app.computer_type]}</span>
                              </div>
                            </div>

                            {/* Motivation */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <MessageSquare className="w-4 h-4" />
                                Motivasiya
                              </div>
                              <p className="text-gray-600 text-sm">{app.motivation}</p>
                            </div>

                            {/* Admin Notes */}
                            {app.admin_notes && (
                              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                                  <FileText className="w-4 h-4" />
                                  Admin Qeydləri
                                </div>
                                <p className="text-blue-600 text-sm">{app.admin_notes}</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                              <AdminActionButton
                                variant="primary"
                                size="sm"
                                icon={Eye}
                                onClick={() => openDetailModal(app)}
                              >
                                Ətraflı
                              </AdminActionButton>
                              {app.status === 'pending' && (
                                <>
                                  <AdminActionButton
                                    variant="success"
                                    size="sm"
                                    icon={CheckCircle}
                                    onClick={() => updateStatus(app.id, 'accepted')}
                                    loading={updating}
                                  >
                                    Qəbul
                                  </AdminActionButton>
                                  <AdminActionButton
                                    variant="warning"
                                    size="sm"
                                    icon={Phone}
                                    onClick={() => updateStatus(app.id, 'contacted')}
                                    loading={updating}
                                  >
                                    Əlaqə
                                  </AdminActionButton>
                                  <AdminActionButton
                                    variant="danger"
                                    size="sm"
                                    icon={XCircle}
                                    onClick={() => updateStatus(app.id, 'rejected')}
                                    loading={updating}
                                  >
                                    Rədd
                                  </AdminActionButton>
                                </>
                              )}
                              <AdminActionButton
                                variant="secondary"
                                size="sm"
                                icon={Trash2}
                                onClick={() => deleteApplication(app.id)}
                              >
                                Sil
                              </AdminActionButton>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Detail Modal */}
          <AdminModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Müraciət Detalları"
            description={selectedApplication?.full_name}
            size="lg"
            footer={
              <>
                <AdminActionButton
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Bağla
                </AdminActionButton>
                <AdminActionButton
                  variant="primary"
                  icon={Send}
                  onClick={() => {
                    if (selectedApplication) {
                      updateStatus(selectedApplication.id, selectedApplication.status, adminNotes)
                    }
                  }}
                  loading={updating}
                >
                  Yadda Saxla
                </AdminActionButton>
              </>
            }
          >
            {selectedApplication && (
              <div className="space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ad Soyad</label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{selectedApplication.full_name}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${selectedApplication.email}`} className="text-blue-600 hover:underline">
                        {selectedApplication.email}
                      </a>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefon</label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${selectedApplication.phone_number}`} className="text-blue-600 hover:underline">
                        {selectedApplication.phone_number}
                      </a>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Müraciət Tarixi</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(selectedApplication.created_at).toLocaleString('az-AZ')}</span>
                    </div>
                  </div>
                </div>

                {/* Technical Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Proqramlaşdırma Təcrübəsi</label>
                    <p className="font-medium">{experienceLabels[selectedApplication.programming_experience]}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Development Environment</label>
                    <p className="font-medium">{selectedApplication.development_environment}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kompüter</label>
                    <p className="font-medium">{computerLabels[selectedApplication.computer_type]}</p>
                  </div>
                </div>

                {/* Motivation */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Motivasiya</label>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <p className="text-gray-700">{selectedApplication.motivation}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusConfig).map(([key, config]) => {
                      const Icon = config.icon
                      const isActive = selectedApplication.status === key
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedApplication(prev => 
                              prev ? { ...prev, status: key as Application['status'] } : null
                            )
                          }}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            isActive 
                              ? config.color + ' ring-2' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {config.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Admin Qeydləri</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Qeydlərinizi buraya yazın..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  />
                </div>
              </div>
            )}
          </AdminModal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
