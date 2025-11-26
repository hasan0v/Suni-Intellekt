import { createClient } from '@supabase/supabase-js'

// Create Supabase client with fallback for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database schema
export interface UserProfile {
  id: string
  full_name: string
  phone_number?: string
  profile_image_url?: string
  bio?: string
  role: 'student' | 'admin'
  email_verified?: boolean
  created_at: string
}

export interface Course {
  id: string
  title: string
  description: string
  author_id: string
  created_at: string
}

export interface Module {
  id: string
  course_id: string
  title: string
  position: number
  created_at: string
}

export interface Topic {
  id: string
  module_id: string
  title: string
  content: string
  position: number
  created_at: string
  youtube_links?: string[]
}

export interface Task {
  id: string
  topic_id: string
  // Core text fields
  instructions: string
  // Extended fields (optional depending on query context)
  title?: string
  description?: string
  content?: string
  topics?: string[]
  due_date?: string | null
  attachments?: Array<{ name: string; url: string; size: number; type?: string }>
  max_score?: number
  is_published?: boolean
  created_by?: string
  updated_at?: string
  created_at: string
}

export interface Submission {
  id: string
  task_id: string
  student_id: string
  file_url: string
  file_path?: string
  submitted_at: string
  graded_at?: string
  status: 'submitted' | 'graded'
  points?: number
  feedback?: string
}

export interface Class {
  id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: 'active' | 'completed' | 'archived'
  created_by: string
  created_at: string
  updated_at: string
}

export interface ClassEnrollment {
  id: string
  class_id: string
  user_id: string
  status: 'active' | 'completed' | 'dropped'
  study_mode: 'offline' | 'online' | 'self_study'
  enrolled_at: string
  updated_at: string
}

export interface ClassCourse {
  id: string
  class_id: string
  course_id: string
  assigned_at: string
}

export interface ClassMaterial {
  id: string
  class_id: string
  title: string
  description: string | null
  file_url: string | null
  file_path: string | null
  material_type: 'document' | 'video' | 'link' | 'other'
  created_by: string
  created_at: string
  updated_at: string
}
