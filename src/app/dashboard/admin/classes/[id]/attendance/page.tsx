'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { AuthGate } from '@/components/AuthGate'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

type StudyMode = 'offline' | 'online' | 'self_study'

interface Student {
  id: string
  full_name: string
  profile_image_url?: string
  study_mode?: StudyMode
  is_blacklisted?: boolean
}

interface AttendanceRecord {
  id?: string
  student_id: string
  lesson_date: string
  lesson_number: number
  status: 'present' | 'absent' | 'excused'
  notes?: string
}

interface ClassInfo {
  id: string
  name: string
  description?: string
}

interface Lesson {
  lesson_date: string
  lesson_number: number
  lesson_title: string | null
  topic_id: string | null
  topic_title?: string
  total_students: number
  present_count: number
  absent_count: number
  excused_count: number
}

interface Course {
  id: string
  title: string
}

interface Topic {
  id: string
  title: string
  module_id: string
  course_id?: string // derived from module's course
}

// Full attendance data for table view
interface FullAttendanceData {
  [studentId: string]: {
    [lessonKey: string]: 'present' | 'absent' | 'excused' | null
  }
}

export default function ClassAttendancePage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const classId = params.id as string

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null)
  
  // Form fields
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [lessonNumber, setLessonNumber] = useState(1)
  const [lessonTitle, setLessonTitle] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [studyModeFilter, setStudyModeFilter] = useState<'all' | StudyMode>('all')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Table view state
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [fullAttendanceData, setFullAttendanceData] = useState<FullAttendanceData>({})
  const [tableStudyModeFilter, setTableStudyModeFilter] = useState<'all' | StudyMode>('all')
  const [showBlacklistSection, setShowBlacklistSection] = useState(false)
  const [togglingBlacklist, setTogglingBlacklist] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchClassInfo()
    fetchStudents()
    // Load courses first, then lessons (to fix race condition with topics)
    fetchCourses().then(() => fetchLessons())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, profile])

  // Fetch full attendance data for table view
  useEffect(() => {
    if (viewMode === 'table' && students.length > 0 && lessons.length > 0) {
      fetchFullAttendanceData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, students.length, lessons.length])

  useEffect(() => {
    if (selectedDate && lessonNumber && students.length > 0) {
      fetchAttendance()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, lessonNumber, students])

  // Update lesson topic titles when topics are loaded
  useEffect(() => {
    if (topics.length > 0 && lessons.length > 0) {
      setLessons(prevLessons => 
        prevLessons.map(lesson => {
          if (lesson.topic_id && !lesson.topic_title) {
            const topic = topics.find(t => t.id === lesson.topic_id)
            if (topic) {
              return { ...lesson, topic_title: topic.title }
            }
          }
          return lesson
        })
      )
    }
  }, [topics, lessons.length])

  const fetchClassInfo = async () => {
    const { data } = await supabase
      .from('classes')
      .select('id, name, description')
      .eq('id', classId)
      .single()

    if (data) setClassInfo(data)
  }

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('class_courses')
      .select(`
        course_id,
        courses!inner(
          id,
          title
        )
      `)
      .eq('class_id', classId)

    if (error) {
      console.error('Error fetching courses:', error)
      return
    }

    if (data) {
      const coursesList = data.map(cc => {
        const course = cc.courses as unknown as { id: string; title: string }
        return {
          id: course?.id || '',
          title: course?.title || ''
        }
      })
      setCourses(coursesList)
      
      if (coursesList.length > 0) {
        const courseIds = coursesList.map(c => c.id)
        
        // First fetch modules for these courses
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('id, course_id')
          .in('course_id', courseIds)

        if (modulesError) {
          console.error('Error fetching modules:', modulesError)
          return
        }

        if (modulesData && modulesData.length > 0) {
          const moduleIds = modulesData.map(m => m.id)
          const moduleToCoursemap = new Map<string, string>()
          modulesData.forEach(m => moduleToCoursemap.set(m.id, m.course_id))
          
          // Then fetch topics for these modules
          const { data: topicsData, error: topicsError } = await supabase
            .from('topics')
            .select('id, title, module_id, position')
            .in('module_id', moduleIds)
            .order('position', { ascending: true })

          if (topicsError) {
            console.error('Error fetching topics:', topicsError)
            return
          }

          if (topicsData) {
            // Add course_id to each topic based on its module
            const topicsWithCourse = topicsData.map(topic => ({
              ...topic,
              course_id: moduleToCoursemap.get(topic.module_id) || ''
            }))
            setTopics(topicsWithCourse)
          }
        }
      }
    }
  }

  const fetchLessons = async (topicsList?: Topic[]) => {
    const { data, error } = await supabase
      .from('class_attendance')
      .select('lesson_date, lesson_number, lesson_title, status')
      .eq('class_id', classId)
      .order('lesson_date', { ascending: false })
      .order('lesson_number', { ascending: false })

    if (error) {
      console.error('Error fetching lessons:', error)
      return
    }

    if (data) {
      const lessonsMap = new Map<string, Lesson>()
      
      data.forEach(record => {
        const key = `${record.lesson_date}-${record.lesson_number}`
        
        if (!lessonsMap.has(key)) {
          lessonsMap.set(key, {
            lesson_date: record.lesson_date,
            lesson_number: record.lesson_number,
            lesson_title: record.lesson_title,
            topic_id: null, // Column doesn't exist yet in DB
            total_students: 0,
            present_count: 0,
            absent_count: 0,
            excused_count: 0
          })
        }
        
        const lesson = lessonsMap.get(key)!
        lesson.total_students++
        
        if (record.status === 'present') lesson.present_count++
        else if (record.status === 'absent') lesson.absent_count++
        else if (record.status === 'excused') lesson.excused_count++
      })
      
      const lessonsArray = Array.from(lessonsMap.values())
      
      // Add topic titles - use passed topicsList or current topics state
      const availableTopics = topicsList || topics
      lessonsArray.forEach(lesson => {
        if (lesson.topic_id && availableTopics.length > 0) {
          const topic = availableTopics.find(t => t.id === lesson.topic_id)
          if (topic) {
            lesson.topic_title = topic.title
          }
        }
      })
      
      setLessons(lessonsArray)
    }
  }

  const fetchStudents = async () => {
    setLoading(true)
    try {
      // First, get enrolled user IDs with study_mode and blacklist status
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_enrollments')
        .select('user_id, study_mode, is_blacklisted')
        .eq('class_id', classId)
        .eq('status', 'active')

      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError)
        setStudents([])
        setLoading(false)
        return
      }

      if (!enrollments || enrollments.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      const userIds = enrollments.map(e => e.user_id)
      
      // Create a map of user_id to study_mode and blacklist status
      const enrollmentMap = new Map<string, { study_mode: StudyMode, is_blacklisted: boolean }>()
      enrollments.forEach(e => {
        enrollmentMap.set(e.user_id, {
          study_mode: (e.study_mode as StudyMode) || 'offline',
          is_blacklisted: e.is_blacklisted || false
        })
      })

      // Then, get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, profile_image_url')
        .in('id', userIds)
        .order('full_name', { ascending: true })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        setStudents([])
        setLoading(false)
        return
      }

      // Merge profiles with study_mode and blacklist status
      const studentsWithMode: Student[] = (profiles || []).map(p => ({
        ...p,
        study_mode: enrollmentMap.get(p.id)?.study_mode || 'offline',
        is_blacklisted: enrollmentMap.get(p.id)?.is_blacklisted || false
      }))

      // Sort: offline first, then online, then self_study
      const modeOrder: Record<StudyMode, number> = { offline: 0, online: 1, self_study: 2 }
      studentsWithMode.sort((a, b) => {
        const modeA = a.study_mode || 'offline'
        const modeB = b.study_mode || 'offline'
        if (modeOrder[modeA] !== modeOrder[modeB]) {
          return modeOrder[modeA] - modeOrder[modeB]
        }
        return a.full_name.localeCompare(b.full_name)
      })

      setStudents(studentsWithMode)
    } catch (error) {
      console.error('Error in fetchStudents:', error)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendance = async () => {
    const { data } = await supabase
      .from('class_attendance')
      .select('*')
      .eq('class_id', classId)
      .eq('lesson_date', selectedDate)
      .eq('lesson_number', lessonNumber)

    if (data) {
      const attendanceMap: Record<string, AttendanceRecord> = {}
      data.forEach(record => {
        attendanceMap[record.student_id] = {
          id: record.id,
          student_id: record.student_id,
          lesson_date: record.lesson_date,
          lesson_number: record.lesson_number,
          status: record.status,
          notes: record.notes
        }
      })
      setAttendance(attendanceMap)
      
      if (data.length > 0) {
        if (data[0].lesson_title) setLessonTitle(data[0].lesson_title)
        if (data[0].topic_id) setSelectedTopicId(data[0].topic_id)
      }
    }
  }

  // Fetch all attendance data for table view
  const fetchFullAttendanceData = async () => {
    const { data, error } = await supabase
      .from('class_attendance')
      .select('student_id, lesson_date, lesson_number, status')
      .eq('class_id', classId)

    if (error) {
      console.error('Error fetching full attendance:', error)
      return
    }

    if (data) {
      const attendanceMap: FullAttendanceData = {}
      
      data.forEach(record => {
        const lessonKey = `${record.lesson_date}-${record.lesson_number}`
        
        if (!attendanceMap[record.student_id]) {
          attendanceMap[record.student_id] = {}
        }
        
        attendanceMap[record.student_id][lessonKey] = record.status
      })
      
      setFullAttendanceData(attendanceMap)
    }
  }

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'excused') => {
    setAttendance(prev => {
      const existingRecord = prev[studentId]
      return {
        ...prev,
        [studentId]: {
          id: existingRecord?.id,
          student_id: studentId,
          lesson_date: selectedDate,
          lesson_number: lessonNumber,
          status,
          notes: existingRecord?.notes || ''
        }
      }
    })
  }

  const updateNotes = (studentId: string, notes: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }))
  }

  const saveAttendance = async () => {
    setSaving(true)
    setMessage(null)

    try {
      // If no attendance marked yet, create records for all students with 'absent' status
      const hasAttendance = Object.keys(attendance).length > 0
      
      let records
      if (hasAttendance) {
        records = Object.values(attendance).map(record => ({
          class_id: classId,
          student_id: record.student_id,
          lesson_date: selectedDate,
          lesson_number: lessonNumber,
          lesson_title: lessonTitle || null,
          // topic_id: selectedTopicId || null, // Column doesn't exist yet in DB
          status: record.status,
          notes: record.notes,
          marked_by: profile?.id
        }))
      } else {
        // Create lesson with all students marked as not present initially
        records = students.map(student => ({
          class_id: classId,
          student_id: student.id,
          lesson_date: selectedDate,
          lesson_number: lessonNumber,
          lesson_title: lessonTitle || null,
          // topic_id: selectedTopicId || null, // Column doesn't exist yet in DB
          status: 'absent' as const,
          notes: null,
          marked_by: profile?.id
        }))
      }

      const { error } = await supabase
        .from('class_attendance')
        .upsert(records, {
          onConflict: 'class_id,student_id,lesson_date,lesson_number'
        })

      if (error) throw error

      setMessage({ type: 'success', text: hasAttendance ? 'Davamiyyət uğurla yadda saxlanıldı!' : 'Dərs uğurla yaradıldı!' })
      await fetchLessons(topics)
      // Refresh table data if in table view
      if (viewMode === 'table') {
        await fetchFullAttendanceData()
      }
      setShowLessonModal(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving attendance:', error)
      setMessage({ type: 'error', text: 'Xəta baş verdi. Yenidən cəhd edin.' })
    } finally {
      setSaving(false)
    }
  }

  const deleteLesson = async () => {
    if (!lessonToDelete) return

    setDeleting(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('class_attendance')
        .delete()
        .eq('class_id', classId)
        .eq('lesson_date', lessonToDelete.lesson_date)
        .eq('lesson_number', lessonToDelete.lesson_number)

      if (error) throw error

      setMessage({ type: 'success', text: 'Dərs uğurla silindi!' })
      setShowDeleteConfirm(false)
      setLessonToDelete(null)
      
      if (selectedLesson?.lesson_date === lessonToDelete.lesson_date && 
          selectedLesson?.lesson_number === lessonToDelete.lesson_number) {
        setSelectedLesson(null)
        setShowLessonModal(false)
      }
      
      fetchLessons(topics)
      // Refresh table data if in table view
      if (viewMode === 'table') {
        fetchFullAttendanceData()
      }
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting lesson:', error)
      setMessage({ type: 'error', text: 'Dərsi silmək mümkün olmadı.' })
    } finally {
      setDeleting(false)
    }
  }

  const openNewLessonModal = () => {
    setSelectedLesson(null)
    setSelectedDate(new Date().toISOString().split('T')[0])
    setLessonNumber(lessons.length > 0 ? Math.max(...lessons.map(l => l.lesson_number)) + 1 : 1)
    setLessonTitle('')
    setSelectedTopicId('')
    setAttendance({})
    setShowLessonModal(true)
  }

  const openEditLessonModal = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setSelectedDate(lesson.lesson_date)
    setLessonNumber(lesson.lesson_number)
    setLessonTitle(lesson.lesson_title || '')
    setSelectedTopicId(lesson.topic_id || '')
    setShowLessonModal(true)
  }

  // Toggle blacklist status for a student
  const toggleBlacklist = async (studentId: string, currentStatus: boolean) => {
    setTogglingBlacklist(studentId)
    
    try {
      const { error } = await supabase
        .from('class_enrollments')
        .update({ is_blacklisted: !currentStatus })
        .eq('class_id', classId)
        .eq('user_id', studentId)

      if (error) throw error

      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, is_blacklisted: !currentStatus } : s
      ))

      setMessage({ 
        type: 'success', 
        text: !currentStatus 
          ? 'Tələbə qara siyahıya əlavə edildi. Materiallara girişi bloklandı.' 
          : 'Tələbə qara siyahıdan çıxarıldı.'
      })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error toggling blacklist:', error)
      setMessage({ type: 'error', text: 'Xəta baş verdi. Yenidən cəhd edin.' })
    } finally {
      setTogglingBlacklist(null)
    }
  }

  const getStats = () => {
    const total = students.length
    const present = Object.values(attendance).filter(a => a.status === 'present').length
    const absent = Object.values(attendance).filter(a => a.status === 'absent').length
    const excused = Object.values(attendance).filter(a => a.status === 'excused').length
    const notMarked = total - present - absent - excused

    return { total, present, absent, excused, notMarked }
  }

  const getStudyModeStats = () => {
    const offline = students.filter(s => (s.study_mode || 'offline') === 'offline').length
    const online = students.filter(s => s.study_mode === 'online').length
    const selfStudy = students.filter(s => s.study_mode === 'self_study').length
    return { offline, online, selfStudy }
  }

  const getStudyModeBadge = (mode: StudyMode | undefined) => {
    switch (mode) {
      case 'online':
        return (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
            💻 Online
          </span>
        )
      case 'self_study':
        return (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
            📚 Sərbəst
          </span>
        )
      case 'offline':
      default:
        return (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
            🏫 Əyani
          </span>
        )
    }
  }

  // Filter students based on study mode
  const filteredStudents = students.filter(student => {
    if (studyModeFilter === 'all') return true
    return (student.study_mode || 'offline') === studyModeFilter
  })

  const stats = getStats()
  const studyModeStats = getStudyModeStats()
  const selectedTopic = topics.find(t => t.id === selectedTopicId)
  const selectedCourse = selectedTopic ? courses.find(c => c.id === selectedTopic.course_id) : null

  // Sort lessons by date and number for table view
  const sortedLessons = [...lessons].sort((a, b) => {
    const dateCompare = new Date(a.lesson_date).getTime() - new Date(b.lesson_date).getTime()
    if (dateCompare !== 0) return dateCompare
    return a.lesson_number - b.lesson_number
  })

  // Calculate student attendance stats for table view
  const getStudentStats = (studentId: string) => {
    const studentAttendance = fullAttendanceData[studentId] || {}
    let present = 0, absent = 0, excused = 0
    
    Object.values(studentAttendance).forEach(status => {
      if (status === 'present') present++
      else if (status === 'absent') absent++
      else if (status === 'excused') excused++
    })
    
    const total = present + absent + excused
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0
    
    return { present, absent, excused, total, percentage }
  }

  // Get status color for table cell
  const getStatusColor = (status: 'present' | 'absent' | 'excused' | null) => {
    switch (status) {
      case 'present':
        return 'bg-green-500'
      case 'absent':
        return 'bg-red-500'
      case 'excused':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-200'
    }
  }

  const getStatusIcon = (status: 'present' | 'absent' | 'excused' | null) => {
    switch (status) {
      case 'present':
        return '✓'
      case 'absent':
        return '✗'
      case 'excused':
        return '!'
      default:
        return '-'
    }
  }

  // Filter students for table view by study mode
  const tableFilteredStudents = students.filter(student => {
    if (tableStudyModeFilter === 'all') return true
    return (student.study_mode || 'offline') === tableStudyModeFilter
  })

  // Get blacklisted students
  const blacklistedStudents = students.filter(s => s.is_blacklisted)

  // Get study mode counts for table view
  const getTableStudyModeStats = () => {
    const offline = students.filter(s => (s.study_mode || 'offline') === 'offline' && !s.is_blacklisted).length
    const online = students.filter(s => s.study_mode === 'online' && !s.is_blacklisted).length
    const selfStudy = students.filter(s => s.study_mode === 'self_study' && !s.is_blacklisted).length
    return { offline, online, selfStudy }
  }

  const tableStudyModeStats = getTableStudyModeStats()

  return (
    <AuthGate requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl samsung-heading text-gray-900">Davamiyyət İdarəetməsi</h1>
              <p className="text-gray-600 samsung-body mt-1">{classInfo?.name}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/admin/classes')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition samsung-body font-semibold"
            >
              ← Geriyə
            </button>
          </div>

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-xl samsung-body font-semibold ${
                  message.type === 'success' 
                    ? 'bg-green-100 text-green-800 border-2 border-green-200' 
                    : 'bg-red-100 text-red-800 border-2 border-red-200'
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lessons Grid */}
          <div className="glass-card">
            <div className="px-6 py-4 border-b-2 border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl samsung-heading text-gray-900">Dərslər</h2>
                <p className="text-sm text-gray-600 samsung-body mt-1">{lessons.length} dərs yaradılıb</p>
              </div>
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      viewMode === 'cards'
                        ? 'bg-white text-samsung-blue shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Kartlar
                    </span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      viewMode === 'table'
                        ? 'bg-white text-samsung-blue shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Cədvəl
                    </span>
                  </button>
                </div>
                <button
                  onClick={openNewLessonModal}
                  className="px-5 py-2.5 bg-samsung-blue hover:bg-samsung-blue-dark text-white rounded-xl samsung-body font-semibold transition shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Yeni Dərs Yarat
                </button>
              </div>
            </div>

            {lessons.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-samsung-blue/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl samsung-heading text-gray-900 mb-2">Hələ ki dərs yoxdur</h3>
                <p className="text-gray-600 samsung-body mb-6">İlk dərsinizi yaradın və davamiyyəti qeyd etməyə başlayın</p>
                <button
                  onClick={openNewLessonModal}
                  className="px-6 py-3 bg-samsung-blue hover:bg-samsung-blue-dark text-white rounded-xl samsung-body font-semibold transition inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  İlk Dərsi Yarat
                </button>
              </div>
            ) : viewMode === 'table' ? (
              /* Table View */
              <div className="overflow-x-auto">
                {/* Study Mode Filter for Table */}
                <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 mr-2">Filtr:</span>
                    <button
                      onClick={() => setTableStudyModeFilter('all')}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        tableStudyModeFilter === 'all'
                          ? 'bg-samsung-blue text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Hamısı ({students.filter(s => !s.is_blacklisted).length})
                    </button>
                    <button
                      onClick={() => setTableStudyModeFilter('offline')}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        tableStudyModeFilter === 'offline'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      🏫 Əyani ({tableStudyModeStats.offline})
                    </button>
                    <button
                      onClick={() => setTableStudyModeFilter('online')}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        tableStudyModeFilter === 'online'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      💻 Online ({tableStudyModeStats.online})
                    </button>
                    <button
                      onClick={() => setTableStudyModeFilter('self_study')}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        tableStudyModeFilter === 'self_study'
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      📚 Sərbəst ({tableStudyModeStats.selfStudy})
                    </button>
                  </div>
                  
                  {/* Blacklist Toggle Button */}
                  <button
                    onClick={() => setShowBlacklistSection(!showBlacklistSection)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2 ${
                      showBlacklistSection
                        ? 'bg-red-500 text-white shadow-lg'
                        : blacklistedStudents.length > 0
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border-2 border-red-200'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    🚫 Qara Siyahı ({blacklistedStudents.length})
                  </button>
                </div>

                {/* Blacklisted Students Section */}
                {showBlacklistSection && blacklistedStudents.length > 0 && (
                  <div className="px-6 py-4 bg-red-50 border-b-2 border-red-200">
                    <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                      🚫 Qara Siyahıdakı Tələbələr
                      <span className="text-sm font-normal text-red-600">
                        (Bu tələbələr materiallara daxil ola bilmir)
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {blacklistedStudents.map(student => (
                        <div 
                          key={student.id}
                          className="flex items-center justify-between bg-white p-3 rounded-xl border-2 border-red-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                              {student.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{student.full_name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                student.study_mode === 'online' ? 'bg-blue-100 text-blue-700' :
                                student.study_mode === 'self_study' ? 'bg-purple-100 text-purple-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {student.study_mode === 'online' ? '💻 Online' : 
                                 student.study_mode === 'self_study' ? '📚 Sərbəst' : '🏫 Əyani'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleBlacklist(student.id, true)}
                            disabled={togglingBlacklist === student.id}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {togglingBlacklist === student.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>✓ Çıxar</>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showBlacklistSection && blacklistedStudents.length === 0 && (
                  <div className="px-6 py-8 bg-gray-50 border-b border-gray-200 text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-gray-600">Qara siyahıda heç bir tələbə yoxdur</p>
                  </div>
                )}

                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b-2 border-gray-200 min-w-[250px] z-10">
                        Tələbə
                      </th>
                      {sortedLessons.map((lesson) => (
                        <th 
                          key={`${lesson.lesson_date}-${lesson.lesson_number}`}
                          className="px-2 py-3 text-center text-xs font-semibold text-gray-700 border-b-2 border-gray-200 min-w-[60px] cursor-pointer hover:bg-gray-100 transition"
                          onClick={() => openEditLessonModal(lesson)}
                          title={`${lesson.lesson_title || 'Dərs'} - ${new Date(lesson.lesson_date).toLocaleDateString('az-AZ')}`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-samsung-blue font-bold">#{lesson.lesson_number}</span>
                            <span className="text-[10px] text-gray-500">
                              {new Date(lesson.lesson_date).toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border-b-2 border-gray-200 min-w-[100px] bg-gray-100">
                        Statistika
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableFilteredStudents.filter(s => !s.is_blacklisted).map((student, index) => {
                      const studentStats = getStudentStats(student.id)
                      
                      return (
                        <tr 
                          key={student.id} 
                          className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/50 transition`}
                        >
                          {/* Student Name - Sticky */}
                          <td className={`sticky left-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} px-4 py-3 border-b border-gray-100 z-10`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 bg-samsung-blue text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                  {student.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{student.full_name}</p>
                                  {student.study_mode && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      student.study_mode === 'online' ? 'bg-blue-100 text-blue-700' :
                                      student.study_mode === 'self_study' ? 'bg-purple-100 text-purple-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {student.study_mode === 'online' ? '💻' : student.study_mode === 'self_study' ? '📚' : '🏫'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Blacklist Toggle */}
                              <button
                                onClick={() => toggleBlacklist(student.id, false)}
                                disabled={togglingBlacklist === student.id}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                                title="Qara siyahıya əlavə et"
                              >
                                {togglingBlacklist === student.id ? (
                                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                          
                          {/* Attendance Cells */}
                          {sortedLessons.map((lesson) => {
                            const lessonKey = `${lesson.lesson_date}-${lesson.lesson_number}`
                            const status = fullAttendanceData[student.id]?.[lessonKey] || null
                            
                            return (
                              <td 
                                key={lessonKey}
                                className="px-2 py-3 text-center border-b border-gray-100"
                              >
                                <div 
                                  className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-white text-sm font-bold ${getStatusColor(status)} ${
                                    status ? 'shadow-sm' : ''
                                  }`}
                                  title={
                                    status === 'present' ? 'İştirak etdi' :
                                    status === 'absent' ? 'Qayıb' :
                                    status === 'excused' ? 'Üzrlü' : 'Qeyd olunmayıb'
                                  }
                                >
                                  {getStatusIcon(status)}
                                </div>
                              </td>
                            )
                          })}
                          
                          {/* Stats Column */}
                          <td className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <div className="flex flex-col items-center gap-1">
                              <div className={`text-lg font-bold ${
                                studentStats.percentage >= 80 ? 'text-green-600' :
                                studentStats.percentage >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {studentStats.percentage}%
                              </div>
                              <div className="flex items-center gap-1 text-[10px]">
                                <span className="text-green-600">{studentStats.present}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-red-600">{studentStats.absent}</span>
                                <span className="text-gray-400">/</span>
                                <span className="text-yellow-600">{studentStats.excused}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                
                {/* Legend */}
                <div className="px-6 py-4 border-t-2 border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">✓</div>
                      <span className="text-gray-700">İştirak</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">✗</div>
                      <span className="text-gray-700">Qayıb</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">!</div>
                      <span className="text-gray-700">Üzrlü</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs font-bold">-</div>
                      <span className="text-gray-700">Qeyd olunmayıb</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Dərs başlığına klikləyərək redaktə edə bilərsiniz
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {lessons.map((lesson) => {
                  const percentage = lesson.total_students > 0 
                    ? Math.round((lesson.present_count / lesson.total_students) * 100) 
                    : 0

                  return (
                    <motion.div
                      key={`${lesson.lesson_date}-${lesson.lesson_number}`}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="glass-card p-5 cursor-pointer transition-all hover:shadow-xl border-2 border-transparent hover:border-samsung-blue/30"
                      onClick={() => openEditLessonModal(lesson)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-samsung-blue text-white rounded-full text-sm samsung-body font-bold">
                            #{lesson.lesson_number}
                          </span>
                          <div className={`text-4xl font-bold ${
                            percentage >= 80 ? 'text-green-600' : 
                            percentage >= 60 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {percentage}%
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setLessonToDelete(lesson)
                            setShowDeleteConfirm(true)
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* Title & Date */}
                      <h3 className="text-lg samsung-heading text-gray-900 mb-2 truncate">
                        {lesson.lesson_title || 'Başlıqsız Dərs'}
                      </h3>
                      <p className="text-sm text-gray-600 samsung-body mb-3">
                        📅 {new Date(lesson.lesson_date).toLocaleDateString('az-AZ', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>

                      {/* Topic Badge */}
                      {lesson.topic_title && (
                        <div className="mb-3">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs samsung-body font-semibold">
                            📚 {lesson.topic_title}
                          </span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-xs samsung-body">
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                          <span className="text-gray-700">{lesson.present_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                          <span className="text-gray-700">{lesson.absent_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
                          <span className="text-gray-700">{lesson.excused_count}</span>
                        </div>
                        <span className="text-gray-500">• {lesson.total_students} tələbə</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Lesson Modal */}
          <AnimatePresence>
            {showLessonModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => setShowLessonModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="glass-card rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
                >
                  {/* Modal Header */}
                  <div className="px-8 py-6 border-b-2 border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl samsung-heading text-gray-900">
                          {selectedLesson ? 'Dərsi Redaktə Et' : 'Yeni Dərs Yarat'}
                        </h2>
                        <p className="text-sm text-gray-600 samsung-body mt-1">
                          Dərs məlumatlarını doldurun və davamiyyəti qeyd edin
                        </p>
                      </div>
                      <button
                        onClick={() => setShowLessonModal(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Lesson Form */}
                  <div className="px-8 py-6 space-y-6">
                    {/* Lesson Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm samsung-body font-semibold text-gray-700 mb-2">
                          Dərs Tarixi *
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl samsung-body focus:border-samsung-blue focus:outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm samsung-body font-semibold text-gray-700 mb-2">
                          Dərs Nömrəsi *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={lessonNumber}
                          onChange={(e) => setLessonNumber(parseInt(e.target.value))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl samsung-body focus:border-samsung-blue focus:outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm samsung-body font-semibold text-gray-700 mb-2">
                          Dərs Başlığı
                        </label>
                        <input
                          type="text"
                          value={lessonTitle}
                          onChange={(e) => setLessonTitle(e.target.value)}
                          placeholder="Məsələn: İntro to AI"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl samsung-body focus:border-samsung-blue focus:outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm samsung-body font-semibold text-gray-700 mb-2">
                          Mövzu (Topic)
                        </label>
                        <select
                          value={selectedTopicId}
                          onChange={(e) => setSelectedTopicId(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl samsung-body focus:border-samsung-blue focus:outline-none bg-white transition appearance-none cursor-pointer"
                        >
                          <option value="">Mövzu seçin (istəyə bağlı)</option>
                          {courses.map(course => {
                            const courseTopics = topics.filter(t => t.course_id === course.id)
                            if (courseTopics.length === 0) return null
                            
                            return (
                              <optgroup key={course.id} label={`📚 ${course.title}`}>
                                {courseTopics.map(topic => (
                                  <option key={topic.id} value={topic.id}>
                                    {topic.title}
                                  </option>
                                ))}
                              </optgroup>
                            )
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Selected Topic Info */}
                    {selectedTopic && (
                      <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white text-xl">
                            📚
                          </div>
                          <div>
                            <p className="text-sm text-purple-600 samsung-body font-semibold">Seçilmiş Mövzu</p>
                            <p className="text-purple-900 samsung-body font-bold">{selectedTopic.title}</p>
                            {selectedCourse && (
                              <p className="text-xs text-purple-600 samsung-body mt-1">Kurs: {selectedCourse.title}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="glass-card p-4 text-center border-2 border-gray-200">
                        <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
                        <div className="text-sm text-gray-600 samsung-body">Cəmi</div>
                      </div>
                      <div className="glass-card p-4 text-center border-2 border-green-200 bg-green-50">
                        <div className="text-3xl font-bold text-green-700 mb-1">{stats.present}</div>
                        <div className="text-sm text-green-600 samsung-body font-semibold">İştirak</div>
                      </div>
                      <div className="glass-card p-4 text-center border-2 border-red-200 bg-red-50">
                        <div className="text-3xl font-bold text-red-700 mb-1">{stats.absent}</div>
                        <div className="text-sm text-red-600 samsung-body font-semibold">Qayıb</div>
                      </div>
                      <div className="glass-card p-4 text-center border-2 border-yellow-200 bg-yellow-50">
                        <div className="text-3xl font-bold text-yellow-700 mb-1">{stats.excused}</div>
                        <div className="text-sm text-yellow-600 samsung-body font-semibold">Üzrlü</div>
                      </div>
                      <div className="glass-card p-4 text-center border-2 border-gray-200 bg-gray-50">
                        <div className="text-3xl font-bold text-gray-700 mb-1">{stats.notMarked}</div>
                        <div className="text-sm text-gray-600 samsung-body font-semibold">Qeyd olunmayıb</div>
                      </div>
                    </div>

                    {/* Students List */}
                    {loading ? (
                      <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-samsung-blue border-t-transparent mx-auto"></div>
                        <p className="mt-4 text-gray-600 samsung-body">Yüklənir...</p>
                      </div>
                    ) : students.length === 0 ? (
                      <div className="p-12 text-center">
                        <p className="text-gray-600 samsung-body">Bu sinifdə heç bir tələbə yoxdur.</p>
                      </div>
                    ) : (
                      <div>
                        {/* Study Mode Filter Tabs */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg samsung-heading text-gray-900">
                            Tələbələr ({filteredStudents.length}/{students.length})
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 samsung-body mr-2">
                              🏫 {studyModeStats.offline} | 💻 {studyModeStats.online} | 📚 {studyModeStats.selfStudy}
                            </span>
                          </div>
                        </div>
                        
                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-100 rounded-xl">
                          <button
                            onClick={() => setStudyModeFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                              studyModeFilter === 'all'
                                ? 'bg-white text-samsung-blue shadow'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Hamısı ({students.length})
                          </button>
                          <button
                            onClick={() => setStudyModeFilter('offline')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                              studyModeFilter === 'offline'
                                ? 'bg-green-500 text-white shadow'
                                : 'text-gray-600 hover:bg-green-50'
                            }`}
                          >
                            🏫 Əyani ({studyModeStats.offline})
                          </button>
                          <button
                            onClick={() => setStudyModeFilter('online')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                              studyModeFilter === 'online'
                                ? 'bg-blue-500 text-white shadow'
                                : 'text-gray-600 hover:bg-blue-50'
                            }`}
                          >
                            💻 Online ({studyModeStats.online})
                          </button>
                          <button
                            onClick={() => setStudyModeFilter('self_study')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                              studyModeFilter === 'self_study'
                                ? 'bg-purple-500 text-white shadow'
                                : 'text-gray-600 hover:bg-purple-50'
                            }`}
                          >
                            📚 Sərbəst ({studyModeStats.selfStudy})
                          </button>
                        </div>

                        <div className="space-y-3">
                          {filteredStudents.map((student) => {
                            const record = attendance[student.id]
                            const status = record?.status

                            return (
                              <div key={student.id} className="p-5 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-samsung-blue/30 transition">
                                <div className="flex items-center justify-between gap-4 mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-samsung-blue text-white rounded-full flex items-center justify-center samsung-body font-bold">
                                      {student.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                      <h4 className="font-semibold text-gray-900 samsung-body text-lg">
                                        {student.full_name}
                                      </h4>
                                      {getStudyModeBadge(student.study_mode)}
                                    </div>
                                  </div>

                                  {/* Status Buttons */}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => updateAttendance(student.id, 'present')}
                                      className={`px-4 py-2 rounded-xl border-2 samsung-body font-semibold transition-all ${
                                        status === 'present'
                                          ? 'bg-green-500 text-white border-green-600 shadow-lg scale-105'
                                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-500 hover:bg-green-50'
                                      }`}
                                    >
                                      ✓ İştirak
                                    </button>
                                    <button
                                      onClick={() => updateAttendance(student.id, 'absent')}
                                      className={`px-4 py-2 rounded-xl border-2 samsung-body font-semibold transition-all ${
                                        status === 'absent'
                                          ? 'bg-red-500 text-white border-red-600 shadow-lg scale-105'
                                          : 'bg-white text-gray-700 border-gray-300 hover:border-red-500 hover:bg-red-50'
                                      }`}
                                    >
                                      ✗ Qayıb
                                    </button>
                                    <button
                                      onClick={() => updateAttendance(student.id, 'excused')}
                                      className={`px-4 py-2 rounded-xl border-2 samsung-body font-semibold transition-all ${
                                        status === 'excused'
                                          ? 'bg-yellow-500 text-white border-yellow-600 shadow-lg scale-105'
                                          : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-500 hover:bg-yellow-50'
                                      }`}
                                    >
                                      ⚠ Üzrlü
                                    </button>
                                  </div>
                                </div>

                                {/* Notes */}
                                {status && (
                                  <input
                                    type="text"
                                    placeholder="Qeyd əlavə edin (istəyə bağlı)"
                                    value={record?.notes || ''}
                                    onChange={(e) => updateNotes(student.id, e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl samsung-body text-sm focus:border-samsung-blue focus:outline-none transition"
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  {students.length > 0 && (
                    <div className="px-8 py-6 border-t-2 border-gray-100 flex items-center justify-between sticky bottom-0 bg-white/95 backdrop-blur rounded-b-3xl">
                      <div className="flex gap-3">
                        {selectedLesson && (
                          <button
                            onClick={() => {
                              setLessonToDelete(selectedLesson)
                              setShowDeleteConfirm(true)
                              setShowLessonModal(false)
                            }}
                            className="px-6 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl samsung-body font-semibold transition"
                          >
                            🗑️ Dərsi Sil
                          </button>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowLessonModal(false)}
                          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl samsung-body font-semibold transition"
                        >
                          Ləğv et
                        </button>
                        <button
                          onClick={saveAttendance}
                          disabled={saving}
                          className="px-8 py-3 bg-samsung-blue hover:bg-samsung-blue-dark text-white rounded-xl samsung-body font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {saving ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saxlanılır...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Davamiyyəti Yadda Saxla
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && lessonToDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="glass-card rounded-3xl max-w-md w-full p-8"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl samsung-heading text-gray-900">Dərsi Sil</h3>
                      <p className="text-sm text-gray-600 samsung-body mt-1">Bu əməliyyat geri alına bilməz</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 samsung-body mb-8 leading-relaxed">
                    <strong className="text-gray-900">Dərs #{lessonToDelete.lesson_number}</strong> ({lessonToDelete.lesson_title || 'Başlıqsız'}) 
                    və bütün davamiyyət qeydləri silinəcək. Davam etmək istədiyinizdən əminsiniz?
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setLessonToDelete(null)
                      }}
                      disabled={deleting}
                      className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl samsung-body font-semibold transition"
                    >
                      Ləğv et
                    </button>
                    <button
                      onClick={deleteLesson}
                      disabled={deleting}
                      className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl samsung-body font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {deleting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Silinir...
                        </>
                      ) : (
                        'Bəli, Sil'
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DashboardLayout>
    </AuthGate>
  )
}
