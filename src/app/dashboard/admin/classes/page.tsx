'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Class {
  id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: 'active' | 'completed' | 'archived'
  created_at: string
  _count?: {
    enrollments: number
    courses: number
  }
}

interface Course {
  id: string
  title: string
}

interface Student {
  id: string
  full_name: string
  email?: string
  study_mode?: 'offline' | 'online' | 'self_study'
}

// Study mode order for sorting: offline first, then online, then self_study
const STUDY_MODE_ORDER = { offline: 0, online: 1, self_study: 2 }

const getStudyModeBadge = (mode: string) => {
  switch (mode) {
    case 'offline':
      return { label: 'Offline', color: 'bg-green-100 text-green-800', icon: '🏫' }
    case 'online':
      return { label: 'Online', color: 'bg-blue-100 text-blue-800', icon: '💻' }
    case 'self_study':
      return { label: 'Self Study', color: 'bg-purple-100 text-purple-800', icon: '📚' }
    default:
      return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: '❓' }
  }
}

export default function AdminClassesPage() {
  const { user, profile } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const { showConfirm } = useConfirmDialog()
  const [classes, setClasses] = useState<Class[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [creating, setCreating] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active' as 'active' | 'completed' | 'archived'
  })

  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([])
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([])
  const [showManageEnrollmentsModal, setShowManageEnrollmentsModal] = useState(false)
  const [showManageCoursesModal, setShowManageCoursesModal] = useState(false)
  const [showAssignCoursesModal, setShowAssignCoursesModal] = useState(false)
  const [newStudentStudyMode, setNewStudentStudyMode] = useState<'offline' | 'online' | 'self_study'>('offline')
  const [studyModeFilter, setStudyModeFilter] = useState<'all' | 'offline' | 'online' | 'self_study'>('all')

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchClasses()
      fetchCourses()
      fetchStudents()
    }
  }, [profile])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get counts for each class
      const classesWithCounts = await Promise.all(
        (data || []).map(async (cls) => {
          const [enrollments, courses] = await Promise.all([
            supabase
              .from('class_enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', cls.id)
              .eq('status', 'active'),
            supabase
              .from('class_courses')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', cls.id)
          ])

          return {
            ...cls,
            _count: {
              enrollments: enrollments.count || 0,
              courses: courses.count || 0
            }
          }
        })
      )

      setClasses(classesWithCounts)
    } catch (error) {
      console.error('Error fetching classes:', error)
      showError('Error', 'Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .order('title')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('role', 'student')
        .order('full_name')

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleCreateClass = async () => {
    if (!formData.name || !user) return

    setCreating(true)
    try {
      const { error } = await supabase
        .from('classes')
        .insert([{
          name: formData.name,
          description: formData.description || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          status: formData.status,
          created_by: user.id
        }])

      if (error) throw error

      await fetchClasses()
      resetForm()
      setShowCreateModal(false)
      showSuccess('Success', 'Class created successfully!')
    } catch (error) {
      console.error('Error creating class:', error)
      showError('Error', 'Failed to create class')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateClass = async () => {
    if (!editingClass || !formData.name) return

    setCreating(true)
    try {
      const { error } = await supabase
        .from('classes')
        .update({
          name: formData.name,
          description: formData.description || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          status: formData.status
        })
        .eq('id', editingClass.id)

      if (error) throw error

      await fetchClasses()
      resetForm()
      setEditingClass(null)
      showSuccess('Success', 'Class updated successfully!')
    } catch (error) {
      console.error('Error updating class:', error)
      showError('Error', 'Failed to update class')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteClass = async (classId: string) => {
    showConfirm({
      title: 'Delete Class',
      message: 'Are you sure you want to delete this class? This will remove all enrollments and course assignments.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', classId)

          if (error) throw error
          await fetchClasses()
          showSuccess('Success', 'Class deleted successfully!')
        } catch (error) {
          console.error('Error deleting class:', error)
          showError('Error', 'Failed to delete class')
        }
      }
    })
  }

  const fetchEnrolledStudents = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('class_enrollments')
        .select('user_id, study_mode')
        .eq('class_id', classId)
        .eq('status', 'active')

      if (error) throw error

      // Map enrollments to include study_mode
      const enrollmentMap = new Map(data?.map(e => [e.user_id, e.study_mode || 'offline']) || [])
      const enrolledIds = data?.map(e => e.user_id) || []
      
      // Get enrolled students with their study modes and sort by study mode
      const enrolled = students
        .filter(s => enrolledIds.includes(s.id))
        .map(s => ({ ...s, study_mode: enrollmentMap.get(s.id) as 'offline' | 'online' | 'self_study' }))
        .sort((a, b) => {
          const orderA = STUDY_MODE_ORDER[a.study_mode || 'offline']
          const orderB = STUDY_MODE_ORDER[b.study_mode || 'offline']
          if (orderA !== orderB) return orderA - orderB
          return a.full_name.localeCompare(b.full_name)
        })
      
      setEnrolledStudents(enrolled)
    } catch (error) {
      console.error('Error fetching enrolled students:', error)
      setEnrolledStudents([])
    }
  }

  const fetchAssignedCourses = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('class_courses')
        .select('course_id')
        .eq('class_id', classId)

      if (error) throw error

      const courseIds = (data || []).map(assignment => assignment.course_id)
      const assigned = courses.filter(c => courseIds.includes(c.id))
      setAssignedCourses(assigned)
      setSelectedCourses(courseIds)
    } catch (error) {
      console.error('Error fetching assigned courses:', error)
      setAssignedCourses([])
      setSelectedCourses([])
    }
  }

  const handleEnrollStudents = async () => {
    if (!selectedClass || selectedStudents.length === 0) return

    setCreating(true)
    try {
      const enrollments = selectedStudents.map(studentId => ({
        class_id: selectedClass.id,
        user_id: studentId,
        status: 'active',
        study_mode: newStudentStudyMode
      }))

      const { error } = await supabase
        .from('class_enrollments')
        .upsert(enrollments, { onConflict: 'class_id,user_id' })

      if (error) throw error

      await fetchClasses()
      setShowEnrollModal(false)
      setSelectedStudents([])
      setNewStudentStudyMode('offline')
      showSuccess('Success', 'Students enrolled successfully!')
    } catch (error) {
      console.error('Error enrolling students:', error)
      showError('Error', 'Failed to enroll students')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateStudyMode = async (studentId: string, newMode: 'offline' | 'online' | 'self_study') => {
    if (!selectedClass) return

    try {
      const { error } = await supabase
        .from('class_enrollments')
        .update({ study_mode: newMode })
        .eq('class_id', selectedClass.id)
        .eq('user_id', studentId)

      if (error) throw error

      await fetchEnrolledStudents(selectedClass.id)
      showSuccess('Success', 'Study mode updated!')
    } catch (error) {
      console.error('Error updating study mode:', error)
      showError('Error', 'Failed to update study mode')
    }
  }

  const handleUnenrollStudent = async (studentId: string, studentName: string) => {
    if (!selectedClass) return

    showConfirm({
      title: 'Unenroll Student',
      message: `Are you sure you want to unenroll ${studentName} from ${selectedClass.name}?`,
      confirmText: 'Unenroll',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('class_enrollments')
            .delete()
            .eq('class_id', selectedClass.id)
            .eq('user_id', studentId)

          if (error) throw error

          await fetchClasses()
          await fetchEnrolledStudents(selectedClass.id)
          showSuccess('Success', 'Student unenrolled successfully!')
        } catch (error) {
          console.error('Error unenrolling student:', error)
          showError('Error', 'Failed to unenroll student')
        }
      }
    })
  }

  const handleAssignCourses = async () => {
    if (!selectedClass || selectedCourses.length === 0) return

    setCreating(true)
    try {
      const assignments = selectedCourses.map(courseId => ({
        class_id: selectedClass.id,
        course_id: courseId
      }))

      const { error } = await supabase
        .from('class_courses')
        .upsert(assignments, { onConflict: 'class_id,course_id' })

      if (error) throw error

      await fetchClasses()
      setShowAssignCoursesModal(false)
      setSelectedCourses([])
      showSuccess('Success', 'Courses assigned successfully!')
    } catch (error) {
      console.error('Error assigning courses:', error)
      showError('Error', 'Failed to assign courses')
    } finally {
      setCreating(false)
    }
  }

  const handleUnassignCourse = async (courseId: string, courseTitle: string) => {
    if (!selectedClass) return

    showConfirm({
      title: 'Unassign Course',
      message: `Are you sure you want to unassign "${courseTitle}" from this class?`,
      confirmText: 'Unassign',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('class_courses')
            .delete()
            .eq('class_id', selectedClass.id)
            .eq('course_id', courseId)

          if (error) throw error

          await fetchClasses()
          await fetchAssignedCourses(selectedClass.id)
          showSuccess('Success', 'Course unassigned successfully!')
        } catch (error) {
          console.error('Error unassigning course:', error)
          showError('Error', 'Failed to unassign course')
        }
      }
    })
  }

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      description: cls.description || '',
      start_date: cls.start_date || '',
      end_date: cls.end_date || '',
      status: cls.status
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'active'
    })
    setEditingClass(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-samsung-cyan/10 text-samsung-cyan'
      case 'completed':
        return 'bg-samsung-teal/10 text-samsung-teal'
      case 'archived':
        return 'bg-samsung-gray-100 text-gray-600'
      default:
        return 'bg-samsung-gray-100 text-gray-600'
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
              <div className="w-14 h-14 rounded-2xl bg-samsung-blue flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl samsung-heading text-gray-900">Class Management</h1>
                <p className="mt-1 samsung-body text-gray-600">
                  Create and manage classes, enroll students, and assign courses
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300"
            >
              Create Class
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card hover:shadow-samsung-float transition-all duration-500">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-samsung-blue rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm samsung-body text-gray-600 truncate">Total Classes</dt>
                    <dd className="text-2xl samsung-heading text-gray-900 mt-1">{classes.length}</dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card hover:shadow-samsung-float transition-all duration-500">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-samsung-cyan rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm samsung-body text-gray-600 truncate">Active Classes</dt>
                    <dd className="text-2xl samsung-heading text-gray-900 mt-1">
                      {classes.filter(c => c.status === 'active').length}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card hover:shadow-samsung-float transition-all duration-500">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-samsung-purple rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm samsung-body text-gray-600 truncate">Total Enrollments</dt>
                    <dd className="text-2xl samsung-heading text-gray-900 mt-1">
                      {classes.reduce((sum, cls) => sum + (cls._count?.enrollments || 0), 0)}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Classes List */}
          <div className="glass-card overflow-hidden">
            {classes.length > 0 ? (
              <div className="divide-y divide-samsung-gray-100">
                {classes.map((cls) => (
                  <div key={cls.id} className="p-6 hover:bg-samsung-blue/5 transition-colors duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg samsung-heading text-gray-900">{cls.name}</h3>
                          <span className={`px-3 py-1 text-xs samsung-body rounded-xl ${getStatusColor(cls.status)}`}>
                            {cls.status}
                          </span>
                        </div>
                        {cls.description && (
                          <p className="samsung-body text-gray-600 mb-3">{cls.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm samsung-body text-gray-500">
                          {cls.start_date && (
                            <span>Start: {new Date(cls.start_date).toLocaleDateString()}</span>
                          )}
                          {cls.end_date && (
                            <span>End: {new Date(cls.end_date).toLocaleDateString()}</span>
                          )}
                          <span>{cls._count?.enrollments || 0} students</span>
                          <span>{cls._count?.courses || 0} courses</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          href={`/dashboard/admin/classes/${cls.id}/materials`}
                          className="px-4 py-2 rounded-xl text-sm samsung-body bg-samsung-purple/10 text-samsung-purple hover:bg-samsung-purple hover:text-white transition-all duration-300"
                        >
                          Materials
                        </Link>
                        <Link
                          href={`/dashboard/admin/classes/${cls.id}/attendance`}
                          className="px-4 py-2 rounded-xl text-sm samsung-body bg-green-100 text-green-700 hover:bg-green-500 hover:text-white transition-all duration-300"
                        >
                          Attendance
                        </Link>
                        <button
                          onClick={async () => {
                            setSelectedClass(cls)
                            await fetchEnrolledStudents(cls.id)
                            setShowManageEnrollmentsModal(true)
                          }}
                          className="px-4 py-2 rounded-xl text-sm samsung-body bg-samsung-cyan/10 text-samsung-cyan hover:bg-samsung-cyan hover:text-white transition-all duration-300"
                        >
                          Manage Students
                        </button>
                        <button
                          onClick={async () => {
                            setSelectedClass(cls)
                            await fetchAssignedCourses(cls.id)
                            setShowManageCoursesModal(true)
                          }}
                          className="px-4 py-2 rounded-xl text-sm samsung-body bg-samsung-teal/10 text-samsung-teal hover:bg-samsung-teal hover:text-white transition-all duration-300"
                        >
                          Manage Courses
                        </button>
                        <button
                          onClick={() => handleEditClass(cls)}
                          className="px-4 py-2 rounded-xl text-sm samsung-body bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue hover:text-white transition-all duration-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="px-4 py-2 rounded-xl text-sm samsung-body text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-samsung-blue/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg samsung-heading text-gray-900 mb-2">No classes found</h3>
                <p className="samsung-body text-gray-500 mb-4">Create your first class to get started</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300"
                >
                  Create Class
                </button>
              </div>
            )}
          </div>

          {/* Create/Edit Class Modal */}
          <AnimatePresence>
            {(showCreateModal || editingClass) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingClass(null)
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
                    <h3 className="text-xl samsung-heading text-gray-900">
                      {editingClass ? 'Edit Class' : 'Create New Class'}
                    </h3>
                  </div>

                  <div className="px-8 py-6 space-y-6">
                    <div>
                      <label className="block text-sm samsung-body text-gray-700 mb-2">
                        Class Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                        placeholder="e.g., Computer Science 2024"
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
                        placeholder="Brief description of the class"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm samsung-body text-gray-700 mb-2">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm samsung-body text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                          className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm samsung-body text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'completed' | 'archived' })}
                        className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div className="px-8 py-6 border-t-2 border-samsung-gray-100 flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowCreateModal(false)
                        setEditingClass(null)
                        resetForm()
                      }}
                      className="px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue/20 transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingClass ? handleUpdateClass : handleCreateClass}
                      disabled={!formData.name || creating}
                      className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300 disabled:opacity-50"
                    >
                      {creating ? (
                        <>
                          <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          {editingClass ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>{editingClass ? 'Update Class' : 'Create Class'}</>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manage Enrollments Modal */}
          <AnimatePresence>
            {showManageEnrollmentsModal && selectedClass && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => {
                  setShowManageEnrollmentsModal(false)
                  setEnrolledStudents([])
                  setStudyModeFilter('all')
                }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="glass-card rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="px-8 py-6 border-b-2 border-samsung-gray-100">
                    <h3 className="text-xl samsung-heading text-gray-900">
                      Manage Students - {selectedClass.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-sm samsung-body text-gray-600">
                        {enrolledStudents.length} student{enrolledStudents.length !== 1 ? 's' : ''} enrolled
                      </p>
                      {/* Study Mode Stats */}
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                          🏫 {enrolledStudents.filter(s => s.study_mode === 'offline').length}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                          💻 {enrolledStudents.filter(s => s.study_mode === 'online').length}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">
                          📚 {enrolledStudents.filter(s => s.study_mode === 'self_study').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-6">
                    {/* Action buttons and filter */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                      <button
                        onClick={() => {
                          setSelectedStudents(enrolledStudents.map(s => s.id))
                          setShowManageEnrollmentsModal(false)
                          setShowEnrollModal(true)
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Students
                      </button>
                      
                      {/* Filter by Study Mode */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm samsung-body text-gray-600">Filter:</span>
                        <select
                          value={studyModeFilter}
                          onChange={(e) => setStudyModeFilter(e.target.value as 'all' | 'offline' | 'online' | 'self_study')}
                          className="px-3 py-1.5 text-sm border-2 border-samsung-gray-100 rounded-lg samsung-body focus:border-samsung-blue focus:outline-none"
                        >
                          <option value="all">All Students</option>
                          <option value="offline">🏫 Offline Only</option>
                          <option value="online">💻 Online Only</option>
                          <option value="self_study">📚 Self Study Only</option>
                        </select>
                      </div>
                    </div>

                    {enrolledStudents.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {enrolledStudents
                          .filter(s => studyModeFilter === 'all' || s.study_mode === studyModeFilter)
                          .map((student) => {
                            const badge = getStudyModeBadge(student.study_mode || 'offline')
                            return (
                              <div
                                key={student.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-samsung-blue/5 hover:bg-samsung-blue/10 transition-colors duration-300"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="samsung-body text-gray-900 font-medium">{student.full_name}</span>
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${badge.color}`}>
                                    {badge.icon} {badge.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Study Mode Selector */}
                                  <select
                                    value={student.study_mode || 'offline'}
                                    onChange={(e) => handleUpdateStudyMode(student.id, e.target.value as 'offline' | 'online' | 'self_study')}
                                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg samsung-body focus:border-samsung-blue focus:outline-none bg-white"
                                  >
                                    <option value="offline">🏫 Offline</option>
                                    <option value="online">💻 Online</option>
                                    <option value="self_study">📚 Self Study</option>
                                  </select>
                                  <button
                                    onClick={() => handleUnenrollStudent(student.id, student.full_name)}
                                    className="px-3 py-1.5 rounded-lg text-xs samsung-body text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-300"
                                  >
                                    Unenroll
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-samsung-blue/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <p className="samsung-body text-gray-600">No students enrolled yet</p>
                      </div>
                    )}
                  </div>

                  <div className="px-8 py-6 border-t-2 border-samsung-gray-100 flex justify-end">
                    <button
                      onClick={() => {
                        setShowManageEnrollmentsModal(false)
                        setEnrolledStudents([])
                        setStudyModeFilter('all')
                      }}
                      className="px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue/20 transition-all duration-300"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enroll Students Modal */}
          <AnimatePresence>
            {showEnrollModal && selectedClass && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => {
                  setShowEnrollModal(false)
                  setSelectedStudents([])
                  setNewStudentStudyMode('offline')
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
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setShowEnrollModal(false)
                          setShowManageEnrollmentsModal(true)
                          setNewStudentStudyMode('offline')
                        }}
                        className="w-8 h-8 rounded-lg bg-samsung-blue/10 flex items-center justify-center hover:bg-samsung-blue/20 transition-colors"
                      >
                        <svg className="w-4 h-4 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-xl samsung-heading text-gray-900">
                        Add Students to {selectedClass.name}
                      </h3>
                    </div>
                  </div>

                  <div className="px-8 py-6">
                    {/* Study Mode Selection */}
                    <div className="mb-6 p-4 bg-samsung-blue/5 rounded-xl">
                      <label className="block text-sm samsung-body text-gray-700 mb-3 font-medium">
                        Select Study Mode for New Students
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setNewStudentStudyMode('offline')}
                          className={`px-4 py-2.5 rounded-xl text-sm samsung-body font-medium transition-all duration-300 flex items-center gap-2 ${
                            newStudentStudyMode === 'offline'
                              ? 'bg-green-500 text-white shadow-lg'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          🏫 Offline
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewStudentStudyMode('online')}
                          className={`px-4 py-2.5 rounded-xl text-sm samsung-body font-medium transition-all duration-300 flex items-center gap-2 ${
                            newStudentStudyMode === 'online'
                              ? 'bg-blue-500 text-white shadow-lg'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          💻 Online
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewStudentStudyMode('self_study')}
                          className={`px-4 py-2.5 rounded-xl text-sm samsung-body font-medium transition-all duration-300 flex items-center gap-2 ${
                            newStudentStudyMode === 'self_study'
                              ? 'bg-purple-500 text-white shadow-lg'
                              : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          }`}
                        >
                          📚 Self Study
                        </button>
                      </div>
                    </div>

                    {/* Students List */}
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {students.map((student) => (
                        <label
                          key={student.id}
                          className="flex items-center p-3 rounded-xl hover:bg-samsung-blue/5 cursor-pointer transition-colors duration-300"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents([...selectedStudents, student.id])
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student.id))
                              }
                            }}
                            className="h-4 w-4 text-samsung-blue focus:ring-samsung-blue/20 border-samsung-gray-100 rounded"
                          />
                          <span className="ml-3 samsung-body text-gray-900">{student.full_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="px-8 py-6 border-t-2 border-samsung-gray-100 flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowEnrollModal(false)
                        setShowManageEnrollmentsModal(true)
                        setSelectedStudents([])
                        setNewStudentStudyMode('offline')
                      }}
                      className="px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue/20 transition-all duration-300"
                    >
                      Back
                    </button>
                    <button
                      onClick={async () => {
                        await handleEnrollStudents()
                        if (selectedClass) {
                          await fetchEnrolledStudents(selectedClass.id)
                          setShowEnrollModal(false)
                          setShowManageEnrollmentsModal(true)
                        }
                      }}
                      disabled={selectedStudents.length === 0 || creating}
                      className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300 disabled:opacity-50"
                    >
                      {creating ? 'Enrolling...' : `Enroll ${selectedStudents.length} as ${getStudyModeBadge(newStudentStudyMode).label}`}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manage Courses Modal */}
          <AnimatePresence>
            {showManageCoursesModal && selectedClass && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => {
                  setShowManageCoursesModal(false)
                  setAssignedCourses([])
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
                    <h3 className="text-xl samsung-heading text-gray-900">
                      Manage Courses - {selectedClass.name}
                    </h3>
                    <p className="text-sm samsung-body text-gray-600 mt-1">
                      {assignedCourses.length} course{assignedCourses.length !== 1 ? 's' : ''} assigned
                    </p>
                  </div>

                  <div className="px-8 py-6">
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          // Pre-select already assigned courses
                          setSelectedCourses(assignedCourses.map(c => c.id))
                          setShowManageCoursesModal(false)
                          setShowAssignCoursesModal(true)
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Assign Courses
                      </button>
                    </div>

                    {assignedCourses.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {assignedCourses.map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-samsung-blue/5 hover:bg-samsung-blue/10 transition-colors duration-300"
                          >
                            <span className="samsung-body text-gray-900">{course.title}</span>
                            <button
                              onClick={() => handleUnassignCourse(course.id, course.title)}
                              className="px-3 py-1.5 rounded-lg text-xs samsung-body text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-300"
                            >
                              Unassign
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-samsung-blue/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <p className="samsung-body text-gray-600">No courses assigned yet</p>
                      </div>
                    )}
                  </div>

                  <div className="px-8 py-6 border-t-2 border-samsung-gray-100 flex justify-end">
                    <button
                      onClick={() => {
                        setShowManageCoursesModal(false)
                        setAssignedCourses([])
                      }}
                      className="px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue/20 transition-all duration-300"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Assign Courses Modal */}
          <AnimatePresence>
            {showAssignCoursesModal && selectedClass && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => {
                  setShowAssignCoursesModal(false)
                  setSelectedCourses([])
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
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setShowAssignCoursesModal(false)
                          setShowManageCoursesModal(true)
                        }}
                        className="w-8 h-8 rounded-lg bg-samsung-blue/10 flex items-center justify-center hover:bg-samsung-blue/20 transition-colors"
                      >
                        <svg className="w-4 h-4 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-xl samsung-heading text-gray-900">
                        Assign Courses to {selectedClass.name}
                      </h3>
                    </div>
                  </div>

                  <div className="px-8 py-6">
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {courses.map((course) => (
                        <label
                          key={course.id}
                          className="flex items-center p-3 rounded-xl hover:bg-samsung-blue/5 cursor-pointer transition-colors duration-300"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCourses([...selectedCourses, course.id])
                              } else {
                                setSelectedCourses(selectedCourses.filter(id => id !== course.id))
                              }
                            }}
                            className="h-4 w-4 text-samsung-blue focus:ring-samsung-blue/20 border-samsung-gray-100 rounded"
                          />
                          <span className="ml-3 samsung-body text-gray-900">{course.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="px-8 py-6 border-t-2 border-samsung-gray-100 flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowAssignCoursesModal(false)
                        setShowManageCoursesModal(true)
                        setSelectedCourses([])
                      }}
                      className="px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue/20 transition-all duration-300"
                    >
                      Back
                    </button>
                    <button
                      onClick={async () => {
                        await handleAssignCourses()
                        if (selectedClass) {
                          await fetchAssignedCourses(selectedClass.id)
                          setShowAssignCoursesModal(false)
                          setShowManageCoursesModal(true)
                        }
                      }}
                      disabled={selectedCourses.length === 0 || creating}
                      className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300 disabled:opacity-50"
                    >
                      {creating ? 'Assigning...' : `Assign ${selectedCourses.length} Course${selectedCourses.length !== 1 ? 's' : ''}`}
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
