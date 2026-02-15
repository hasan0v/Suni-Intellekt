'use client'

import DashboardLayout from '@/components/DashboardLayout'
import FileAttachmentLink from '@/components/FileAttachmentLink'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Utility function to extract file path from public URL
function extractFilePathFromUrl(url: string, bucket: string): string | null {
  try {
    const bucketPath = `/storage/v1/object/public/${bucket}/`
    const pathIndex = url.indexOf(bucketPath)
    if (pathIndex !== -1) {
      return url.substring(pathIndex + bucketPath.length)
    }
    return null
  } catch {
    return null
  }
}

interface SubmissionWithDetails {
  id: string
  file_url: string | null
  file_path?: string | null
  file_attachments?: Array<{
    name: string
    url: string
    size: number
  }>
  content?: string | null
  submitted_at: string
  graded_at?: string | null
  status: string
  points: number | null
  feedback: string | null
  student: {
    id: string
    full_name: string
  }
  task: {
    id: string
    title: string
    instructions: string
    max_score: number
    topic: {
      id: string
      title: string
      module: {
        id: string
        title: string
        course: {
          id: string
          title: string
        }
      }
    }
  }
}

type FilterType = 'all' | 'pending' | 'graded' | 'review_queue'
type SortOrder = 'newest' | 'oldest'

