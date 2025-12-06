'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AdminPageHeader,
  AdminStatCard,
  AdminQuickAction,
  AdminLoadingSpinner,
  AdminIcons,
} from '@/components/admin/AdminComponents'
import { 
  LayoutDashboard, 
  TrendingUp, 
  AlertCircle,
  Sparkles,
  FileText,
  ToggleLeft,
  ToggleRight,
  Globe
} from 'lucide-react'

interface DashboardStats {
  totalCourses: number
  totalTasks: number
  totalSubmissions: number
  pendingGrading: number
  totalStudents: number
  totalClasses: number
  activeClasses: number
  recentSubmissions: number
  pendingApplications: number
  totalApplications: number
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalTasks: 0,
    totalSubmissions: 0,
    pendingGrading: 0,
    totalStudents: 0,
    totalClasses: 0,
    activeClasses: 0,
    recentSubmissions: 0,
    pendingApplications: 0,
    totalApplications: 0,
  })
  const [loading, setLoading] = useState(true)
  const [registrationEnabled, setRegistrationEnabled] = useState(false)
  const [togglingRegistration, setTogglingRegistration] = useState(false)

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchStats()
      fetchRegistrationStatus()
    }
  }, [profile])

  const fetchRegistrationStatus = async () => {
    try {
      const res = await fetch('/api/settings?key=registration_enabled')
      const data = await res.json()
      setRegistrationEnabled(data.value?.enabled === true)
    } catch (error) {
      console.error('Error fetching registration status:', error)
    }
  }

  const toggleRegistration = async () => {
    setTogglingRegistration(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'registration_enabled',
          value: { enabled: !registrationEnabled }
        })
      })
      
      if (res.ok) {
        setRegistrationEnabled(!registrationEnabled)
      }
    } catch (error) {
      console.error('Error toggling registration:', error)
    } finally {
      setTogglingRegistration(false)
    }
  }

  const fetchStats = async () => {
    try {
      const [
        coursesResult,
        tasksResult,
        submissionsResult,
        pendingResult,
        studentsResult,
        classesResult,
        activeClassesResult,
        recentSubmissionsResult,
        pendingApplicationsResult,
        totalApplicationsResult,
      ] = await Promise.all([
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('task_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('task_submissions')
          .select('*', { count: 'exact', head: true })
          .is('grade', null),
        supabase.from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student'),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase.from('task_submissions')
          .select('*', { count: 'exact', head: true })
          .gte('submitted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('course_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase.from('course_applications').select('*', { count: 'exact', head: true }),
      ])

      setStats({
        totalCourses: coursesResult.count || 0,
        totalTasks: tasksResult.count || 0,
        totalSubmissions: submissionsResult.count || 0,
        pendingGrading: pendingResult.count || 0,
        totalStudents: studentsResult.count || 0,
        totalClasses: classesResult.count || 0,
        activeClasses: activeClassesResult.count || 0,
        recentSubmissions: recentSubmissionsResult.count || 0,
        pendingApplications: pendingApplicationsResult.count || 0,
        totalApplications: totalApplicationsResult.count || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
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
        <div className="space-y-8">
          {/* Header */}
          <AdminPageHeader
            title="Admin Dashboard"
            description="Welcome back! Here's an overview of your learning management system."
            icon={LayoutDashboard}
            iconColor="bg-gradient-to-br from-amber-500 to-orange-600"
            showAdminBadge={true}
          />

          {/* Quick Stats Overview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <AdminStatCard
              title="Total Courses"
              value={stats.totalCourses}
              subtitle="Available courses"
              icon={AdminIcons.courses}
              iconColor="bg-gradient-to-br from-samsung-blue to-blue-600"
              delay={0}
            />
            <AdminStatCard
              title="Total Tasks"
              value={stats.totalTasks}
              subtitle="Assignments created"
              icon={AdminIcons.tasks}
              iconColor="bg-gradient-to-br from-samsung-cyan to-teal-600"
              delay={1}
            />
            <AdminStatCard
              title="Submissions"
              value={stats.totalSubmissions}
              subtitle={`${stats.recentSubmissions} this week`}
              icon={AdminIcons.file}
              iconColor="bg-gradient-to-br from-samsung-purple to-purple-600"
              delay={2}
            />
            <AdminStatCard
              title="Pending Grading"
              value={stats.pendingGrading}
              subtitle={stats.pendingGrading > 0 ? 'Needs attention' : 'All caught up!'}
              icon={AdminIcons.pending}
              iconColor={stats.pendingGrading > 0 
                ? "bg-gradient-to-br from-amber-500 to-orange-600" 
                : "bg-gradient-to-br from-green-500 to-emerald-600"
              }
              delay={3}
            />
          </motion.div>

          {/* Secondary Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <AdminStatCard
              title="Total Students"
              value={stats.totalStudents}
              subtitle="Registered students"
              icon={AdminIcons.students}
              iconColor="bg-gradient-to-br from-indigo-500 to-indigo-600"
              delay={4}
            />
            <AdminStatCard
              title="Classes"
              value={stats.totalClasses}
              subtitle={`${stats.activeClasses} active`}
              icon={AdminIcons.classes}
              iconColor="bg-gradient-to-br from-pink-500 to-rose-600"
              delay={5}
            />
            <AdminStatCard
              title="Recent Activity"
              value={stats.recentSubmissions}
              subtitle="Submissions in 7 days"
              icon={AdminIcons.activity}
              iconColor="bg-gradient-to-br from-green-500 to-emerald-600"
              delay={6}
            />
          </motion.div>

          {/* Alert Banner (if pending applications) */}
          {stats.pendingApplications > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-gradient-to-r from-purple-50 to-violet-50 border-2 border-purple-200 rounded-2xl p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="samsung-heading text-purple-800">
                    {stats.pendingApplications} yeni kurs müraciəti gözləyir
                  </h3>
                  <p className="text-sm samsung-body text-purple-700 mt-0.5">
                    Namizədlər cavab gözləyir. Müraciətləri nəzərdən keçirin.
                  </p>
                </div>
                <motion.a
                  href="/dashboard/admin/applications"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl samsung-body font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  Bax
                </motion.a>
              </div>
            </motion.div>
          )}

          {/* Alert Banner (if pending grading) */}
          {stats.pendingGrading > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="samsung-heading text-amber-800">
                    You have {stats.pendingGrading} submission{stats.pendingGrading !== 1 ? 's' : ''} waiting for review
                  </h3>
                  <p className="text-sm samsung-body text-amber-700 mt-0.5">
                    Students are waiting for feedback. Check the Tasks section to grade submissions.
                  </p>
                </div>
                <motion.a
                  href="/dashboard/admin/tasks"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl samsung-body font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  Grade Now
                </motion.a>
              </div>
            </motion.div>
          )}

          {/* Quick Actions Section */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-samsung-blue/10 to-samsung-cyan/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-samsung-blue" />
              </div>
              <div>
                <h2 className="text-xl samsung-heading text-gray-900">Quick Actions</h2>
                <p className="text-sm samsung-body text-gray-500">Jump to frequently used sections</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AdminQuickAction
                title="Manage Users"
                description="View and manage student and admin accounts"
                icon={AdminIcons.users}
                iconColor="bg-gradient-to-br from-blue-500 to-blue-600"
                href="/dashboard/admin/users"
                badge={stats.totalStudents}
                delay={0}
              />
              <AdminQuickAction
                title="Manage Courses"
                description="Create, edit, and organize course content"
                icon={AdminIcons.courses}
                iconColor="bg-gradient-to-br from-samsung-cyan to-teal-500"
                href="/dashboard/admin/courses"
                badge={stats.totalCourses}
                delay={1}
              />
              <AdminQuickAction
                title="Manage Tasks"
                description="Create assignments and grade submissions"
                icon={AdminIcons.tasks}
                iconColor="bg-gradient-to-br from-samsung-purple to-purple-600"
                href="/dashboard/admin/tasks"
                badge={stats.pendingGrading > 0 ? `${stats.pendingGrading} pending` : undefined}
                delay={2}
              />
              <AdminQuickAction
                title="Student Rankings"
                description="View performance leaderboards and statistics"
                icon={AdminIcons.rankings}
                iconColor="bg-gradient-to-br from-amber-500 to-orange-500"
                href="/dashboard/admin/rankings"
                delay={3}
              />
              <AdminQuickAction
                title="Class Management"
                description="Manage classes, enrollments, and schedules"
                icon={AdminIcons.classes}
                iconColor="bg-gradient-to-br from-pink-500 to-rose-500"
                href="/dashboard/admin/classes"
                badge={stats.activeClasses}
                delay={4}
              />
              <AdminQuickAction
                title="Kurs Mürəciətləri"
                description="Kursa mürəciət edən namizədləri idarə edin"
                icon={FileText}
                iconColor="bg-gradient-to-br from-purple-500 to-purple-600"
                href="/dashboard/admin/applications"
                badge={stats.pendingApplications > 0 ? `${stats.pendingApplications} gözləyir` : stats.totalApplications}
                delay={5}
              />
              <AdminQuickAction
                title="Storage Setup"
                description="Configure Supabase storage for file uploads"
                icon={AdminIcons.database}
                iconColor="bg-gradient-to-br from-gray-600 to-gray-700"
                href="/dashboard/admin/setup-storage"
                delay={6}
              />
            </div>
          </div>

          {/* Site Settings */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl samsung-heading text-gray-900">Sayt Parametrləri</h2>
                <p className="text-sm samsung-body text-gray-500">Landing səhifə tənzimləmələri</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  registrationEnabled 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  {registrationEnabled ? (
                    <ToggleRight className="w-6 h-6 text-white" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="samsung-heading text-gray-900">Qeydiyyat Düyməsi</h3>
                  <p className="text-sm samsung-body text-gray-500">
                    {registrationEnabled 
                      ? 'Landing səhifədə qeydiyyat düyməsi görünür' 
                      : 'Landing səhifədə qeydiyyat düyməsi gizlidir'
                    }
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleRegistration}
                disabled={togglingRegistration}
                className={`px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${
                  registrationEnabled
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {togglingRegistration ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Yüklənir...
                  </span>
                ) : registrationEnabled ? (
                  'Deaktiv Et'
                ) : (
                  'Aktiv Et'
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* System Status Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="samsung-body text-gray-600">System Status: <span className="text-green-600 font-medium">All systems operational</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm samsung-body text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
