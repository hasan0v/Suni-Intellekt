'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Logo from './Logo'
import ClientOnly from './ClientOnly'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <DashboardContent>{children}</DashboardContent>
    </ClientOnly>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user && typeof window !== 'undefined') {
      if (!pathname?.startsWith('/auth')) {
        router.replace('/auth/signin')
      }
    }
  }, [user, loading, router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const isAdmin = profile.role === 'admin'

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Courses', 
      href: '/dashboard/courses', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    { 
      name: 'Tasks', 
      href: '/dashboard/tasks', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    // Chat page temporarily disabled - keeping for future use
    // { 
    //   name: 'Chat', 
    //   href: '/dashboard/chat', 
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    //     </svg>
    //   )
    // },
    { 
      name: 'My Grades', 
      href: '/dashboard/grades', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      name: 'Attendance', 
      href: '/dashboard/attendance', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ]

  const adminNavigation = [
    { 
      name: 'Admin Panel', 
      href: '/dashboard/admin', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      name: 'Grading Queue', 
      href: '/dashboard/grading', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    },
  ]

  return (
    <div className="min-h-screen bg-samsung-gray-50">
      {/* Sidebar for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex h-full min-h-0 w-64 flex-col bg-samsung-gray-50 shadow-xl">
          <div className="flex-shrink-0 flex items-center justify-center px-6 py-8 bg-samsung-gray-50 border-b-2 border-samsung-gray-200">
            <div className="flex items-center justify-center w-full">
              <Logo href="/dashboard" uppercase size="md" showText className="justify-center" />
            </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="text-gray-600 hover:text-gray-800 hover:bg-samsung-gray-100 p-2 rounded-lg transition-all duration-200"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto overscroll-contain px-6 py-8 space-y-3 nice-scroll">
              {navigation.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center gap-4 px-5 py-4 samsung-body text-samsung-gray-700 rounded-2xl hover:bg-samsung-blue/5 hover:text-samsung-blue transition-all duration-500 animate-fade-in-up border-2 border-transparent hover:border-samsung-blue/10"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-samsung-blue/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 [&>svg]:text-samsung-blue [&>svg]:group-hover:text-samsung-blue">
                    {item.icon}
                  </div>
                  <span className="samsung-body group-hover:translate-x-1 transition-transform">{item.name}</span>
                </Link>
              ))}
              {isAdmin && (
                <>
                  <div className="border-t-2 border-samsung-gray-100 my-8" />
                  <div className="px-5 py-3 samsung-heading text-xs text-samsung-gray-500 uppercase tracking-wider">
                    Admin Panel
                  </div>
                  {adminNavigation.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="group flex items-center gap-4 px-5 py-4 samsung-body text-samsung-blue rounded-2xl hover:bg-samsung-blue/5 transition-all duration-500 animate-fade-in-up border-2 border-transparent hover:border-samsung-blue/10"
                      style={{ animationDelay: `${(navigation.length + index) * 0.1}s` }}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-samsung-blue/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 [&>svg]:text-samsung-blue [&>svg]:group-hover:text-samsung-blue">
                        {item.icon}
                      </div>
                      <span className="samsung-body group-hover:translate-x-1 transition-transform">{item.name}</span>
                    </Link>
                  ))}
                </>
              )}
            </nav>
            
            {/* Mobile Profile Section */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
              <Link href="/dashboard/profile" onClick={() => setSidebarOpen(false)}>
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center">
                      {profile.profile_image_url ? (
                        <Image
                          src={profile.profile_image_url}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium text-sm">
                          {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{profile.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-gray-400 text-sm">→</span>
                  </div>
                </div>
              </Link>
              <div className="mt-2 pt-2 border-t border-gray-100">
                <button
                  onClick={signOut}
                  className="w-full text-left px-2 py-1 text-sm text-gray-500 hover:text-gray-700 rounded transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <div className="flex h-full min-h-0 flex-col bg-samsung-gray-50 shadow-xl">
          <div className="flex-shrink-0 flex items-center justify-center px-6 py-8 bg-samsung-gray-50 border-b-2 border-samsung-gray-200">
            <Logo href="/dashboard" uppercase size="md" showText className="justify-center" />
          </div>
          <nav className="flex-1 overflow-y-auto overscroll-contain px-6 py-8 space-y-3 nice-scroll">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center gap-4 px-5 py-4 samsung-body text-samsung-gray-700 rounded-2xl hover:bg-samsung-blue/5 hover:text-samsung-blue transition-all duration-500 animate-fade-in-up border-2 border-transparent hover:border-samsung-blue/10"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-samsung-blue/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 [&>svg]:text-samsung-blue [&>svg]:group-hover:text-samsung-blue">
                  {item.icon}
                </div>
                <span className="samsung-body group-hover:translate-x-1 transition-transform">{item.name}</span>
              </Link>
            ))}
            {isAdmin && (
              <>
                <div className="border-t-2 border-samsung-gray-100 my-8" />
                <div className="px-5 py-3 samsung-heading text-xs text-samsung-gray-500 uppercase tracking-wider">
                  Admin Panel
                </div>
                {adminNavigation.map((item, index) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center gap-4 px-5 py-4 samsung-body text-samsung-blue rounded-2xl hover:bg-samsung-blue/5 transition-all duration-500 animate-fade-in-up border-2 border-transparent hover:border-samsung-blue/10"
                    style={{ animationDelay: `${(navigation.length + index) * 0.1}s` }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-samsung-blue/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 [&>svg]:text-samsung-blue [&>svg]:group-hover:text-samsung-blue">
                      {item.icon}
                    </div>
                    <span className="samsung-body group-hover:translate-x-1 transition-transform">{item.name}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
            <Link href="/dashboard/profile" className="block">
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center">
                    {profile.profile_image_url ? (
                      <Image
                        src={profile.profile_image_url}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-medium text-sm">
                        {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{profile.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-gray-400 text-sm">→</span>
                </div>
              </div>
            </Link>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={signOut}
                className="w-full text-left px-2 py-1 text-sm text-gray-500 hover:text-gray-700 rounded transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 bg-samsung-gray-50 shadow-samsung-card border-b-2 border-samsung-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            ☰
          </button>
          <div className="flex items-center justify-center flex-1">
            <Logo href="/dashboard" size="sm" showText uppercase={false} className="" />
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/dashboard/profile" className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center">
                {profile.profile_image_url ? (
                  <Image
                    src={profile.profile_image_url}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-medium text-xs">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">{profile.full_name?.split(' ')[0] || 'User'}</span>
            </Link>
            <button
              onClick={signOut}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Global styles for Samsung-styled scrollbar on sidebar
<style jsx global>{`
  .nice-scroll {
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: #1428A0 #f8fafc; /* Samsung Blue thumb, light track */
  }
  .nice-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .nice-scroll::-webkit-scrollbar-track {
    background: #f8fafc;
    border-radius: 12px;
  }
  .nice-scroll::-webkit-scrollbar-thumb {
    background: rgba(20, 40, 160, 0.3); /* Samsung Blue 30% */
    border-radius: 12px;
    transition: background 0.3s ease;
  }
  .nice-scroll::-webkit-scrollbar-thumb:hover {
    background: #1428A0; /* Samsung Blue */
  }
`}</style>