export default function AdminGradingPage() {
  const { user, profile } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [filter, setFilter] = useState<FilterType>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [sidebarVisible, setSidebarVisible] = useState(true)

  // Form states for grading
  const [points, setPoints] = useState('')
  const [feedback, setFeedback] = useState('')

  // AI Grading states
  const [aiGrading, setAiGrading] = useState(false)
  const [aiSuggestedScore, setAiSuggestedScore] = useState<number | null>(null)

  // Auto-grading states
  const [autoGrading, setAutoGrading] = useState(false)
  const [autoGradeStatus, setAutoGradeStatus] = useState<{
    pending: number
    reviewQueue: number
    lastRun: string | null
  } | null>(null)

  useEffect(() => {
    if (!profile) return
    fetchSubmissions()
  }, [profile, router])

  const fetchSubmissions = async () => {
    try {
      // Start with a completely simple query to debug
      console.log('Starting fetchSubmissions...')

      const simpleResult = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(50)

      if (simpleResult.error) {
        console.error('Simple submissions query failed:', simpleResult.error)
        throw simpleResult.error
      }

      let data = simpleResult.data

      if (data && data.length > 0) {
        // Fetch user profiles separately - using student_id instead of user_id
        const userIds = [...new Set(data.map(sub => sub.student_id).filter(id => id != null))]

        let users: Array<{ id: string, full_name: string }> = []
        if (userIds.length > 0) {
          // Query for user profiles
          const userResult = await supabase
            .from('user_profiles')
            .select('id, full_name')
            .in('id', userIds)

          if (userResult.data && userResult.data.length > 0) {
            // Map existing users
            users = userResult.data.map(user => ({
              id: user.id,
              full_name: user.full_name || 'No Name'
            }))

            // Check for missing users and create fallbacks only for those
            const foundUserIds = new Set(userResult.data.map(u => u.id))
            const missingUserIds = userIds.filter(id => !foundUserIds.has(id))

            if (missingUserIds.length > 0) {
              console.log(`Note: Some student profiles not found in database:`, missingUserIds)
              // Add fallback users only for missing ones
              const fallbackUsers = missingUserIds.map(id => ({
                id: id,
                full_name: 'Unknown Student'
              }))
              users = [...users, ...fallbackUsers]
            }
          } else {
            // No users found at all - create fallbacks for all
            users = userIds.map(id => ({
              id: id,
              full_name: 'Unknown Student'
            }))
            console.log(`Note: No student profiles found in database for:`, userIds)
          }
        }

        // Fetch tasks separately
        const taskIds = [...new Set(data.map(sub => sub.task_id).filter(id => id != null))]

        let tasks: Array<{ id: string, title: string, instructions: string, max_score: number }> = []
        if (taskIds.length > 0) {
          const taskResult = await supabase
            .from('tasks')
            .select('id, title, instructions, max_score')
            .in('id', taskIds)

          tasks = taskResult.data || []
        }

        // Combine the data manually - using student_id
        data = data.map(submission => {
          const matchedUser = users?.find(u => u.id === submission.student_id)
          return {
            ...submission,
            user_profiles: matchedUser,
            tasks: tasks?.find(t => t.id === submission.task_id)
          }
        })
      }

      console.log('Fetched submissions:', data?.length || 0)

      if (!data || data.length === 0) {
        setSubmissions([])
        return
      }

      // Process the data to match our interface
      const processedSubmissions = data.map(submission => {
        return {
          ...submission,
          student: submission.user_profiles || { id: '', full_name: 'Unknown Student' },
          task: submission.tasks ? {
            ...submission.tasks,
            topic: {
              id: '',
              title: 'Unknown Topic',
              module: {
                id: '',
                title: 'Unknown Module',
                course: {
                  id: '',
                  title: 'Unknown Course'
                }
              }
            }
          } : {
            id: '',
            title: 'Unknown Task',
            instructions: 'No instructions available',
            max_score: 0,
            topic: {
              id: '',
              title: 'Unknown Topic',
              module: {
                id: '',
                title: 'Unknown Module',
                course: {
                  id: '',
                  title: 'Unknown Course'
                }
              }
            }
          }
        }
      })

      setSubmissions(processedSubmissions)
    } catch (error) {
      console.error('Error fetching submissions - all methods failed:', error)
      // Set empty array on error so the UI still works
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = async () => {
    if (!selectedSubmission || !points) return

    setGrading(true)
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          points: parseInt(points),
          feedback: feedback.trim() || null,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: user?.id
        })
        .eq('id', selectedSubmission.id)

      if (error) throw error

      // Update local state
      setSubmissions(prev => prev.map(sub =>
        sub.id === selectedSubmission.id
          ? {
            ...sub,
            points: parseInt(points),
            feedback: feedback.trim() || null,
            status: 'graded',
            graded_at: new Date().toISOString()
          }
          : sub
      ))

      setSelectedSubmission({
        ...selectedSubmission,
        points: parseInt(points),
        feedback: feedback.trim() || null,
        status: 'graded',
        graded_at: new Date().toISOString()
      })

      showSuccess('Grade Submitted', 'Grade has been submitted successfully!')
    } catch (error) {
      console.error('Error grading submission:', error)
      showError('Grading Failed', 'Error submitting grade. Please try again.')
    } finally {
      setGrading(false)
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    const matchesFilter =
      filter === 'pending' ? sub.status === 'submitted' :
        filter === 'graded' ? sub.status === 'graded' :
          filter === 'review_queue' ? sub.status === 'pending_review' :
            true

    const matchesSearch = !searchTerm || (
      (sub.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (sub.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (sub.task?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (sub.task?.topic?.module?.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      // Also search by submission ID
      (sub.id?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    )

    return matchesFilter && matchesSearch
  }).sort((a, b) => {
    const dateA = new Date(a.submitted_at).getTime()
    const dateB = new Date(b.submitted_at).getTime()
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })

  const selectSubmission = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission)
    setAiSuggestedScore(null) // Reset AI suggestion when selecting new submission
    if (submission.status === 'graded') {
      setPoints(submission.points !== null ? submission.points.toString() : '')
      setFeedback(submission.feedback || '')
    } else {
      setPoints('')
      setFeedback('')
    }
  }

  const handleAIGrade = async (submission: SubmissionWithDetails) => {
    if (!submission.file_url && !submission.content) {
      showError('No submission content', 'No submission content to grade')
      return
    }

    setAiGrading(true)
    try {
      const response = await fetch('/api/ai/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebookContent: submission.content,
          fileUrl: submission.file_url,
          studentName: submission.student?.full_name || 'Unknown Student'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get AI grading')
      }

      const data = await response.json()

      // Set the AI feedback and suggested score
      setFeedback(data.feedback)
      if (data.suggestedScore !== null) {
        setPoints(data.suggestedScore.toString())
        setAiSuggestedScore(data.suggestedScore)
      }

      showSuccess('AI Grading Complete', 'AI grading complete! Review and adjust before saving.')
    } catch (error) {
      console.error('AI grading error:', error)
      showError('AI Grading Failed', error instanceof Error ? error.message : 'Failed to get AI grading')
    } finally {
      setAiGrading(false)
    }
  }

  const stats = useMemo(() => {
    const total = submissions.length
    const pending = submissions.filter(s => s.status === 'submitted').length
    const graded = submissions.filter(s => s.status === 'graded').length
    const avgScore = graded > 0
      ? submissions
        .filter(s => s.status === 'graded' && s.points !== null)
        .reduce((sum, s) => sum + (s.points || 0), 0) / graded
      : 0

    return { total, pending, graded, avgScore }
  }, [submissions])

  // Role gating handled by ProtectedRoute wrapper below

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
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Grading Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Review and grade student submissions
              </p>
            </div>

            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="inline-flex items-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
              title={sidebarVisible ? 'Hide topics sidebar' : 'Show topics sidebar'}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {sidebarVisible ? (
                  // Hide sidebar icon (panel close)
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                ) : (
                  // Show sidebar icon (panel open)
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">📝</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Submissions</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">⏳</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">✅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Graded</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.graded}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-samsung-purple rounded-md flex items-center justify-center">
                      <span className="text-white text-sm samsung-body">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.avgScore.toFixed(1)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'graded', 'review_queue'] as const).map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-4 py-2.5 text-sm samsung-body rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md ${filter === filterOption
                      ? filterOption === 'review_queue'
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-200'
                        : 'bg-gradient-to-r from-samsung-blue to-blue-600 text-white shadow-blue-200'
                      : filterOption === 'review_queue'
                        ? 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'
                        : 'bg-white text-samsung-gray-700 border border-samsung-gray-200 hover:bg-samsung-gray-50'
                      }`}
                  >
                    {filterOption === 'all' && <span>📋</span>}
                    {filterOption === 'pending' && <span>⏳</span>}
                    {filterOption === 'graded' && <span>✅</span>}
                    {filterOption === 'review_queue' && <span>⚠️</span>}
                    {filterOption === 'review_queue' ? 'Review' : filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${filter === filterOption
                      ? 'bg-white/20'
                      : filterOption === 'review_queue'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-samsung-gray-100 text-samsung-gray-600'
                      }`}>
                      {
                        filterOption === 'all' ? submissions.length :
                          filterOption === 'pending' ? submissions.filter(sub => sub.status === 'submitted').length :
                            filterOption === 'graded' ? submissions.filter(sub => sub.status === 'graded').length :
                              submissions.filter(sub => sub.status === 'pending_review').length
                      }
                    </span>
                  </button>
                ))}

                {/* Auto-Grade Button */}
                <button
                  onClick={async () => {
                    setAutoGrading(true)
                    try {
                      const res = await fetch('/api/admin/auto-grade', { method: 'POST' })
                      const data = await res.json()
                      if (data.success) {
                        showSuccess(`Auto-graded ${data.graded} submissions. ${data.flaggedForReview} flagged for review.`)
                        fetchSubmissions()
                      } else {
                        showError(data.error || 'Auto-grading failed')
                      }
                    } catch (e) {
                      showError('Auto-grading failed')
                    } finally {
                      setAutoGrading(false)
                    }
                  }}
                  disabled={autoGrading}
                  className="px-5 py-2.5 text-sm samsung-body rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-sm hover:shadow-lg hover:shadow-teal-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {autoGrading ? (
                    <>
                      <span className="animate-spin">⚡</span>
                      <span>Grading...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🤖</span>
                      <span>Auto-Grade</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sort Toggle */}
              <button
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="inline-flex items-center px-4 py-2 text-sm samsung-body rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                title={sortOrder === 'newest' ? 'Showing newest first' : 'Showing oldest first'}
              >
                {sortOrder === 'newest' ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                    Yeni → Köhnə
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                    </svg>
                    Köhnə → Yeni
                  </>
                )}
              </button>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search students, tasks, or courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full md:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className={`grid gap-6 transition-all duration-300 ${sidebarVisible ? 'grid-cols-1 lg:grid-cols-[2fr_2fr_320px]' : 'grid-cols-1 lg:grid-cols-2'
            }`} style={{ minHeight: 'calc(100vh - 22rem)' }}>
            {/* Submissions List */}
            <div className="glass-card border-2 border-samsung-gray-100 rounded-2xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg samsung-heading text-samsung-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-samsung-blue"></span>
                  Submissions ({filteredSubmissions.length})
                </h3>

                {filteredSubmissions.length > 0 ? (
                  <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 28rem)' }}>
                    {filteredSubmissions.map((submission) => (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => selectSubmission(submission)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selectedSubmission?.id === submission.id
                          ? 'border-samsung-blue bg-samsung-blue/5 shadow-md'
                          : 'border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm samsung-body text-gray-900">
                            {submission.student.full_name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs samsung-body rounded-full ${submission.status === 'graded' ? 'bg-green-100 text-green-800' : submission.status === 'pending_review' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {submission.status === 'graded' ? '✅ Graded' : submission.status === 'pending_review' ? '⚠️ Review' : '⏳ Pending'}
                            </span>
                            {(submission.status === 'graded' || submission.status === 'pending_review') && submission.points !== null && (
                              <span className={`text-sm font-medium ${submission.status === 'pending_review' ? 'text-orange-600' : 'text-green-600'}`}>
                                {submission.points}/{submission.task.max_score}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-sm">
                          <p className="samsung-body text-gray-900 mb-1">{submission.task.title}</p>
                          <p className="text-gray-600 text-xs mb-2">
                            📚 {submission.task.topic.module.course.title} › {submission.task.topic.module.title} › {submission.task.topic.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            📅 Submitted: {new Date(submission.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📝</div>
                    <p className="text-gray-500">
                      {searchTerm ? 'No submissions match your search' : 'No submissions found'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Grading Panel */}
            <div className="glass-card border-2 border-samsung-gray-100 rounded-2xl overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                {selectedSubmission ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Student Info */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg samsung-heading text-gray-900">
                          {selectedSubmission.student?.full_name || 'Unknown Student'}
                        </h3>
                        <span className={`px-3 py-1 text-sm samsung-body rounded-full ${selectedSubmission.status === 'graded'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {selectedSubmission.status === 'graded' ? '✅ Graded' : '⏳ Pending Review'}
                        </span>
                      </div>
                    </div>

                    {/* Assignment Info */}
                    <div>
                      <h4 className="text-sm samsung-body text-gray-900 mb-2">Assignment</h4>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {selectedSubmission.task?.title || 'Task title not available'}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          📚 {selectedSubmission.task?.topic?.module?.course?.title || 'Course'} › {selectedSubmission.task?.topic?.module?.title || 'Module'} › {selectedSubmission.task?.topic?.title || 'Topic'}
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          {selectedSubmission.task?.instructions || 'No instructions available'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Max Score: {selectedSubmission.task?.max_score || 'N/A'} points
                        </p>
                      </div>
                    </div>

                    {/* Submission Content */}
                    <div>
                      <h4 className="text-sm samsung-body text-gray-900 mb-2">Submission</h4>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <p className="text-xs text-gray-500">
                          📅 Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                        </p>
                        {selectedSubmission.graded_at && (
                          <p className="text-xs text-gray-500">
                            ✅ Graded: {new Date(selectedSubmission.graded_at).toLocaleString()}
                          </p>
                        )}

                        {/* Written Content */}
                        {selectedSubmission.content && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Written Response:</p>
                            <div className="bg-white p-3 rounded border text-sm text-gray-700 whitespace-pre-wrap">
                              {selectedSubmission.content}
                            </div>
                          </div>
                        )}

                        {/* File Attachments */}
                        {selectedSubmission.file_attachments && Array.isArray(selectedSubmission.file_attachments) && selectedSubmission.file_attachments.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">📎 Attachments:</p>
                            <div className="space-y-2">
                              {selectedSubmission.file_attachments.map((attachment, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <FileAttachmentLink
                                    bucket="task-submissions"
                                    filePath={extractFilePathFromUrl(attachment?.url || '', 'task-submissions')}
                                    fileName={attachment?.name}
                                  >
                                    {attachment?.name || `Attachment ${index + 1}`}
                                  </FileAttachmentLink>
                                  <span className="text-xs text-gray-500">
                                    ({((attachment?.size || 0) / 1024).toFixed(1)} KB)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Legacy file_url support */}
                        {selectedSubmission.file_url && !selectedSubmission.file_attachments && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">📎 Submitted file:</p>
                            <FileAttachmentLink
                              bucket="task-submissions"
                              filePath={extractFilePathFromUrl(selectedSubmission.file_url, 'task-submissions')}
                              fileName="Submitted File"
                            >
                              View File
                            </FileAttachmentLink>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Grading Form */}
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-sm samsung-heading text-gray-900 mb-4">
                        {selectedSubmission.status === 'graded' ? 'Update Grade' : 'Grade Assignment'}
                      </h4>

                      {/* AI Grading Button */}
                      <motion.button
                        whileHover={{ scale: aiGrading ? 1 : 1.02 }}
                        whileTap={{ scale: aiGrading ? 1 : 0.98 }}
                        onClick={() => selectedSubmission && handleAIGrade(selectedSubmission)}
                        disabled={aiGrading || !selectedSubmission}
                        className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                      >
                        {aiGrading ? (
                          <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            AI Qiymətləndirir...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            AI ilə Qiymətləndir
                          </>
                        )}
                      </motion.button>

                      {aiSuggestedScore !== null && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-4 p-3 bg-purple-50 border-2 border-purple-200 rounded-xl"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <p className="text-sm text-purple-800 font-semibold">
                              AI Tövsiyə olunan bal: <span className="text-purple-900">{aiSuggestedScore}/{selectedSubmission.task.max_score}</span>
                            </p>
                          </div>
                        </motion.div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm samsung-body text-gray-700 mb-2">
                            Points * (Max: {selectedSubmission.task.max_score})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={selectedSubmission.task.max_score}
                            value={points}
                            onChange={(e) => setPoints(e.target.value)}
                            className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-samsung-blue/20 focus:border-samsung-blue sm:text-sm text-gray-900"
                            placeholder={`Enter points (0-${selectedSubmission.task.max_score})`}
                          />
                        </div>

                        <div>
                          <label className="block text-sm samsung-body text-gray-700 mb-2">
                            Feedback
                          </label>
                          <div className="space-y-2">
                            <textarea
                              rows={8}
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              className="block w-full border-gray-300 rounded-xl shadow-sm focus:ring-samsung-blue/20 focus:border-samsung-blue sm:text-sm text-gray-900 font-mono"
                              placeholder="Provide feedback to the student..."
                            />
                            {feedback && (
                              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                                <p className="text-xs text-gray-500 mb-2 font-semibold">Preview:</p>
                                <div className="prose prose-sm max-w-none">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {feedback}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <motion.button
                            whileHover={{ scale: grading ? 1 : 1.05 }}
                            whileTap={{ scale: grading ? 1 : 0.95 }}
                            onClick={handleGrade}
                            disabled={!points || grading}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm samsung-body rounded-xl text-white bg-samsung-blue hover:bg-samsung-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue/20 disabled:opacity-50 transition-all"
                          >
                            {grading ? (
                              <>
                                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                {selectedSubmission.status === 'graded' ? 'Updating...' : 'Grading...'}
                              </>
                            ) : (
                              <>
                                {selectedSubmission.status === 'graded' ? '💾 Update Grade' : '✅ Submit Grade'}
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Current Grade Display */}
                    {selectedSubmission.status === 'graded' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 border border-green-200 rounded-xl p-4"
                      >
                        <h5 className="text-sm samsung-heading text-green-900 mb-2">✅ Current Grade</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Points:</span>
                            <span className="text-sm font-medium text-green-900">
                              {selectedSubmission.points}/{selectedSubmission.task.max_score}
                            </span>
                          </div>
                          {selectedSubmission.feedback && (
                            <div>
                              <span className="text-sm text-green-700">Feedback:</span>
                              <div className="text-sm text-green-900 mt-1 prose prose-sm max-w-none prose-green">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {selectedSubmission.feedback}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="text-gray-400 text-6xl mb-4">✏️</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a submission to grade
                      </h3>
                      <p className="text-gray-500">
                        Choose a submission from the left panel to start grading
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Topics Sidebar */}
            {sidebarVisible && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="glass-card border-2 border-samsung-gray-100 rounded-2xl overflow-hidden h-fit"
              >
                <div className="p-4 border-b border-samsung-gray-100 bg-gradient-to-r from-samsung-blue/5 to-transparent">
                  <h3 className="text-lg font-semibold text-gray-900">Course Topics</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedSubmission
                      ? `${selectedSubmission.task.topic.module.course.title}`
                      : 'Select a submission to view course topics'
                    }
                  </p>
                </div>

                <div className="p-4 overflow-y-auto max-h-96">
                  {selectedSubmission ? (
                    <div className="space-y-4">
                      {/* Current Module */}
                      <div className="glass-card border-2 border-samsung-blue/20 rounded-xl p-3">
                        <h4 className="text-sm samsung-heading text-gray-900 mb-1">
                          📚 {selectedSubmission.task.topic.module.title}
                        </h4>
                        <div className="bg-samsung-blue/10 rounded-xl p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm samsung-body text-samsung-blue">
                              📝 {selectedSubmission.task.topic.title}
                            </span>
                            <span className="text-xs samsung-body bg-samsung-blue/20 text-samsung-blue px-2 py-1 rounded-xl">
                              Current
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Assignment Stats */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                        <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Assignment Info
                        </h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Max Score:</span>
                            <span className="font-medium text-gray-900">{selectedSubmission.task.max_score} pts</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-medium ${selectedSubmission.status === 'graded' ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                              {selectedSubmission.status === 'graded' ? 'Graded' : 'Pending'}
                            </span>
                          </div>
                          {selectedSubmission.status === 'graded' && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Score:</span>
                              <span className="font-medium text-green-600">
                                {selectedSubmission.points}/{selectedSubmission.task.max_score}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">📖</div>
                      <p className="text-sm text-gray-500">
                        Select a submission to view course topics
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute >
  )
}
