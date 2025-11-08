'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { AuthGate } from '@/components/AuthGate'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Student {
  id: string
  full_name: string
  profile_image_url?: string
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

export default function ClassAttendancePage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const classId = params.id as string

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [lessonNumber, setLessonNumber] = useState(1)
  const [lessonTitle, setLessonTitle] = useState('')
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchClassInfo()
    fetchStudents()
  }, [classId, profile])

  useEffect(() => {
    if (selectedDate && lessonNumber && students.length > 0) {
      fetchAttendance()
    }
  }, [selectedDate, lessonNumber, students])

  const fetchClassInfo = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, name, description')
      .eq('id', classId)
      .single()

    if (data) setClassInfo(data)
  }

  const fetchStudents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('class_enrollments')
      .select(`
        user_id,
        user_profiles!inner (
          id,
          full_name,
          profile_image_url
        )
      `)
      .eq('class_id', classId)
      .eq('status', 'active')

    if (data) {
      const studentsList = data.map(enrollment => ({
        id: enrollment.user_profiles.id,
        full_name: enrollment.user_profiles.full_name,
        profile_image_url: enrollment.user_profiles.profile_image_url
      }))
      setStudents(studentsList)
    }
    setLoading(false)
  }

  const fetchAttendance = async () => {
    const { data, error } = await supabase
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
      
      // Set lesson title if exists
      if (data.length > 0 && data[0].lesson_title) {
        setLessonTitle(data[0].lesson_title)
      }
    }
  }

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'excused') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        student_id: studentId,
        lesson_date: selectedDate,
        lesson_number: lessonNumber,
        status
      }
    }))
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
      const records = Object.values(attendance).map(record => ({
        class_id: classId,
        student_id: record.student_id,
        lesson_date: selectedDate,
        lesson_number: lessonNumber,
        lesson_title: lessonTitle,
        status: record.status,
        notes: record.notes,
        marked_by: profile?.id
      }))

      const { error } = await supabase
        .from('class_attendance')
        .upsert(records, {
          onConflict: 'class_id,student_id,lesson_date,lesson_number'
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Davamiyyət uğurla yadda saxlanıldı!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving attendance:', error)
      setMessage({ type: 'error', text: 'Xəta baş verdi. Yenidən cəhd edin.' })
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-300'
      case 'absent': return 'bg-red-100 text-red-800 border-red-300'
      case 'excused': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
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

  const stats = getStats()

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
              onClick={() => router.push(`/dashboard/admin/classes/${classId}`)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition samsung-body"
            >
              ← Geri
            </button>
          </div>

          {/* Lesson Info */}
          <div className="glass-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm samsung-body font-semibold text-gray-700 mb-2">
                  Dərs Tarixi
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg samsung-body focus:border-samsung-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm samsung-body font-semibold text-gray-700 mb-2">
                  Dərs Nömrəsi
                </label>
                <input
                  type="number"
                  min="1"
                  value={lessonNumber}
                  onChange={(e) => setLessonNumber(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg samsung-body focus:border-samsung-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm samsung-body font-semibold text-gray-700 mb-2">
                  Dərs Başlığı (İstəyə bağlı)
                </label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Məsələn: İntro to AI"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg samsung-body focus:border-samsung-blue focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600 samsung-body">Cəmi</div>
            </div>
            <div className="glass-card p-4 text-center bg-green-50">
              <div className="text-2xl font-bold text-green-700">{stats.present}</div>
              <div className="text-sm text-green-600 samsung-body">İştirak</div>
            </div>
            <div className="glass-card p-4 text-center bg-red-50">
              <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
              <div className="text-sm text-red-600 samsung-body">Qayıb</div>
            </div>
            <div className="glass-card p-4 text-center bg-yellow-50">
              <div className="text-2xl font-bold text-yellow-700">{stats.excused}</div>
              <div className="text-sm text-yellow-600 samsung-body">Üzrlü</div>
            </div>
            <div className="glass-card p-4 text-center bg-gray-50">
              <div className="text-2xl font-bold text-gray-700">{stats.notMarked}</div>
              <div className="text-sm text-gray-600 samsung-body">Qeyd olunmayıb</div>
            </div>
          </div>

          {/* Attendance List */}
          <div className="glass-card">
            <div className="px-6 py-4 border-b-2 border-gray-100">
              <h2 className="text-xl samsung-heading text-gray-900">Tələbələr</h2>
            </div>

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
              <div className="divide-y divide-gray-100">
                {students.map((student) => {
                  const record = attendance[student.id]
                  const status = record?.status

                  return (
                    <div key={student.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-start gap-6">
                        {/* Student Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 samsung-body text-lg">
                            {student.full_name}
                          </h3>
                        </div>

                        {/* Status Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateAttendance(student.id, 'present')}
                            className={`px-4 py-2 rounded-lg border-2 samsung-body font-semibold transition ${
                              status === 'present'
                                ? 'bg-green-500 text-white border-green-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                            }`}
                          >
                            ✓ İştirak
                          </button>
                          <button
                            onClick={() => updateAttendance(student.id, 'absent')}
                            className={`px-4 py-2 rounded-lg border-2 samsung-body font-semibold transition ${
                              status === 'absent'
                                ? 'bg-red-500 text-white border-red-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-red-500'
                            }`}
                          >
                            ✗ Qayıb
                          </button>
                          <button
                            onClick={() => updateAttendance(student.id, 'excused')}
                            className={`px-4 py-2 rounded-lg border-2 samsung-body font-semibold transition ${
                              status === 'excused'
                                ? 'bg-yellow-500 text-white border-yellow-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-500'
                            }`}
                          >
                            ⚠ Üzrlü
                          </button>
                        </div>
                      </div>

                      {/* Notes */}
                      {status && (
                        <div className="mt-4">
                          <input
                            type="text"
                            placeholder="Qeyd əlavə edin (istəyə bağlı)"
                            value={record?.notes || ''}
                            onChange={(e) => updateNotes(student.id, e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg samsung-body text-sm focus:border-samsung-blue focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Save Button */}
          {students.length > 0 && (
            <div className="flex items-center justify-between glass-card p-6">
              <div>
                {message && (
                  <p className={`samsung-body font-semibold ${
                    message.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {message.text}
                  </p>
                )}
              </div>
              <button
                onClick={saveAttendance}
                disabled={saving || Object.keys(attendance).length === 0}
                className="px-8 py-3 bg-samsung-blue hover:bg-samsung-blue-dark text-white rounded-lg samsung-body font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saxlanılır...' : 'Davamiyyəti Yadda Saxla'}
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGate>
  )
}
