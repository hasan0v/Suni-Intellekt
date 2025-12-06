'use client'

import React, { useEffect, useState } from 'react'

interface OptimizedLoaderProps {
  text?: string
  showLogo?: boolean
  minimal?: boolean
  timeout?: number
}

export const OptimizedLoader: React.FC<OptimizedLoaderProps> = ({ 
  text = 'Yüklənir...', 
  showLogo = false,
  minimal = false,
  timeout = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Auto-hide loader after timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, timeout)

    return () => clearTimeout(timer)
  }, [timeout])

  if (!isVisible) {
    return null
  }

  if (minimal) {
    return (
      <div className="inline-flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600">{text}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        {/* 3D Rotating Loader */}
        <div className="relative w-16 h-16 mx-auto" style={{ perspective: '800px' }}>
          <div className="loader-inner loader-one" />
          <div className="loader-inner loader-two" />
          <div className="loader-inner loader-three" />
        </div>
        
        {/* Loading text */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-white">{text}</p>
          <p className="text-sm text-gray-400">
            Xahiş olunur bir az gözləyin...
          </p>
        </div>
      </div>

      <style jsx>{`
        .loader-inner {
          position: absolute;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }

        .loader-one {
          left: 0%;
          top: 0%;
          animation: rotate-one 1s linear infinite;
          border-bottom: 3px solid #8B5CF6;
        }

        .loader-two {
          right: 0%;
          top: 0%;
          animation: rotate-two 1s linear infinite;
          border-right: 3px solid #3B82F6;
        }

        .loader-three {
          right: 0%;
          bottom: 0%;
          animation: rotate-three 1s linear infinite;
          border-top: 3px solid #06B6D4;
        }

        @keyframes rotate-one {
          0% {
            transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg);
          }
        }

        @keyframes rotate-two {
          0% {
            transform: rotateX(50deg) rotateY(10deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg);
          }
        }

        @keyframes rotate-three {
          0% {
            transform: rotateX(35deg) rotateY(55deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg);
          }
        }
      `}</style>
    </div>
  )
}

// Skeleton loaders for different content types
export const PageSkeleton = () => (
  <div className="min-h-screen bg-white">
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-gray-200 mb-6" />
      
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
          
          {/* Card skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-48" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="animate-pulse">
      {/* Sidebar skeleton */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-200" />
      
      {/* Main content skeleton */}
      <div className="pl-64">
        {/* Header */}
        <div className="h-16 bg-white border-b border-gray-200 mb-6" />
        
        {/* Dashboard content */}
        <div className="px-6">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-64 bg-gray-200 rounded" />
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-64 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export const CardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 rounded" />
      <div className="h-3 bg-gray-200 rounded w-5/6" />
    </div>
    <div className="mt-4 h-8 bg-gray-200 rounded w-1/3" />
  </div>
)

export const TableSkeleton = () => (
  <div className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded w-1/4" />
    </div>
    <div className="divide-y divide-gray-200">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-200 rounded w-1/6" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default OptimizedLoader