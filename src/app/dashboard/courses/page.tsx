'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Course } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// Enhanced Course Icon Component
const CourseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const CalendarIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ArrowRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

// Loading Skeleton Component
const CourseCardSkeleton = () => (
  <div className="glass-card p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
    <div className="h-6 bg-gray-200 rounded mb-3"></div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="flex items-center justify-between text-xs mb-4">
      <div className="h-3 bg-gray-200 rounded w-24"></div>
      <div className="h-3 bg-gray-200 rounded w-20"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded-xl"></div>
  </div>
)

export default function StudentCoursesPage() {
  const { profile, user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolledClasses, setEnrolledClasses] = useState<string[]>([])

  useEffect(() => {
    if (!profile || !user) return
    fetchEnrolledClasses()
  }, [profile, user])

  useEffect(() => {
    if (enrolledClasses.length > 0 || profile?.role === 'admin') {
      fetchCourses()
    }
  }, [enrolledClasses, profile])

  const fetchEnrolledClasses = async () => {
    if (!user || profile?.role === 'admin') return

    try {
      const { data, error } = await supabase
        .from('class_enrollments')
        .select('class_id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (error) throw error

      const classIds = data?.map(e => e.class_id) || []
      setEnrolledClasses(classIds)
    } catch (error) {
      console.error('Error fetching enrolled classes:', error)
      setEnrolledClasses([])
    }
  }

  const fetchCourses = async () => {
    try {
      // Admins see all courses
      if (profile?.role === 'admin') {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setCourses(data || [])
        return
      }

      // Students see only courses assigned to their enrolled classes
      if (enrolledClasses.length === 0) {
        setCourses([])
        return
      }

      const { data: classCourses, error: classCoursesError } = await supabase
        .from('class_courses')
        .select('course_id')
        .in('class_id', enrolledClasses)

      if (classCoursesError) throw classCoursesError

      const courseIds = [...new Set(classCourses?.map(cc => cc.course_id) || [])]

      if (courseIds.length === 0) {
        setCourses([])
        return
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .in('id', courseIds)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 glass-card rounded-2xl border-2 border-samsung-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-samsung-blue/10">
              <CourseIcon className="w-7 h-7 text-samsung-blue" />
            </div>
            <div>
              <h1 className="text-2xl samsung-heading text-samsung-gray-900">
                Available Courses
              </h1>
              <p className="samsung-body text-sm text-samsung-gray-600 mt-1">
                Explore our comprehensive catalog of courses
              </p>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-samsung-blue/10 mb-6">
              <CourseIcon className="w-12 h-12 text-samsung-blue" />
            </div>
            <h3 className="text-2xl samsung-heading text-samsung-gray-900 mb-3">No courses available yet</h3>
            <p className="samsung-body text-base text-samsung-gray-700 mb-6 max-w-md mx-auto">
              Our course catalog is being prepared. Check back soon for exciting new learning opportunities!
            </p>
            <div className="inline-flex items-center samsung-body text-sm text-samsung-blue">
              <span className="animate-pulse">🔄</span>
              <span className="ml-2">Coming soon...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course, index) => (
                <div 
                  key={course.id} 
                  className="glass-card group hover:scale-[1.02] transition-all duration-700 hover:shadow-samsung-float rounded-3xl border-2 border-samsung-gray-100 hover:border-samsung-blue/20 samsung-ripple"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-samsung-blue/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 [&>svg]:text-samsung-blue">
                          <CourseIcon className="w-6 h-6" />
                        </div>
                        <span className="text-xs samsung-body font-bold text-samsung-blue bg-samsung-blue/10 px-3 py-1.5 rounded-full">
                          Course
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl samsung-heading text-samsung-gray-900 mb-3 line-clamp-2 group-hover:text-samsung-blue transition-colors duration-500">
                      {course.title}
                    </h3>
                    
                    <p className="samsung-body text-base text-samsung-gray-700 mb-6 line-clamp-3 leading-relaxed">
                      {course.description || 'Comprehensive course content designed to enhance your skills and knowledge in this subject area.'}
                    </p>
                    
                    <div className="flex items-center justify-between samsung-body text-xs text-samsung-gray-500 mb-6">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-samsung-blue rounded-full"></span>
                        <span>ID: {course.id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{new Date(course.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <Link
                      href={`/dashboard/courses/${course.id}`}
                      className="btn btn-primary w-full inline-flex items-center justify-center py-4 px-6 rounded-2xl transition-all duration-500 samsung-body font-bold shadow-samsung-card hover:shadow-samsung-float group samsung-ripple"
                    >
                      <span>Start Learning</span>
                      <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-500" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
