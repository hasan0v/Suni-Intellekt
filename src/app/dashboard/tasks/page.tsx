'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { supabase } from '@/lib/supabase'
import { uploadTaskFile } from '@/lib/storage'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardIcon, Check as CheckIcon, Clock as ClockIcon, TrendingUp as TrendingUpIcon, ArrowRight as ArrowRightIcon } from 'lucide-react'

interface TaskAttachment {
  name: string
  url: string
  size: number
  type: string
}

interface TaskWithDetails {
  id: string
  title: string
  description: string
  content: string
  instructions?: string
  topics: string[]
  due_date: string | null
  attachments: TaskAttachment[]
  max_score: number
  created_at: string
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
  } | null
  submission?: {
    id: string
    status: string
    submitted_at: string
    points: number | null
    feedback: string | null
    graded_at: string | null
    content?: string | null
    file_url?: string | null
    file_path?: string | null
    file_attachments?: Array<{
      name: string
      url: string
      size: number
    }> | null
  }
}

type FilterType = 'all' | 'available' | 'submitted' | 'graded'

export default function UserTasksPage() {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const { showConfirm } = useConfirmDialog()
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')

  // Submission form state
  const [submissionContent, setSubmissionContent] = useState('')
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const fetchTasks = useCallback(async () => {
    if (!user) return

    try {
      // Get all published tasks with user submissions
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          content,
          instructions,
          topics,
          due_date,
          attachments,
          max_score,
          created_at,
          topic:topics(
            id,
            title,
            module:modules(
              id,
              title,
              course:courses(
                id,
                title
              )
            )
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const tasksData = (data || []).map(item => {
        // Handle nested relations properly
        let processedTopic = null
        if (item.topic) {
          const topicData = Array.isArray(item.topic) ? item.topic[0] : item.topic
          if (topicData) {
            const moduleData = Array.isArray(topicData.module) ? topicData.module[0] : topicData.module
            const courseData = moduleData && Array.isArray(moduleData.course) ? moduleData.course[0] : moduleData?.course
            
            processedTopic = {
              id: topicData.id,
              title: topicData.title,
              module: {
                id: moduleData?.id || '',
                title: moduleData?.title || '',
                course: {
                  id: courseData?.id || '',
                  title: courseData?.title || ''
                }
              }
            }
          }
        }

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          content: item.content,
          instructions: item.instructions,
          topics: item.topics || [],
          due_date: item.due_date,
          attachments: item.attachments || [],
          max_score: item.max_score,
          created_at: item.created_at,
          topic: processedTopic
        }
      }) as TaskWithDetails[]

      // Get submissions for these tasks
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user.id)
        .in('task_id', tasksData.map(t => t.id))

      if (submissionsError) throw submissionsError

      // Merge tasks with submissions
      const tasksWithSubmissions: TaskWithDetails[] = tasksData.map(task => {
        const submission = submissions?.find(s => s.task_id === task.id)
        return {
          ...task,
          submission: submission || undefined
        }
      })

      setTasks(tasksWithSubmissions)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user, fetchTasks])

  const handleSubmitTask = async () => {
    if (!selectedTask || (!submissionContent && submissionFiles.length === 0) || !user) return

    setSubmitting(true)
    setUploadProgress(0)

    try {
      // Upload files if any
      const uploadedFiles = []
      if (submissionFiles.length > 0) {
        for (let i = 0; i < submissionFiles.length; i++) {
          const file = submissionFiles[i]
          setUploadProgress((i / submissionFiles.length) * 100)
          
          const result = await uploadTaskFile(file, user.id, selectedTask.id)
          if (result.url) {
            uploadedFiles.push({
              name: file.name,
              url: result.url,
              size: file.size,
              type: file.type
            })
          }
        }
      }

      if (isEditMode && selectedTask.submission) {
        // Update existing submission
        const updateData = {
          content: submissionContent.trim() || null,
          file_attachments: uploadedFiles.length > 0 ? uploadedFiles : selectedTask.submission.file_attachments || null,
          file_url: uploadedFiles.length > 0 ? uploadedFiles[0].url : selectedTask.submission.file_url,
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        }

        const { error } = await supabase
          .from('submissions')
          .update(updateData)
          .eq('id', selectedTask.submission.id)

        if (error) throw error

        // Update local state
        setTasks(prev => prev.map(task => 
          task.id === selectedTask.id 
            ? {
                ...task,
                submission: {
                  ...task.submission!,
                  ...updateData,
                  id: task.submission!.id
                }
              }
            : task
        ))

        showSuccess('Assignment Updated', 'Your assignment has been updated successfully!')
      } else {
        // Create new submission
        const submissionData = {
          task_id: selectedTask.id,
          student_id: user.id,
          content: submissionContent.trim() || null,
          file_attachments: uploadedFiles.length > 0 ? uploadedFiles : null,
          file_url: uploadedFiles.length > 0 ? uploadedFiles[0].url : null,
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        }

        const { data, error } = await supabase
          .from('submissions')
          .insert([submissionData])
          .select()

        if (error) throw error

        // Update local state
        setTasks(prev => prev.map(task => 
          task.id === selectedTask.id 
            ? {
                ...task,
                submission: {
                  id: data[0].id,
                  status: 'submitted',
                  submitted_at: data[0].submitted_at,
                  points: null,
                  feedback: null,
                  graded_at: null
                }
              }
            : task
        ))

        showSuccess('Assignment Submitted', 'Your assignment has been submitted successfully!')
      }

      // Reset form and close modal
      setSubmissionContent('')
      setSubmissionFiles([])
      setShowSubmissionModal(false)
      setSelectedTask(null)
      setIsEditMode(false)
      setUploadProgress(0)
    } catch (error) {
      console.error('Error submitting task:', error)
      showError('Submission Failed', 'Error submitting assignment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmission = (task: TaskWithDetails) => {
    if (!task.submission || task.submission.status === 'graded') return

    setSelectedTask(task)
    setIsEditMode(true)
    setSubmissionContent(task.submission.content || '')
    setShowSubmissionModal(true)
  }

  const handleDeleteSubmission = async (task: TaskWithDetails) => {
    if (!task.submission || task.submission.status === 'graded') return

    showConfirm({
      title: 'Delete Submission',
      message: 'Are you sure you want to delete this submission? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          // First, delete the associated files from storage if they exist
          if (task.submission?.file_attachments && Array.isArray(task.submission.file_attachments)) {
            for (const fileAttachment of task.submission.file_attachments) {
              if (fileAttachment.url && fileAttachment.url.includes('task-submissions')) {
                // Extract file path from URL to delete it
                const urlParts = fileAttachment.url.split('/storage/v1/object/public/task-submissions/')
                if (urlParts.length > 1) {
                  const filePath = urlParts[1]
                  try {
                    const { error: storageError } = await supabase.storage
                  .from('task-submissions')
                  .remove([filePath])
                
                if (storageError) {
                  console.warn('Could not delete file from storage:', storageError)
                }
              } catch (storageDeleteError) {
                console.warn('Error deleting file from storage:', storageDeleteError)
              }
            }
          }
        }
      }

      // Then delete the submission record from the database
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', task.submission!.id)

      if (error) {
        console.error('Database error deleting submission:', error)
        throw error
      }

          // Refresh tasks from database to ensure consistency
          await fetchTasks()

          showSuccess('Submission Deleted', 'Your submission has been deleted successfully!')
        } catch (error) {
          console.error('Error deleting submission:', error)
          showError('Delete Failed', 'Error deleting submission. Please try again.')
        }
      }
    })
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'available') return !task.submission
    if (filter === 'submitted') return task.submission && task.submission.status === 'submitted'
    if (filter === 'graded') return task.submission && task.submission.status === 'graded'
    return true
  })

  const getTaskStatus = (task: TaskWithDetails) => {
    if (!task.submission) {
      const isOverdue = task.due_date && new Date(task.due_date) < new Date()
      return {
        label: isOverdue ? 'Overdue' : 'Available',
        color: isOverdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200',
        icon: ''
      }
    }

    if (task.submission.status === 'graded') {
      return {
        label: 'Graded',
        color: 'bg-samsung-blue/10 text-samsung-blue border-samsung-blue/20',
        icon: ''
      }
    }

    return {
      label: 'Submitted',
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      icon: ''
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `${diffDays} days left`
  }

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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Enhanced Header Section */}
        <div className="flex items-center justify-between mb-8 p-6 glass-card rounded-2xl border-2 border-samsung-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-samsung-blue/10">
              <ClipboardIcon className="w-7 h-7 text-samsung-blue" />
            </div>
            <div>
              <h1 className="text-2xl samsung-heading text-samsung-gray-900">
                My Tasks
              </h1>
              <p className="samsung-body text-sm text-samsung-gray-600 mt-1">
                View and submit assignments across all courses
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="glass-card group hover:scale-[1.02] transition-all duration-700 hover:shadow-samsung-float p-8 rounded-3xl border-2 border-samsung-gray-100 hover:border-samsung-blue/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="samsung-body text-sm font-bold text-samsung-gray-600 mb-2">Total Tasks</p>
                <p className="text-4xl samsung-heading text-samsung-gray-900">{tasks.length}</p>
              </div>
              <div className="w-16 h-16 rounded-3xl bg-samsung-blue/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 [&>svg]:text-samsung-blue">
                <ClipboardIcon className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="glass-card group hover:scale-[1.02] transition-all duration-700 hover:shadow-samsung-float p-8 rounded-3xl border-2 border-samsung-gray-100 hover:border-samsung-blue/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="samsung-body text-sm font-bold text-samsung-gray-600 mb-2">Available</p>
                <p className="text-4xl samsung-heading text-samsung-gray-900">{tasks.filter(t => !t.submission).length}</p>
              </div>
              <div className="w-16 h-16 rounded-3xl bg-samsung-blue/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 [&>svg]:text-samsung-blue">
                <CheckIcon className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="glass-card group hover:scale-[1.02] transition-all duration-700 hover:shadow-samsung-float p-8 rounded-3xl border-2 border-samsung-gray-100 hover:border-samsung-blue/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="samsung-body text-sm font-bold text-samsung-gray-600 mb-2">Submitted</p>
                <p className="text-4xl samsung-heading text-samsung-gray-900">{tasks.filter(t => t.submission && t.submission.status === 'submitted').length}</p>
              </div>
              <div className="w-16 h-16 rounded-3xl bg-samsung-blue/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 [&>svg]:text-samsung-blue">
                <ClockIcon className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="glass-card group hover:scale-[1.02] transition-all duration-700 hover:shadow-samsung-float p-8 rounded-3xl border-2 border-samsung-gray-100 hover:border-samsung-blue/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="samsung-body text-sm font-bold text-samsung-gray-600 mb-2">Graded</p>
                <p className="text-4xl samsung-heading text-samsung-gray-900">{tasks.filter(t => t.submission && t.submission.status === 'graded').length}</p>
              </div>
              <div className="w-16 h-16 rounded-3xl bg-samsung-blue/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 [&>svg]:text-samsung-blue">
                <TrendingUpIcon className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filter Tabs */}
        <div className="glass-card p-8 mb-8 rounded-3xl border-2 border-samsung-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl samsung-heading text-samsung-gray-900">Filter Tasks</h3>
            <div className="samsung-body text-sm text-samsung-gray-500">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} shown
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {(['all', 'available', 'submitted', 'graded'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-6 py-3 samsung-body font-bold rounded-2xl transition-all duration-500 samsung-ripple ${
                  filter === filterOption
                    ? 'bg-samsung-blue text-white shadow-samsung-card transform scale-105'
                    : 'text-samsung-gray-700 hover:text-samsung-blue hover:bg-samsung-blue/5 border-2 border-samsung-gray-100 hover:border-samsung-blue/20'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                <span className={`ml-2 px-2.5 py-1 text-xs rounded-full ${
                  filter === filterOption 
                    ? 'bg-white/20 text-white' 
                    : 'bg-samsung-gray-100 text-samsung-gray-600'
                }`}>
                  {filter === filterOption ? filteredTasks.length : tasks.filter(t => {
                    if (filterOption === 'available') return !t.submission
                    if (filterOption === 'submitted') return t.submission && t.submission.status === 'submitted'
                    if (filterOption === 'graded') return t.submission && t.submission.status === 'graded'
                    return true
                  }).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks Grid */}
        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => {
              const status = getTaskStatus(task)
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card group hover:scale-[1.01] transition-all duration-500 hover:shadow-samsung-float border-2 border-samsung-gray-100 rounded-2xl overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1">
                        <h3 className="samsung-heading text-lg text-samsung-gray-900 mb-3">
                          {task.title}
                        </h3>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`px-3 py-1.5 text-xs samsung-body font-semibold rounded-full border ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="px-3 py-1.5 text-xs samsung-body font-semibold rounded-full bg-samsung-gray-100 text-samsung-gray-700">
                            Max: {task.max_score} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Course Info */}
                    {task.topic && (
                      <div className="mb-4 pb-4 border-b border-samsung-gray-100">
                        <p className="samsung-body text-sm text-samsung-blue font-semibold mb-1">
                          {task.topic.module.course.title}
                        </p>
                        <p className="samsung-body text-xs text-samsung-gray-600">
                          {task.topic.module.title} › {task.topic.title}
                        </p>
                      </div>
                    )}

                    {/* Topics */}
                    {task.topics && task.topics.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {task.topics.slice(0, 3).map((topic, index) => (
                            <span
                              key={index}
                              className="px-2.5 py-1 samsung-body text-xs font-medium bg-samsung-cyan/10 text-samsung-cyan rounded-lg border border-samsung-cyan/20"
                            >
                              {topic}
                            </span>
                          ))}
                          {task.topics.length > 3 && (
                            <span className="px-2.5 py-1 samsung-body text-xs font-medium bg-samsung-gray-100 text-samsung-gray-600 rounded-lg">
                              +{task.topics.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <p className="samsung-body text-sm text-samsung-gray-700 mb-4 line-clamp-3 leading-relaxed">
                      {task.description || task.content}
                    </p>

                    {/* Due Date */}
                    {task.due_date && (
                      <div className="mb-4 p-3 rounded-xl bg-samsung-gray-50 border border-samsung-gray-100">
                        <div className={`samsung-body text-sm font-medium ${
                          new Date(task.due_date) < new Date() ? 'text-red-600' : 'text-samsung-gray-900'
                        }`}>
                          Due: {new Date(task.due_date).toLocaleString()}
                        </div>
                        <div className="samsung-body text-xs text-samsung-gray-600 mt-1">
                          {getDaysUntilDue(task.due_date)}
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {task.attachments && task.attachments.length > 0 && (
                      <div className="mb-4 p-3 rounded-xl bg-samsung-purple/5 border border-samsung-purple/20">
                        <p className="samsung-body text-sm font-semibold text-samsung-purple mb-2">Attachments</p>
                        <div className="space-y-1.5">
                          {task.attachments.slice(0, 2).map((attachment, index) => (
                            <a
                              key={index}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block samsung-body text-sm text-samsung-blue hover:text-samsung-cyan truncate transition-colors duration-300"
                            >
                              {attachment.name}
                            </a>
                          ))}
                          {task.attachments.length > 2 && (
                            <p className="samsung-body text-xs text-samsung-gray-600">
                              +{task.attachments.length - 2} more attachments
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Submission Info */}
                    {task.submission && (
                      <div className="mb-5 p-4 bg-samsung-blue/5 rounded-xl border border-samsung-blue/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="samsung-body text-sm font-semibold text-samsung-gray-900">Your Submission</span>
                          {task.submission.status === 'graded' && task.submission.points !== null && (
                            <span className="samsung-body text-sm font-bold text-samsung-blue">
                              {task.submission.points}/{task.max_score} pts
                            </span>
                          )}
                        </div>
                        <p className="samsung-body text-xs text-samsung-gray-700 mb-1">
                          Submitted: {new Date(task.submission.submitted_at).toLocaleString()}
                        </p>
                        {task.submission.graded_at && (
                          <p className="samsung-body text-xs text-samsung-gray-700 mb-1">
                            Graded: {new Date(task.submission.graded_at).toLocaleString()}
                          </p>
                        )}
                        {task.submission.feedback && (
                          <div className="mt-3 pt-3 border-t border-samsung-blue/10">
                            <p className="samsung-body text-xs font-semibold text-samsung-gray-900 mb-1">Feedback:</p>
                            <p className="samsung-body text-xs text-samsung-gray-700 line-clamp-2 leading-relaxed">
                              {task.submission.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedTask(task)
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl samsung-body text-sm font-semibold text-samsung-blue bg-samsung-blue/10 hover:bg-samsung-blue/20 border border-samsung-blue/20 hover:border-samsung-blue/30 transition-all duration-300"
                      >
                        View Details
                      </motion.button>
                      
                      {!task.submission && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedTask(task)
                            setShowSubmissionModal(true)
                          }}
                          className="flex-1 px-4 py-2.5 rounded-xl samsung-body text-sm font-semibold text-white bg-samsung-blue hover:bg-samsung-blue/90 transition-all duration-300 shadow-samsung-card hover:shadow-samsung-float"
                        >
                          Submit Work
                        </motion.button>
                      )}
                      
                      {task.submission && task.submission.status === 'submitted' && (
                        <div className="flex gap-2 flex-1">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleEditSubmission(task)}
                            className="flex-1 px-4 py-2.5 rounded-xl samsung-body text-sm font-semibold text-white bg-samsung-cyan hover:bg-samsung-cyan/90 transition-all duration-300 shadow-samsung-card hover:shadow-samsung-float"
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDeleteSubmission(task)}
                            className="flex-1 px-4 py-2.5 rounded-xl samsung-body text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-300"
                          >
                            Delete
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center rounded-3xl border-2 border-samsung-gray-100">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-samsung-blue/10 mb-6">
              <ClipboardIcon className="w-12 h-12 text-samsung-blue" />
            </div>
            <h3 className="text-2xl samsung-heading text-samsung-gray-900 mb-3">
              {filter === 'all' ? 'No tasks available' : `No ${filter} tasks`}
            </h3>
            <p className="samsung-body text-base text-samsung-gray-700 mb-6 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Check back later for new assignments from your instructors'
                : `You don't have any ${filter} tasks at the moment`
              }
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="btn btn-primary inline-flex items-center px-8 py-4 samsung-body font-bold rounded-2xl transition-all duration-500 shadow-samsung-card hover:shadow-samsung-float group samsung-ripple"
              >
                View All Tasks
                <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-500" />
              </button>
            )}
          </div>
        )}

        {/* Task Details Modal */}
        <AnimatePresence>
          {selectedTask && !showSubmissionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedTask(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-samsung-gray-100 shadow-samsung-float"
              >
                <div className="px-8 py-6 border-b-2 border-samsung-gray-100 bg-samsung-blue/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-samsung-blue/10 flex items-center justify-center">
                        <ClipboardIcon className="w-6 h-6 text-samsung-blue" />
                      </div>
                      <div>
                        <h3 className="text-xl samsung-heading text-samsung-gray-900">
                          {selectedTask.title || `Task from ${selectedTask.topic?.title || 'Unknown Topic'}`}
                        </h3>
                        {selectedTask.topic && (
                          <p className="samsung-body text-sm text-samsung-gray-600 mt-1">
                            {selectedTask.topic.module?.course?.title} › {selectedTask.topic.module?.title} › {selectedTask.topic.title}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="w-10 h-10 rounded-xl bg-samsung-gray-100 hover:bg-samsung-gray-200 text-samsung-gray-600 hover:text-samsung-gray-900 transition-all duration-300 flex items-center justify-center"
                    >
                      <span className="text-xl">✕</span>
                    </button>
                  </div>
                </div>

                <div className="px-8 py-6">
                  {/* Task Info */}
                  <div className="space-y-6">
                    {/* Task Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-samsung-blue/5 border border-samsung-blue/20">
                        <h4 className="samsung-body text-sm font-semibold text-samsung-gray-600 mb-2">Max Score</h4>
                        <p className="samsung-heading text-2xl text-samsung-blue">{selectedTask.max_score} pts</p>
                      </div>
                      {selectedTask.due_date && (
                        <div className="p-4 rounded-2xl bg-samsung-purple/5 border border-samsung-purple/20">
                          <h4 className="samsung-body text-sm font-semibold text-samsung-gray-600 mb-2">Due Date</h4>
                          <p className="samsung-body text-sm font-semibold text-samsung-gray-900">
                            {new Date(selectedTask.due_date).toLocaleDateString()}
                          </p>
                          <p className="samsung-body text-xs text-samsung-gray-600 mt-1">
                            {new Date(selectedTask.due_date).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {selectedTask.description && (
                      <div>
                        <h4 className="samsung-heading text-base text-samsung-gray-900 mb-3">Description</h4>
                        <p className="samsung-body text-samsung-gray-700 bg-samsung-gray-50 rounded-2xl p-4 border border-samsung-gray-100 leading-relaxed">{selectedTask.description}</p>
                      </div>
                    )}

                    {/* Content */}
                    {selectedTask.content && (
                      <div>
                        <h4 className="samsung-heading text-base text-samsung-gray-900 mb-3">Content</h4>
                        <div className="prose max-w-none">
                          <div className="whitespace-pre-wrap samsung-body text-samsung-gray-700 bg-samsung-gray-50 rounded-2xl p-5 border border-samsung-gray-100 leading-relaxed">
                            {selectedTask.content}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Instructions */}
                    {selectedTask.instructions && (
                      <div>
                        <h4 className="samsung-heading text-base text-samsung-gray-900 mb-3">Instructions</h4>
                        <div className="prose max-w-none">
                          <div className="whitespace-pre-wrap samsung-body text-samsung-gray-700 bg-samsung-blue/5 rounded-2xl p-5 border-l-4 border-samsung-blue leading-relaxed">
                            {selectedTask.instructions}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fallback when no content is available */}
                    {!selectedTask.description && !selectedTask.content && !selectedTask.instructions && (
                      <div className="text-center py-6 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-yellow-600 text-3xl mb-2">⚠️</div>
                        <h4 className="text-lg font-medium text-yellow-800 mb-1">Task Content Not Available</h4>
                        <p className="text-yellow-700 mb-3">
                          This task appears to be missing detailed instructions or content.
                        </p>
                        <p className="text-sm text-yellow-600">
                          Please contact your instructor for the task requirements.
                        </p>
                      </div>
                    )}

                    {/* Submission Status */}
                    {selectedTask.submission && (
                      <div>
                        <h4 className="samsung-heading text-base text-samsung-gray-900 mb-3">Your Submission</h4>
                        <div className="bg-samsung-gray-50 rounded-2xl p-5 border-2 border-samsung-gray-100">
                          <div className="flex items-center justify-between mb-4">
                            <span className={`px-4 py-2 samsung-body text-sm font-bold rounded-full border ${
                              selectedTask.submission.status === 'graded' 
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                              {selectedTask.submission.status === 'graded' ? 'Graded' : 'Submitted'}
                            </span>
                            {selectedTask.submission.points !== null && (
                              <span className="samsung-heading text-2xl text-samsung-blue">
                                {selectedTask.submission.points}/{selectedTask.max_score} pts
                              </span>
                            )}
                          </div>
                          <p className="samsung-body text-sm text-samsung-gray-700 mb-2">
                            Submitted: {new Date(selectedTask.submission.submitted_at).toLocaleString()}
                          </p>
                          {selectedTask.submission.graded_at && (
                            <p className="samsung-body text-sm text-samsung-gray-700 mb-2">
                              Graded: {new Date(selectedTask.submission.graded_at).toLocaleString()}
                            </p>
                          )}
                          {selectedTask.submission.feedback && (
                            <div className="mt-6 p-6 bg-gradient-to-br from-samsung-blue/5 to-samsung-cyan/5 rounded-2xl border-2 border-samsung-blue/20">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-samsung-blue flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                  </svg>
                                </div>
                                <p className="text-base samsung-heading text-gray-900">
                                  Instructor Feedback
                                </p>
                              </div>
                              <div className="pl-10">
                                <p className="samsung-body text-sm text-gray-700 leading-loose whitespace-pre-wrap">
                                  {selectedTask.submission.feedback}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Attachments */}
                  {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">📎 Attachments</h4>
                      <div className="space-y-2">
                        {selectedTask.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-indigo-600">📄</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                              <p className="text-xs text-gray-500">
                                {((attachment.size || 0) / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <span className="text-sm text-indigo-600">Download</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-8 py-6 border-t-2 border-samsung-gray-100 bg-samsung-gray-50/50 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-6 py-3 rounded-xl samsung-body text-sm font-semibold text-samsung-gray-700 bg-white hover:bg-samsung-gray-100 border-2 border-samsung-gray-200 hover:border-samsung-gray-300 transition-all duration-300"
                  >
                    Close
                  </button>
                  {!selectedTask.submission && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowSubmissionModal(true)}
                      className="px-6 py-3 rounded-xl samsung-body text-sm font-semibold text-white bg-samsung-blue hover:bg-samsung-blue/90 transition-all duration-300 shadow-samsung-card hover:shadow-samsung-float"
                    >
                      Submit Work
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submission Modal */}
        <AnimatePresence>
          {showSubmissionModal && selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => {
                setShowSubmissionModal(false)
                setSubmissionContent('')
                setSubmissionFiles([])
                setIsEditMode(false)
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-samsung-gray-100 shadow-samsung-float"
              >
                <div className="px-8 py-6 border-b-2 border-samsung-gray-100 bg-samsung-blue/5">
                  <h3 className="samsung-heading text-xl text-samsung-gray-900">
                    {isEditMode ? 'Edit Submission' : 'Submit Assignment'}: {selectedTask.title}
                  </h3>
                </div>

                <div className="px-8 py-6 space-y-6">
                  <div>
                    <label className="block samsung-body text-sm font-semibold text-samsung-gray-900 mb-3">
                      Written Response / Notes
                    </label>
                    <textarea
                      rows={8}
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      className="block w-full border-2 border-samsung-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-samsung-blue focus:border-samsung-blue samsung-body text-sm text-samsung-gray-900 p-4 transition-all duration-300"
                      placeholder="Enter your response, notes, or explanation here..."
                    />
                  </div>

                  <div>
                    <label className="block samsung-body text-sm font-semibold text-samsung-gray-900 mb-3">
                      File Attachments
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          setSubmissionFiles(Array.from(e.target.files))
                        }
                      }}
                      className="block w-full samsung-body text-sm text-samsung-gray-700 file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:samsung-body file:text-sm file:font-semibold file:bg-samsung-blue/10 file:text-samsung-blue hover:file:bg-samsung-blue/20 file:transition-all file:duration-300"
                    />
                    
                    {submissionFiles.length > 0 && (
                      <div className="mt-4">
                        <p className="samsung-body text-sm font-semibold text-samsung-gray-900 mb-3">Selected Files:</p>
                        <div className="space-y-2">
                          {submissionFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-samsung-gray-50 p-3 rounded-xl border border-samsung-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-samsung-blue/10 flex items-center justify-center">
                                  <span className="text-samsung-blue">📎</span>
                                </div>
                                <div>
                                  <span className="samsung-body text-sm font-medium text-samsung-gray-900 block">{file.name}</span>
                                  <span className="samsung-body text-xs text-samsung-gray-600">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const updatedFiles = [...submissionFiles]
                                  updatedFiles.splice(index, 1)
                                  setSubmissionFiles(updatedFiles)
                                }}
                                className="samsung-body text-sm font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all duration-300"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {submitting && uploadProgress > 0 && (
                    <div>
                      <div className="flex justify-between samsung-body text-sm text-samsung-gray-700 mb-2">
                        <span className="font-semibold">Uploading files...</span>
                        <span className="font-bold text-samsung-blue">{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="w-full bg-samsung-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-samsung-blue to-samsung-cyan h-3 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-8 py-6 border-t-2 border-samsung-gray-100 bg-samsung-gray-50/50 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowSubmissionModal(false)
                      setSubmissionContent('')
                      setSubmissionFiles([])
                      setIsEditMode(false)
                    }}
                    disabled={submitting}
                    className="px-6 py-3 rounded-xl samsung-body text-sm font-semibold text-samsung-gray-700 bg-white hover:bg-samsung-gray-100 border-2 border-samsung-gray-200 hover:border-samsung-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: submitting ? 1 : 1.02 }}
                    whileTap={{ scale: submitting ? 1 : 0.98 }}
                    onClick={handleSubmitTask}
                    disabled={(!submissionContent && submissionFiles.length === 0) || submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl samsung-body text-sm font-semibold text-white bg-samsung-blue hover:bg-samsung-blue/90 transition-all duration-300 shadow-samsung-card hover:shadow-samsung-float disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>{isEditMode ? 'Update Submission' : 'Submit Assignment'}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
