'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import {
  AdminPageHeader,
  AdminStatCard,
  AdminFilterTabs,
  AdminSearchInput,
  AdminLoadingSpinner,
  AdminEmptyState,
} from '@/components/admin/AdminComponents'
import { Users, GraduationCap, Shield, UserPlus, Phone, Calendar } from 'lucide-react'

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
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

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

  if (loading) {
    return (
      <DashboardLayout>
        <AdminLoadingSpinner size="lg" />
      </DashboardLayout>
    )
  }

  const filteredUsers = users.filter(u => {
    const matchesFilter = filter === 'all' || u.role === filter
    const matchesSearch = !searchQuery || 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone_number?.includes(searchQuery)
    return matchesFilter && matchesSearch
  })

  const studentCount = users.filter(u => u.role === 'student').length
  const adminCount = users.filter(u => u.role === 'admin').length

  const filterTabs = [
    { key: 'all', label: 'All Users', count: users.length },
    { key: 'student', label: 'Students', count: studentCount },
    { key: 'admin', label: 'Admins', count: adminCount },
  ]

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
          <AdminPageHeader
            title="User Management"
            description="View and manage student and admin accounts across your platform."
            icon={Users}
            iconColor="bg-gradient-to-br from-blue-500 to-indigo-600"
            breadcrumbs={[{ label: 'Users' }]}
          />

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <AdminStatCard
              title="Total Users"
              value={users.length}
              subtitle="All registered accounts"
              icon={Users}
              iconColor="bg-gradient-to-br from-samsung-blue to-blue-600"
              delay={0}
            />
            <AdminStatCard
              title="Students"
              value={studentCount}
              subtitle="Active learners"
              icon={GraduationCap}
              iconColor="bg-gradient-to-br from-samsung-cyan to-teal-600"
              delay={1}
            />
            <AdminStatCard
              title="Administrators"
              value={adminCount}
              subtitle="Platform managers"
              icon={Shield}
              iconColor="bg-gradient-to-br from-samsung-purple to-purple-600"
              delay={2}
            />
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5 rounded-2xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <AdminFilterTabs
                tabs={filterTabs}
                activeTab={filter}
                onChange={setFilter}
              />
              <AdminSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name or phone..."
                className="md:w-72"
              />
            </div>
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl overflow-hidden"
          >
            {filteredUsers.length === 0 ? (
              <AdminEmptyState
                icon={Users}
                title="No users found"
                description={searchQuery ? "Try adjusting your search criteria." : "No users match the selected filter."}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-samsung-blue/5 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-samsung-blue to-samsung-cyan flex items-center justify-center shadow-lg">
                              <span className="text-white font-semibold text-sm">
                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {user.full_name || 'No Name'}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {user.id.substring(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 ring-1 ring-amber-200' 
                              : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 ring-1 ring-blue-200'
                          }`}>
                            {user.role === 'admin' ? (
                              <Shield className="w-3 h-3" />
                            ) : (
                              <GraduationCap className="w-3 h-3" />
                            )}
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.phone_number ? (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {user.phone_number}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Not provided</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(user.created_at)}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Coming Soon Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6 rounded-2xl border-2 border-dashed border-samsung-blue/30"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-samsung-blue/10 to-samsung-cyan/10 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-samsung-blue" />
              </div>
              <div>
                <h3 className="text-lg samsung-heading text-gray-900 mb-1">
                  More Features Coming Soon
                </h3>
                <p className="text-sm samsung-body text-gray-600 mb-3">
                  We&apos;re working on powerful user management capabilities to help you manage your platform more effectively.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 text-xs font-medium bg-samsung-blue/10 text-samsung-blue rounded-full">
                    Role Management
                  </span>
                  <span className="px-3 py-1 text-xs font-medium bg-samsung-cyan/10 text-samsung-cyan rounded-full">
                    Bulk Actions
                  </span>
                  <span className="px-3 py-1 text-xs font-medium bg-samsung-purple/10 text-samsung-purple rounded-full">
                    Account Status
                  </span>
                  <span className="px-3 py-1 text-xs font-medium bg-samsung-teal/10 text-samsung-teal rounded-full">
                    Email Notifications
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
