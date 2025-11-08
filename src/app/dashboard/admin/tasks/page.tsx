'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/components/ui/NotificationSystem'
import { useConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { uploadTaskFile } from '@/lib/storage'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface TaskWithDetails {
  id: string
  title: string
  description: string
  content: string
  instructions: string
  topics: string[]
  due_date: string | null
  attachments: Array<{
    name: string
    url: string
    size: number
  }>
  created_by: string
  is_published: boolean
  max_score: number
  created_at: string
  updated_at: string
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
    } | null
  } | null
  _count?: {
    submissions: number
  }
}

interface Course {
  id: string
  title: string
  modules: {
    id: string
    title: string
    topics: {
      id: string
      title: string
    }[]
  }[]
}

export default function AdminTasksPage() {
  const { user, profile } = useAuth()
  const { showSuccess, showError } = useNotifications()
  const { showConfirm } = useConfirmDialog()
  const router = useRouter()
  const [tasks, setTasks] = useState<TaskWithDetails[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskWithDetails | null>(null)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    instructions: '',
    topics: [] as string[],
    due_date: '',
    topic_id: '',
    max_score: 100,
    is_published: false
  })
  const [attachments, setAttachments] = useState<File[]>([])
  // const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})

  useEffect(() => {
    if (!profile) return
    fetchTasks()
    fetchCourses()
  }, [profile, router])

  const fetchTasks = async () => {
    try {
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
          created_by,
          is_published,
          max_score,
          created_at,
          updated_at,
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
        .order('created_at', { ascending: false })

      if (error) throw error

      const tasksData = (data || []).map(item => {
        const topic = Array.isArray(item.topic) ? item.topic[0] : item.topic
        
        // Handle case where topic is null
        if (!topic) {
          return {
            ...item,
            topic: null
          }
        }
        
        const topicModule = Array.isArray(topic.module) ? topic.module[0] : topic.module
        
        // Handle case where module is null
        if (!topicModule) {
          return {
            ...item,
            topic: {
              ...topic,
              module: null
            }
          }
        }
        
        const course = Array.isArray(topicModule.course) ? topicModule.course[0] : topicModule.course

        return {
          ...item,
          topic: {
            ...topic,
            module: {
              ...topicModule,
              course
            }
          }
        }
      }) || []

      // Get submission counts for each task
      const tasksWithCounts = await Promise.all(
        tasksData.map(async (task) => {
          const { count } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('task_id', task.id)
          
          return {
            ...task,
            _count: { submissions: count || 0 }
          }
        })
      )

      setTasks(tasksWithCounts)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          modules:modules(
            id,
            title,
            topics:topics(
              id,
              title
            )
          )
        `)
        .order('title')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleCreateTask = async () => {
    if (!formData.title || !formData.content || !formData.instructions || !user) return

    setCreating(true)
    try {
      // Upload attachments first
      const uploadedAttachments = []
      for (const file of attachments) {
        const result = await uploadTaskFile(file, user.id, 'task-attachments')
        if (result.url) {
          uploadedAttachments.push({
            name: file.name,
            url: result.url,
            size: file.size,
            type: file.type
          })
        }
      }

      const taskData = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        instructions: formData.instructions,
        topics: formData.topics,
        due_date: formData.due_date || null,
        topic_id: formData.topic_id || null,
        max_score: formData.max_score,
        is_published: formData.is_published,
        attachments: uploadedAttachments,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()

      if (error) throw error

      await fetchTasks()
      resetForm()
      setShowCreateModal(false)
      
    } catch (error) {
      console.error('Error creating task:', error)
      showError('Creation Failed', 'Error creating task. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title || !formData.content || !formData.instructions) return

    setCreating(true)
    try {
      // Upload new attachments
      const uploadedAttachments = []
      for (const file of attachments) {
        const result = await uploadTaskFile(file, user!.id, 'task-attachments')
        if (result.url) {
          uploadedAttachments.push({
            name: file.name,
            url: result.url,
            size: file.size,
            type: file.type
          })
        }
      }

      const existingAttachments = editingTask.attachments || []
      const allAttachments = [...existingAttachments, ...uploadedAttachments]

      const taskData = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        instructions: formData.instructions,
        topics: formData.topics,
        due_date: formData.due_date || null,
        topic_id: formData.topic_id || null,
        max_score: formData.max_score,
        is_published: formData.is_published,
        attachments: allAttachments,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', editingTask.id)

      if (error) throw error

      await fetchTasks()
      resetForm()
      setEditingTask(null)
      
    } catch (error) {
      console.error('Error updating task:', error)
      showError('Update Failed', 'Error updating task. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    showConfirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task? This will also delete all submissions.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

          if (error) throw error
          await fetchTasks()
          showSuccess('Task Deleted', 'Task has been deleted successfully!')
        } catch (error) {
          console.error('Error deleting task:', error)
          showError('Delete Failed', 'Error deleting task. Please try again.')
        }
      }
    })
  }

  const handleEditTask = (task: TaskWithDetails) => {
    setEditingTask(task)
    setFormData({
      title: task.title || '',
      description: task.description || '',
      content: task.content || '',
      instructions: task.instructions || '',
      topics: task.topics || [],
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
      topic_id: task.topic?.id || '',
      max_score: task.max_score || 100,
      is_published: task.is_published || false
    })
    setAttachments([])
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      instructions: '',
      topics: [],
      due_date: '',
      topic_id: '',
      max_score: 100,
      is_published: false
    })
    setAttachments([])
    setEditingTask(null)
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'published') return task.is_published
    if (filter === 'draft') return !task.is_published
    return true
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files))
    }
  }

  const removeAttachment = (index: number, isExisting: boolean = false) => {
    if (isExisting && editingTask) {
      const updatedAttachments = [...(editingTask.attachments || [])]
      updatedAttachments.splice(index, 1)
      setEditingTask({
        ...editingTask,
        attachments: updatedAttachments
      })
    } else {
      const updatedFiles = [...attachments]
      updatedFiles.splice(index, 1)
      setAttachments(updatedFiles)
    }
  }

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
        <div className="glass-card p-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-samsung-blue flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl samsung-heading text-gray-900">Task Management</h1>
              <p className="mt-1 samsung-body text-gray-600">
                Create and manage assignments for your courses
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300"
          >
            Create Task
          </motion.button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card hover:shadow-samsung-float transition-all duration-500">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-samsung-blue rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm samsung-body text-gray-600 truncate">Total Tasks</dt>
                    <dd className="text-2xl samsung-heading text-gray-900 mt-1">{tasks.length}</dd>
                  </dl>
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
                  <dl>
                    <dt className="text-sm samsung-body text-gray-600 truncate">Published</dt>
                    <dd className="text-2xl samsung-heading text-gray-900 mt-1">
                      {tasks.filter(t => t.is_published).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card hover:shadow-samsung-float transition-all duration-500">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-samsung-teal rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm samsung-body text-gray-600 truncate">Drafts</dt>
                    <dd className="text-2xl samsung-heading text-gray-900 mt-1">
                      {tasks.filter(t => !t.is_published).length}
                    </dd>
                  </dl>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm samsung-body text-gray-600 truncate">Total Submissions</dt>
                    <dd className="text-2xl samsung-heading text-gray-900 mt-1">
                      {tasks.reduce((sum, task) => sum + (task._count?.submissions || 0), 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="glass-card p-4">
          <div className="flex space-x-3">
            {['all', 'published', 'draft'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption as 'all' | 'published' | 'draft')}
                className={`px-5 py-2.5 text-sm samsung-body rounded-xl transition-all duration-300 ${
                  filter === filterOption
                    ? 'bg-samsung-blue text-white shadow-samsung-card'
                    : 'bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue/20'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                <span className="ml-2 text-xs">
                  ({filteredTasks.length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        <div className="glass-card overflow-hidden">
          {filteredTasks.length > 0 ? (
            <ul role="list" className="divide-y divide-samsung-gray-100">
              {filteredTasks.map((task) => (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-6 py-6 hover:bg-samsung-blue/5 transition-colors duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm samsung-heading text-gray-900 truncate">
                            {task.title}
                          </h3>
                          <span className={`px-3 py-1 text-xs samsung-body rounded-xl ${
                            task.is_published
                              ? 'bg-samsung-cyan/10 text-samsung-cyan'
                              : 'bg-samsung-teal/10 text-samsung-teal'
                          }`}>
                            {task.is_published ? 'Published' : 'Draft'}
                          </span>
                          {task.topics && task.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.topics.slice(0, 2).map((topic, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-samsung-blue/10 text-samsung-blue rounded-lg samsung-body"
                                >
                                  {topic}
                                </span>
                              ))}
                              {task.topics.length > 2 && (
                                <span className="px-2 py-1 text-xs bg-samsung-gray-100 text-gray-600 rounded-lg samsung-body">
                                  +{task.topics.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm samsung-body text-gray-500">
                            {task._count?.submissions || 0} submissions
                          </span>
                          <span className="text-sm samsung-body text-gray-500">
                            Max: {task.max_score} pts
                          </span>
                        </div>
                      </div>

                      {task.topic && task.topic.module && task.topic.module.course ? (
                        <p className="text-sm samsung-body text-gray-600 mb-2">
                          {task.topic.module.course.title} › {task.topic.module.title} › {task.topic.title}
                        </p>
                      ) : (
                        <p className="text-sm samsung-body text-gray-500 mb-2">
                          No course assignment
                        </p>
                      )}

                      <p className="text-sm samsung-body text-gray-700 line-clamp-2 mb-2">
                        {task.description || task.content}
                      </p>

                      <div className="flex items-center justify-between text-sm samsung-body text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                          {task.due_date && (
                            <span>Due: {new Date(task.due_date).toLocaleString()}</span>
                          )}
                          {task.attachments && task.attachments.length > 0 && (
                            <span>{task.attachments.length} attachment(s)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditTask(task)}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm samsung-body bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue hover:text-white transition-all duration-300"
                      >
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteTask(task.id)}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm samsung-body text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-300"
                      >
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-samsung-blue/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg samsung-heading text-gray-900 mb-2">No tasks found</h3>
              <p className="samsung-body text-gray-500 mb-4">Create your first task to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300"
              >
                Create Task
              </button>
            </div>
          )}
        </div>

        {/* Create/Edit Task Modal */}
        <AnimatePresence>
          {(showCreateModal || editingTask) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => {
                setShowCreateModal(false)
                setEditingTask(null)
                resetForm()
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="px-8 py-6 border-b-2 border-samsung-gray-100">
                  <h3 className="text-xl samsung-heading text-gray-900">
                    {editingTask ? 'Edit Task' : 'Create New Task'}
                  </h3>
                </div>

                <div className="px-6 py-4 space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm samsung-body text-gray-700 mb-2">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                        placeholder="Enter task title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm samsung-body text-gray-700 mb-2">
                        Max Score
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.max_score}
                        onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) || 100 })}
                        className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm samsung-body text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                      placeholder="Brief task description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm samsung-body text-gray-700 mb-2">
                      Task Content *
                    </label>
                    <textarea
                      rows={6}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                      placeholder="General task overview and context..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm samsung-body text-gray-700 mb-2">
                      Instructions *
                    </label>
                    <textarea
                      rows={8}
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                      placeholder="Detailed step-by-step instructions and requirements..."
                    />
                  </div>

                  {/* Topics and Course Assignment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm samsung-body text-gray-700 mb-2">
                        Related Topics (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.topics.join(', ')}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          topics: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                        })}
                        className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                        placeholder="JavaScript, React, Node.js"
                      />
                    </div>

                    <div>
                      <label className="block text-sm samsung-body text-gray-700 mb-2">
                        Assign to Course Topic (optional)
                      </label>
                      <select
                        value={formData.topic_id}
                        onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                        className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                      >
                        <option value="">Select a topic</option>
                        {courses.map(course => (
                          <optgroup key={course.id} label={course.title}>
                            {course.modules.map(module => (
                              module.topics.map(topic => (
                                <option key={topic.id} value={topic.id}>
                                  {module.title} › {topic.title}
                                </option>
                              ))
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm samsung-body text-gray-700 mb-2">
                      Due Date (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="block w-full border-2 border-samsung-gray-100 rounded-xl samsung-body text-gray-900 focus:ring-2 focus:ring-samsung-blue/20 focus:border-samsung-blue transition-all duration-300"
                    />
                  </div>

                  {/* File Attachments */}
                  <div>
                    <label className="block text-sm samsung-body text-gray-700 mb-2">
                      Attachments
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    
                    {/* Existing attachments */}
                    {editingTask && editingTask.attachments && editingTask.attachments.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Current Attachments:</p>
                        <div className="space-y-2">
                          {editingTask.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">📎</span>
                                <span className="text-sm text-gray-700">{attachment.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(attachment.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                onClick={() => removeAttachment(index, true)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New attachments */}
                    {attachments.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">New Attachments:</p>
                        <div className="space-y-2">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">📎</span>
                                <span className="text-sm text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                onClick={() => removeAttachment(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Publishing Options */}
                  <div className="flex items-center">
                    <input
                      id="is_published"
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      className="h-4 w-4 text-samsung-blue focus:ring-samsung-blue/20 border-samsung-gray-100 rounded"
                    />
                    <label htmlFor="is_published" className="ml-2 block text-sm samsung-body text-gray-900">
                      Publish immediately (students can see and submit)
                    </label>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setEditingTask(null)
                      resetForm()
                    }}
                    className="px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue/20 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={editingTask ? handleUpdateTask : handleCreateTask}
                    disabled={!formData.title || !formData.content || creating}
                    className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300 disabled:opacity-50"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        {editingTask ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        {editingTask ? '💾 Update Task' : '✏️ Create Task'}
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
  </ProtectedRoute>
  )
}
