'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  full_name: string | null
  role: string
  phone_number: string | null
  bio: string | null
  created_at: string
}

export default function UserManagement() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'student' | 'admin'>('all')

  useEffect(() => {
  if (!user || !profile) return
    fetchUsers()
  }, [user, profile, router])

  const fetchUsers = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, role, phone_number, bio, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || !profile) {
    return <div>Loading...</div>
  }

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true
    return user.role === filter
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-samsung-purple/10 text-samsung-purple'
      case 'student':
        return 'bg-samsung-blue/10 text-samsung-blue'
      default:
        return 'bg-samsung-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl samsung-heading text-gray-900">User Management</h1>
              <p className="mt-1 samsung-body text-gray-600">
                Manage student and admin accounts
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm samsung-body bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue hover:text-white transition-all duration-300"
          >
            ← Back to Admin
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card hover:shadow-samsung-float transition-all duration-500">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-samsung-blue rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm samsung-body text-gray-600 truncate">Total Users</dt>
                    <dd className="text-2xl samsung-heading text-gray-900 mt-1">
                      {loading ? '...' : users.length}
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
                  <div className="w-12 h-12 bg-samsung-cyan rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm samsung-body text-gray-600 truncate">Students</dt>
                    <dd className="text-2xl samsung-heading text-gray-900 mt-1">
                      {loading ? '...' : users.filter(u => u.role === 'student').length}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm samsung-body text-gray-600 truncate">Admins</dt>
                    <dd className="text-2xl samsung-heading text-gray-900 mt-1">
                      {loading ? '...' : users.filter(u => u.role === 'admin').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card">
          <div className="px-6 py-4 border-b-2 border-samsung-gray-100">
            <div className="flex items-center space-x-4">
              <span className="text-sm samsung-body text-gray-700">Filter by role:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs samsung-body transition-all duration-300 ${
                    filter === 'all'
                      ? 'bg-samsung-blue text-white'
                      : 'bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue/20'
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  onClick={() => setFilter('student')}
                  className={`px-4 py-2 rounded-xl text-xs samsung-body transition-all duration-300 ${
                    filter === 'student'
                      ? 'bg-samsung-blue text-white'
                      : 'bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue/20'
                  }`}
                >
                  Students ({users.filter(u => u.role === 'student').length})
                </button>
                <button
                  onClick={() => setFilter('admin')}
                  className={`px-4 py-2 rounded-xl text-xs samsung-body transition-all duration-300 ${
                    filter === 'admin'
                      ? 'bg-samsung-blue text-white'
                      : 'bg-samsung-blue/10 text-samsung-blue hover:bg-samsung-blue/20'
                  }`}
                >
                  Admins ({users.filter(u => u.role === 'admin').length})
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-samsung-blue mx-auto"></div>
                <p className="mt-3 samsung-body text-gray-500">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-5xl mb-3">👤</div>
                <p className="samsung-body">No users found</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-samsung-gray-100">
                <thead className="bg-samsung-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs samsung-heading text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs samsung-heading text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs samsung-heading text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs samsung-heading text-gray-600 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-samsung-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-samsung-blue/5 transition-colors duration-300">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-xl bg-samsung-blue flex items-center justify-center">
                              <span className="text-white samsung-heading text-sm">
                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm samsung-body text-gray-900">
                              {user.full_name || 'No Name'}
                            </div>
                            <div className="text-xs samsung-body text-gray-500">
                              ID: {user.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1.5 text-xs samsung-body rounded-xl ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm samsung-body text-gray-900">
                        {user.phone_number ? (
                          <div>
                            <div>{user.phone_number}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not provided</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm samsung-body text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Future Enhancement Notice */}
        <div className="glass-card p-6 border-2 border-samsung-blue/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-samsung-blue/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-samsung-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-sm samsung-heading text-samsung-blue mb-2">
                Future Enhancements
              </h3>
              <p className="text-sm samsung-body text-gray-700">
                Coming soon: User role management, account activation/deactivation, and bulk actions.
              </p>
            </div>
          </div>
        </div>
      </div>
  </DashboardLayout>
  </ProtectedRoute>
  )
}
