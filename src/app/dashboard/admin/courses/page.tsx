'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { AuthGate } from '@/components/AuthGate'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { supabase, Course } from '@/lib/supabase'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AdminPageHeader,
  AdminStatCard,
  AdminSearchInput,
  AdminLoadingSpinner,
  AdminEmptyState,
  AdminActionButton,
} from '@/components/admin/AdminComponents'
import { BookOpen, Plus, Edit, Trash2, Calendar, FileText, FolderOpen, ArrowUpDown } from 'lucide-react'

type AdminCourseListItem = Pick<Course, 'id' | 'title' | 'description' | 'created_at'>

export default function AdminCoursesPage() {
  const { profile } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const { showConfirm } = useConfirmDialog()
  const [courses, setCourses] = useState<AdminCourseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const userId = profile?.id
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc'>('newest')

  // Fetch once when auth is ready; avoid depending on router (can be unstable across renders)
  useEffect(() => {
    if (!userId) return

    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, description, created_at')
          .order('created_at', { ascending: false })

        if (error) throw error
        if (!cancelled) setCourses(data || [])
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => {
      cancelled = true
    }
  }, [userId])

  // Note: fetchCourses inlined into effect above to keep stable deps

  const deleteCourse = useCallback((courseId: string) => {
    showConfirm({
      title: 'Delete Course',
      message: 'Are you sure you want to delete this course? This will also delete all modules, topics, and tasks within it.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', courseId)

          if (error) throw error

          setCourses(prev => prev.filter(course => course.id !== courseId))
          showSuccess('Course Deleted', 'Course has been deleted successfully!')
        } catch (error) {
          console.error('Error deleting course:', error)
          showError('Delete Failed', 'Error deleting course')
        }
      }
    })
  }, [showConfirm, showSuccess, showError])

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = !q
      ? courses
      : courses.filter(c =>
          (c.title || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q)
        )

    list = [...list]
    switch (sort) {
      case 'oldest':
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'title-asc':
        list.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        break
      case 'title-desc':
        list.sort((a, b) => (b.title || '').localeCompare(a.title || ''))
        break
      case 'newest':
      default:
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }
    return list
  }, [courses, search, sort])

  const formatDate = useCallback((iso: string) => {
    try {
      return new Date(iso).toLocaleDateString()
    } catch {
      return ''
    }
  }, [])

  // Role gating handled by ProtectedRoute wrapper below

  return (
    <AuthGate requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <AdminPageHeader
            title="Course Management"
            description="Create, organize, and maintain your course catalog with modules and topics."
            icon={BookOpen}
            iconColor="bg-gradient-to-br from-samsung-cyan to-teal-600"
            breadcrumbs={[{ label: 'Courses' }]}
            actions={
              <Link href="/dashboard/admin/courses/new">
                <AdminActionButton variant="primary" icon={Plus}>
                  New Course
                </AdminActionButton>
              </Link>
            }
          />

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <AdminStatCard
              title="Total Courses"
              value={courses.length}
              subtitle="In your catalog"
              icon={BookOpen}
              iconColor="bg-gradient-to-br from-samsung-blue to-blue-600"
              delay={0}
            />
            <AdminStatCard
              title="Recent Courses"
              value={courses.filter(c => {
                const created = new Date(c.created_at)
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                return created > weekAgo
              }).length}
              subtitle="Added this week"
              icon={Calendar}
              iconColor="bg-gradient-to-br from-samsung-cyan to-teal-600"
              delay={1}
            />
            <AdminStatCard
              title="Courses with Description"
              value={courses.filter(c => c.description && c.description.length > 0).length}
              subtitle="Have content details"
              icon={FileText}
              iconColor="bg-gradient-to-br from-samsung-purple to-purple-600"
              delay={2}
            />
          </motion.div>

          {/* Search & Sort Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5 rounded-2xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <AdminSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search courses by title or description..."
                className="md:w-80"
              />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  <select
                    value={sort}
                    onChange={e => setSort(e.target.value as 'newest' | 'oldest' | 'title-asc' | 'title-desc')}
                    className="px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white samsung-body text-gray-900 focus:border-samsung-blue focus:ring-2 focus:ring-samsung-blue/20 transition-all"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title-asc">Title A–Z</option>
                    <option value="title-desc">Title Z–A</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Course Grid */}
          {loading ? (
            <AdminLoadingSpinner size="lg" />
          ) : filteredSorted.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <AdminEmptyState
                icon={BookOpen}
                title="No courses found"
                description={courses.length === 0 
                  ? "Get started by creating your first course." 
                  : "Try adjusting your search or sort options."
                }
                action={courses.length === 0 ? {
                  label: "Create Course",
                  onClick: () => window.location.href = '/dashboard/admin/courses/new',
                  icon: Plus
                } : undefined}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {filteredSorted.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="glass-card rounded-2xl overflow-hidden group"
                  >
                    {/* Card Header with gradient */}
                    <div className="h-2 bg-gradient-to-r from-samsung-cyan to-samsung-blue" />
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-samsung-cyan/10 to-samsung-blue/10 flex items-center justify-center flex-shrink-0">
                            <FolderOpen className="w-5 h-5 text-samsung-cyan" />
                          </div>
                          <div>
                            <h3 className="text-lg samsung-heading text-gray-900 line-clamp-2 group-hover:text-samsung-blue transition-colors">
                              {course.title || 'Untitled Course'}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(course.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {course.description ? (
                        <p className="text-sm samsung-body text-gray-600 mb-4 line-clamp-3">
                          {course.description}
                        </p>
                      ) : (
                        <p className="text-sm samsung-body text-gray-400 italic mb-4">
                          No description provided
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        <Link
                          href={`/dashboard/admin/courses/${course.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm samsung-body font-medium bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue hover:text-white transition-all duration-300"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm samsung-body font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-300"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </DashboardLayout>
    </AuthGate>
  )
}
