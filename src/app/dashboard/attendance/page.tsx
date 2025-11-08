'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { AuthGate } from '@/components/AuthGate'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface AttendanceRecord {
  id: string
  lesson_date: string
  lesson_number: number
  lesson_title: string | null
  status: 'present' | 'absent' | 'excused'
  notes: string | null
  classes: {
    id: string
    name: string
  } | null
}

interface ClassStats {
  classId: string
  className: string
  total: number
  present: number
  absent: number
  excused: number
  percentage: number
}

export default function StudentAttendancePage() {
  const { profile } = useAuth()
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<ClassStats[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const fetchAttendance = async () => {
    setLoading(true)
    
    const { data } = await supabase
      .from('class_attendance')
      .select(`
        id,
        lesson_date,
        lesson_number,
        lesson_title,
        status,
        notes,
        classes (
          id,
          name
        )
      `)
      .eq('student_id', profile?.id)
      .order('lesson_date', { ascending: false })

    if (data) {
      setAttendance(data as unknown as AttendanceRecord[])
      calculateStats(data as unknown as AttendanceRecord[])
    }
    
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.id) {
      fetchAttendance()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const calculateStats = (records: AttendanceRecord[]) => {
    const classMap = new Map<string, ClassStats>()

    records.forEach(record => {
      if (!record.classes) return
      
      const classId = record.classes.id
      const className = record.classes.name

      if (!classMap.has(classId)) {
        classMap.set(classId, {
          classId,
          className,
          total: 0,
          present: 0,
          absent: 0,
          excused: 0,
          percentage: 0
        })
      }

      const stat = classMap.get(classId)!
      stat.total++
      
      if (record.status === 'present') stat.present++
      else if (record.status === 'absent') stat.absent++
      else if (record.status === 'excused') stat.excused++
    })

    const statsArray = Array.from(classMap.values()).map(stat => ({
      ...stat,
      percentage: stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0
    }))

    setStats(statsArray)
  }

  const filteredAttendance = selectedClass === 'all' 
    ? attendance 
    : attendance.filter(a => a.classes?.id === selectedClass)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <span className="px-3 py-1 rounded-full text-xs samsung-body font-semibold bg-green-100 text-green-800">✓ İştirak</span>
      case 'absent':
        return <span className="px-3 py-1 rounded-full text-xs samsung-body font-semibold bg-red-100 text-red-800">✗ Qayıb</span>
      case 'excused':
        return <span className="px-3 py-1 rounded-full text-xs samsung-body font-semibold bg-yellow-100 text-yellow-800">⚠ Üzrlü</span>
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <AuthGate>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl samsung-heading text-gray-900">Davamiyyət</h1>
            <p className="text-gray-600 samsung-body mt-1">Dərslərdəki iştirakınızı izləyin</p>
          </div>

          {/* Class Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map(stat => (
              <div key={stat.classId} className="glass-card p-6 hover:shadow-lg transition">
                <h3 className="font-semibold text-gray-900 samsung-body text-lg mb-4">
                  {stat.className}
                </h3>
                
                <div className="space-y-3">
                  {/* Attendance Percentage */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 samsung-body">İştirak Faizi</span>
                      <span className="text-2xl font-bold text-samsung-blue">{stat.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-samsung-blue to-samsung-cyan transition-all duration-500"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{stat.present}</div>
                      <div className="text-xs text-gray-600 samsung-body">İştirak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">{stat.absent}</div>
                      <div className="text-xs text-gray-600 samsung-body">Qayıb</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-yellow-600">{stat.excused}</div>
                      <div className="text-xs text-gray-600 samsung-body">Üzrlü</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="glass-card p-4">
            <label className="block text-sm samsung-body font-semibold text-gray-700 mb-2">
              Sinif üzrə filtr
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border-2 border-gray-200 rounded-lg samsung-body focus:border-samsung-blue focus:outline-none"
            >
              <option value="all">Bütün Siniflər</option>
              {stats.map(stat => (
                <option key={stat.classId} value={stat.classId}>
                  {stat.className}
                </option>
              ))}
            </select>
          </div>

          {/* Attendance Records */}
          <div className="glass-card">
            <div className="px-6 py-4 border-b-2 border-gray-100">
              <h2 className="text-xl samsung-heading text-gray-900">Davamiyyət Tarixçəsi</h2>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-samsung-blue border-t-transparent mx-auto"></div>
                <p className="mt-4 text-gray-600 samsung-body">Yüklənir...</p>
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 samsung-body">Hələ ki davamiyyət qeydi yoxdur.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredAttendance.map(record => (
                  <div key={record.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 samsung-body">
                            {record.classes?.name || 'Unknown Class'}
                          </h3>
                          {getStatusBadge(record.status)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 samsung-body">
                          <span>📅 {formatDate(record.lesson_date)}</span>
                          <span>📝 Dərs #{record.lesson_number}</span>
                          {record.lesson_title && (
                            <span className="font-medium text-gray-700">{record.lesson_title}</span>
                          )}
                        </div>

                        {record.notes && (
                          <div className="mt-3 p-3 bg-blue-50 border-l-4 border-samsung-blue rounded">
                            <p className="text-sm text-gray-700 samsung-body">
                              <span className="font-semibold">Qeyd:</span> {record.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGate>
  )
}
