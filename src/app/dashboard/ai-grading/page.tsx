'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Bot, CheckCircle, XCircle, Clock, AlertTriangle,
  Play, RefreshCw, Zap, Eye, Edit3, ThumbsUp,
  BarChart3, TrendingUp, Shield,
  Sparkles, ChevronDown, ChevronUp, Activity
} from 'lucide-react'

interface AIGradingItem {
  id: string
  student_id: string
  task_id: string
  content: string | null
  file_url: string | null
  submitted_at: string
  status: string
  points: number | null
  feedback: string | null
  ai_score: number | null
  needs_review: boolean
  auto_graded_at: string | null
  graded_at: string | null
  student_name: string
  task_title: string
  task_instructions: string
  max_score: number
  course_title: string
}

interface TestResult {
  student: string
  score: number | null
  feedback: string
  model: string
  tokensUsed?: number
  error?: string
  duration: number
}

interface TestResponse {
  success: boolean
  testPassed: boolean
  model: string
  scoreOrderCorrect: boolean
  summary: {
    totalTests: number
    passed: number
    failed: number
    averageScore: number
    totalTokens: number
    totalDuration: number
  }
  results: TestResult[]
  error?: string
}

type ViewTab = 'dashboard' | 'review' | 'history' | 'test'

export default function AIGradingPage() {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotifications()

  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard')
  const [loading, setLoading] = useState(true)
  const [autoGrading, setAutoGrading] = useState(false)

  // Dashboard data
  const [, setPendingCount] = useState(0)
  const [reviewQueue, setReviewQueue] = useState<AIGradingItem[]>([])
  const [recentGraded, setRecentGraded] = useState<AIGradingItem[]>([])
  const [allSubmissions, setAllSubmissions] = useState<AIGradingItem[]>([])
  const [stats, setStats] = useState({
    totalAutoGraded: 0,
    totalPending: 0,
    totalReview: 0,
    avgAiScore: 0,
    lastRunAt: null as string | null
  })

  // Review state
  const [selectedItem, setSelectedItem] = useState<AIGradingItem | null>(null)
  const [editScore, setEditScore] = useState('')
  const [editFeedback, setEditFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)

  // Test state
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<TestResponse | null>(null)
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null)

  const fetchData = useCallback(async () => {
    try {
      // Fetch all submissions with AI grading data
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .limit(200)

      if (error) throw error

      if (!submissions || submissions.length === 0) {
        setAllSubmissions([])
        setReviewQueue([])
        setRecentGraded([])
        setLoading(false)
        return
      }

      // Get student profiles
      const studentIds = [...new Set(submissions.map(s => s.student_id).filter(Boolean))]
      const { data: students } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', studentIds)
      const studentMap = new Map(students?.map(s => [s.id, s.full_name || 'Unknown']) || [])

      // Get tasks
      const taskIds = [...new Set(submissions.map(s => s.task_id).filter(Boolean))]
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, instructions, max_score')
        .in('id', taskIds)
      const taskMap = new Map(tasks?.map(t => [t.id, t]) || [])

      // Process submissions
      const processed: AIGradingItem[] = submissions.map(s => {
        const task = taskMap.get(s.task_id)
        return {
          id: s.id,
          student_id: s.student_id,
          task_id: s.task_id,
          content: s.content,
          file_url: s.file_url,
          submitted_at: s.submitted_at,
          status: s.status,
          points: s.points,
          feedback: s.feedback,
          ai_score: s.ai_score || null,
          needs_review: s.needs_review || false,
          auto_graded_at: s.auto_graded_at || null,
          graded_at: s.graded_at,
          student_name: studentMap.get(s.student_id) || 'Unknown Student',
          task_title: task?.title || 'Unknown Task',
          task_instructions: task?.instructions || '',
          max_score: task?.max_score || 100,
          course_title: ''
        }
      })

      setAllSubmissions(processed)
      setReviewQueue(processed.filter(s => s.status === 'pending_review' || s.needs_review))
      setRecentGraded(processed.filter(s => s.auto_graded_at).slice(0, 20))
      setPendingCount(processed.filter(s => s.status === 'submitted').length)

      // Calculate stats
      const autoGradedItems = processed.filter(s => s.auto_graded_at)
      const aiScores = autoGradedItems.filter(s => s.ai_score !== null).map(s => s.ai_score as number)
      setStats({
        totalAutoGraded: autoGradedItems.length,
        totalPending: processed.filter(s => s.status === 'submitted').length,
        totalReview: processed.filter(s => s.status === 'pending_review' || s.needs_review).length,
        avgAiScore: aiScores.length > 0 ? Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length) : 0,
        lastRunAt: autoGradedItems.length > 0 ? autoGradedItems[0].auto_graded_at : null
      })

    } catch (error) {
      console.error('Error fetching AI grading data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Test AI connection
  const testConnection = async () => {
    try {
      const res = await fetch('/api/ai/grade')
      const data = await res.json()
      setConnectionOk(data.success)
      if (data.success) {
        showSuccess('AI Connection', `Connected to ${data.model}`)
      } else {
        showError('AI Connection Failed', data.error || 'Could not connect to OpenRouter')
      }
    } catch {
      setConnectionOk(false)
      showError('Connection Error', 'Failed to test AI connection')
    }
  }

  // Run test with 3 students
  const runTestGrading = async () => {
    setTesting(true)
    setTestResults(null)
    try {
      const res = await fetch('/api/ai/test-grading')
      const data: TestResponse = await res.json()
      setTestResults(data)
      if (data.testPassed) {
        showSuccess('Test Passed!', `All 3 students graded successfully. Avg score: ${data.summary.averageScore}`)
      } else if (data.success) {
        showSuccess('Test Complete', `Grading works but score ordering may need review`)
      } else {
        showError('Test Failed', data.error || 'One or more test submissions failed')
      }
    } catch {
      showError('Test Error', 'Failed to run test grading')
    } finally {
      setTesting(false)
    }
  }

  // Auto-grading batch size
  const [batchSize, setBatchSize] = useState(3)

  // Run auto-grading on pending submissions
  const runAutoGrading = async () => {
    setAutoGrading(true)
    try {
      const res = await fetch('/api/admin/auto-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize })
      })
      const data = await res.json()
      if (data.success) {
        showSuccess('Auto-Grading Complete',
          `Processed: ${data.processed} | Graded: ${data.graded} | For Review: ${data.flaggedForReview}`)
        fetchData()
      } else {
        showError('Auto-Grading Failed', data.error || 'Unknown error')
      }
    } catch {
      showError('Error', 'Failed to run auto-grading')
    } finally {
      setAutoGrading(false)
    }
  }

  // Accept AI grade
  const acceptGrade = async (item: AIGradingItem) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: user?.id,
          needs_review: false
        })
        .eq('id', item.id)

      if (error) throw error
      showSuccess('Grade Accepted', `${item.student_name}'s submission graded as ${item.points}/${item.max_score}`)
      fetchData()
      setSelectedItem(null)
    } catch {
      showError('Error', 'Failed to accept grade')
    } finally {
      setSaving(false)
    }
  }

  // Modify and accept grade
  const modifyAndAccept = async () => {
    if (!selectedItem || !editScore) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          points: parseInt(editScore),
          feedback: editFeedback || selectedItem.feedback,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: user?.id,
          needs_review: false
        })
        .eq('id', selectedItem.id)

      if (error) throw error
      showSuccess('Grade Updated', `Updated to ${editScore}/${selectedItem.max_score}`)
      fetchData()
      setSelectedItem(null)
    } catch {
      showError('Error', 'Failed to update grade')
    } finally {
      setSaving(false)
    }
  }

  // Select item for review
  const selectForReview = (item: AIGradingItem) => {
    setSelectedItem(item)
    setEditScore(item.points?.toString() || '')
    setEditFeedback(item.feedback || '')
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-samsung-blue/20 rounded-full animate-spin border-t-samsung-blue mx-auto" />
                <Bot className="w-8 h-8 text-samsung-blue absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-samsung-gray-600 samsung-body">Loading AI Grading System...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl samsung-heading text-samsung-gray-900">AI Auto-Grading</h1>
                <p className="text-sm samsung-body text-samsung-gray-600">
                  Powered by OpenRouter &middot; z-ai/glm-5
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${connectionOk === true ? 'bg-green-100 text-green-700' :
                connectionOk === false ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                <span className={`w-2 h-2 rounded-full ${connectionOk === true ? 'bg-green-500' :
                  connectionOk === false ? 'bg-red-500' :
                    'bg-gray-400'
                  }`} />
                {connectionOk === true ? 'Connected' : connectionOk === false ? 'Disconnected' : 'Not tested'}
              </span>
              <button
                onClick={testConnection}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                title="Test AI connection"
              >
                <Activity className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
            {[
              { id: 'dashboard' as ViewTab, label: 'Dashboard', icon: BarChart3 },
              { id: 'review' as ViewTab, label: `Review Queue (${stats.totalReview})`, icon: Eye },
              { id: 'history' as ViewTab, label: 'History', icon: Clock },
              { id: 'test' as ViewTab, label: 'Test AI', icon: Sparkles },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm samsung-body transition-all ${activeTab === tab.id
                  ? 'bg-white text-samsung-blue shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Pending', value: stats.totalPending, icon: Clock, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
                  { label: 'Review Queue', value: stats.totalReview, icon: AlertTriangle, color: 'from-orange-400 to-red-500', bg: 'bg-orange-50' },
                  { label: 'Auto-Graded', value: stats.totalAutoGraded, icon: Zap, color: 'from-green-400 to-emerald-500', bg: 'bg-green-50' },
                  { label: 'Avg AI Score', value: stats.avgAiScore, icon: TrendingUp, color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50' },
                  { label: 'Total', value: allSubmissions.length, icon: BarChart3, color: 'from-purple-400 to-indigo-500', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`${stat.bg} rounded-2xl p-5 border border-white/60`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl samsung-heading text-gray-900">{stat.value}</p>
                    <p className="text-xs samsung-body text-gray-500 mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={runAutoGrading}
                  disabled={autoGrading || stats.totalPending === 0}
                  className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      {autoGrading ? (
                        <RefreshCw className="w-7 h-7 animate-spin" />
                      ) : (
                        <Zap className="w-7 h-7" />
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold">
                        {autoGrading ? 'Auto-Grading in Progress...' : 'Run Auto-Grading'}
                      </h3>
                      <p className="text-sm opacity-80">
                        {stats.totalPending} pending submissions to process
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs opacity-70">Batch size:</span>
                        <select
                          value={batchSize}
                          onChange={(e) => setBatchSize(parseInt(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-white/20 text-white text-xs rounded px-2 py-0.5 border border-white/30 focus:outline-none"
                        >
                          {[1, 3, 5, 10, 15, 20].map(n => (
                            <option key={n} value={n} className="text-gray-900">{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setActiveTab('review')}
                  disabled={stats.totalReview === 0}
                  className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 text-white shadow-lg shadow-orange-200 disabled:opacity-50 group"
                >
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Eye className="w-7 h-7" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold">Review AI Grades</h3>
                      <p className="text-sm opacity-80">
                        {stats.totalReview} submissions need your review
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Recent Auto-Graded */}
              {recentGraded.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="samsung-heading text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                      Recent AI Grades
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {recentGraded.slice(0, 8).map((item) => (
                      <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${item.status === 'graded' ? 'bg-green-500' :
                            item.status === 'pending_review' ? 'bg-orange-500' : 'bg-gray-400'
                            }`}>
                            {item.ai_score ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.student_name}</p>
                            <p className="text-xs text-gray-500 truncate">{item.task_title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'graded' ? 'bg-green-100 text-green-700' :
                            item.status === 'pending_review' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                            {item.status === 'graded' ? 'Graded' :
                              item.status === 'pending_review' ? 'Review' : item.status}
                          </span>
                          {item.points !== null && (
                            <span className="text-sm font-medium text-gray-700">
                              {item.points}/{item.max_score}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Review Queue Tab */}
          {activeTab === 'review' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {reviewQueue.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg samsung-heading text-gray-900 mb-2">All Clear!</h3>
                  <p className="text-gray-500 samsung-body">No submissions require review right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
                  {/* Review List */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
                      <h3 className="samsung-heading text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Needs Review ({reviewQueue.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto">
                      {reviewQueue.map((item) => (
                        <motion.div
                          key={item.id}
                          onClick={() => selectForReview(item)}
                          className={`p-4 cursor-pointer transition-all duration-150 ${selectedItem?.id === item.id
                            ? 'bg-samsung-blue/5 border-l-4 border-l-samsung-blue'
                            : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                            }`}
                          whileHover={{ x: 2 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-900">{item.student_name}</span>
                            <span className="text-sm font-bold text-orange-600">{item.ai_score ?? item.points ?? '?'}/{item.max_score}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{item.task_title}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {item.auto_graded_at ? new Date(item.auto_graded_at).toLocaleString() : new Date(item.submitted_at).toLocaleString()}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Review Detail */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {selectedItem ? (
                      <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="samsung-heading text-gray-900">{selectedItem.student_name}</h3>
                              <p className="text-sm text-gray-500">{selectedItem.task_title}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{selectedItem.ai_score ?? '?'}</div>
                                <div className="text-xs text-gray-500">AI Score</div>
                              </div>
                              <div className="text-gray-300">/</div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-400">{selectedItem.max_score}</div>
                                <div className="text-xs text-gray-500">Max</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* AI Feedback */}
                        <div className="p-5 flex-1 overflow-y-auto max-h-[40vh]">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Bot className="w-4 h-4 text-purple-500" />
                            AI Feedback
                          </h4>
                          {selectedItem.feedback ? (
                            <div className="prose prose-sm max-w-none bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {selectedItem.feedback}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm italic">No AI feedback available</p>
                          )}

                          {/* Submission content preview */}
                          {selectedItem.content && (
                            <div className="mt-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Submission Content</h4>
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-40 overflow-y-auto">
                                <pre className="text-xs text-gray-600 whitespace-pre-wrap">{selectedItem.content.substring(0, 2000)}</pre>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Panel */}
                        <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Score</label>
                              <input
                                type="number"
                                min="0"
                                max={selectedItem.max_score}
                                value={editScore}
                                onChange={(e) => setEditScore(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue text-gray-900"
                              />
                            </div>
                            <div className="flex items-end">
                              <span className="text-sm text-gray-500 pb-2">/ {selectedItem.max_score}</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Feedback (edit if needed)</label>
                            <textarea
                              rows={3}
                              value={editFeedback}
                              onChange={(e) => setEditFeedback(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue text-gray-900 font-mono"
                              placeholder="AI feedback will be used if empty..."
                            />
                          </div>

                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => acceptGrade(selectedItem)}
                              disabled={saving}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              Accept AI Grade
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={modifyAndAccept}
                              disabled={saving || !editScore}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-samsung-blue to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                              Modify & Accept
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                          <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 samsung-body">Select a submission to review</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="samsung-heading text-gray-900">All AI-Graded Submissions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Task</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">AI Score</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Final</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Graded At</th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allSubmissions.filter(s => s.auto_graded_at || s.status === 'graded').map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="text-sm font-medium text-gray-900">{item.student_name}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600 truncate block max-w-[200px]">{item.task_title}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold ${item.ai_score !== null
                              ? item.ai_score >= 70 ? 'bg-green-100 text-green-700'
                                : item.ai_score >= 40 ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-400'
                              }`}>
                              {item.ai_score ?? '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm font-semibold text-gray-900">{item.points ?? '-'}/{item.max_score}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'graded' ? 'bg-green-100 text-green-700' :
                              item.status === 'pending_review' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                              {item.status === 'graded' ? '✅ Graded' :
                                item.status === 'pending_review' ? '⚠️ Review' : item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs text-gray-500">
                              {item.auto_graded_at ? new Date(item.auto_graded_at).toLocaleString() : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setExpandedFeedback(expandedFeedback === item.id ? null : item.id)
                              }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                              title="View feedback"
                            >
                              {expandedFeedback === item.id ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {allSubmissions.filter(s => s.auto_graded_at || s.status === 'graded').length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-gray-400">
                            No graded submissions yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Expanded Feedback */}
                <AnimatePresence>
                  {expandedFeedback && (() => {
                    const item = allSubmissions.find(s => s.id === expandedFeedback)
                    if (!item?.feedback) return null
                    return (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 bg-purple-50/30 overflow-hidden"
                      >
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Bot className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-semibold text-purple-700">AI Feedback for {item.student_name}</span>
                          </div>
                          <div className="prose prose-sm max-w-none bg-white rounded-xl p-4 border border-purple-100">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {item.feedback}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })()}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Test AI Tab */}
          {activeTab === 'test' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Test Info Card */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="samsung-heading text-gray-900 mb-1">AI Grading Test Suite</h3>
                    <p className="text-sm text-gray-600 samsung-body">
                      Tests the AI grading system with 3 mock student submissions of varying quality
                      (Excellent, Average, Poor). Validates that the AI can correctly differentiate
                      between submission qualities and provide meaningful feedback in Azerbaijani.
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={testConnection}
                  className="rounded-2xl p-5 bg-white border-2 border-gray-100 hover:border-samsung-blue/30 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-6 h-6 text-samsung-blue" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Test Connection</h4>
                      <p className="text-xs text-gray-500">Verify OpenRouter API connectivity</p>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={runTestGrading}
                  disabled={testing}
                  className="rounded-2xl p-5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-200 disabled:opacity-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    {testing ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                    <div>
                      <h4 className="font-semibold">{testing ? 'Running Tests...' : 'Run Full Test (3 Students)'}</h4>
                      <p className="text-xs opacity-80">Grade 3 mock submissions with varying quality</p>
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Test Results */}
              {testResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Summary Card */}
                  <div className={`rounded-2xl p-6 border-2 ${testResults.testPassed
                    ? 'bg-green-50 border-green-200'
                    : testResults.success
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                    }`}>
                    <div className="flex items-center gap-3 mb-4">
                      {testResults.testPassed ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      ) : testResults.success ? (
                        <AlertTriangle className="w-8 h-8 text-yellow-500" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-500" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {testResults.testPassed ? 'All Tests Passed!' :
                            testResults.success ? 'Tests Complete (Review Needed)' :
                              'Test Failed'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Model: {testResults.model} | Duration: {(testResults.summary.totalDuration / 1000).toFixed(1)}s
                          | Tokens: {testResults.summary.totalTokens}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-white/60 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-gray-900">{testResults.summary.passed}/{testResults.summary.totalTests}</p>
                        <p className="text-xs text-gray-500">Passed</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-gray-900">{testResults.summary.averageScore}</p>
                        <p className="text-xs text-gray-500">Avg Score</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-gray-900">{testResults.scoreOrderCorrect ? '✅' : '❌'}</p>
                        <p className="text-xs text-gray-500">Score Order</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-gray-900">{testResults.summary.totalTokens}</p>
                        <p className="text-xs text-gray-500">Tokens</p>
                      </div>
                    </div>
                  </div>

                  {/* Individual Results */}
                  {testResults.results.map((result, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${result.score !== null
                            ? result.score >= 70 ? 'bg-green-500'
                              : result.score >= 40 ? 'bg-yellow-500'
                                : 'bg-red-500'
                            : 'bg-gray-400'
                            }`}>
                            {result.score ?? '?'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{result.student}</h4>
                            <p className="text-xs text-gray-500">
                              {result.duration}ms | {result.tokensUsed || 0} tokens
                            </p>
                          </div>
                        </div>
                        {result.error && (
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Error: {result.error}
                          </span>
                        )}
                      </div>
                      {result.feedback && (
                        <div className="p-4 max-h-64 overflow-y-auto">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {result.feedback}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
