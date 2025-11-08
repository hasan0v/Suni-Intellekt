'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface StorageStatus {
  configured: boolean
  buckets: Array<{ name: string; public: boolean; fileSizeLimit: number }>
  missing: string[]
}

interface BucketResult {
  exists?: boolean
  created?: boolean
  error?: string
}

interface SetupResult {
  success: boolean
  message: string
  results: Record<string, BucketResult>
}

export default function SetupStoragePage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/setup-storage')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check storage status')
      }
      
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const setupStorage = async () => {
    setLoading(true)
    setError(null)
    setSetupResult(null)
    try {
      const response = await fetch('/api/setup-storage', { method: 'POST' })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup storage')
      }
      
      setSetupResult(data)
      // Refresh status after setup
      await checkStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-samsung-purple flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl samsung-heading text-gray-900">Storage Setup</h1>
                <p className="mt-1 samsung-body text-gray-600">
                  Configure Supabase Storage buckets for file uploads
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="glass-card p-6">
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={checkStatus}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl samsung-body bg-samsung-cyan text-white hover:bg-samsung-cyan/80 shadow-samsung-card transition-all duration-300 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Check Status
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={setupStorage}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl samsung-body bg-samsung-blue text-white hover:bg-samsung-blue-dark shadow-samsung-card transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Setting up...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Setup Storage
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="glass-card p-6 border-l-4 border-red-500 bg-red-50/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h3 className="samsung-heading text-red-800 mb-1">Error</h3>
                  <p className="samsung-body text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Status Display */}
          {status && (
            <div className="glass-card p-6">
              <h2 className="text-lg samsung-heading text-gray-900 mb-4">Storage Status</h2>
              
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${status.configured ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <div className="flex items-center gap-2">
                    {status.configured ? (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={`samsung-body text-sm font-medium ${status.configured ? 'text-green-800' : 'text-yellow-800'}`}>
                      {status.configured ? 'All buckets configured' : 'Missing buckets'}
                    </span>
                  </div>
                </div>

                {status.missing.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-xl">
                    <p className="samsung-body text-sm text-red-800 mb-2">Missing buckets:</p>
                    <ul className="list-disc list-inside samsung-body text-sm text-red-700">
                      {status.missing.map(bucket => (
                        <li key={bucket}>{bucket}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="samsung-body text-sm font-medium text-gray-700 mb-2">Existing Buckets:</h3>
                  <div className="space-y-2">
                    {status.buckets.map(bucket => (
                      <div key={bucket.name} className="p-3 bg-samsung-blue/5 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="samsung-body text-sm text-gray-900">{bucket.name}</span>
                          <div className="flex gap-2">
                            <span className={`text-xs samsung-body px-2 py-1 rounded-lg ${bucket.public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {bucket.public ? 'Public' : 'Private'}
                            </span>
                            <span className="text-xs samsung-body px-2 py-1 rounded-lg bg-samsung-blue/10 text-samsung-blue">
                              {(bucket.fileSizeLimit / 1024 / 1024).toFixed(0)}MB limit
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Setup Result */}
          {setupResult && (
            <div className="glass-card p-6 border-l-4 border-green-500 bg-green-50/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="samsung-heading text-green-800 mb-2">Setup Complete</h3>
                  <p className="samsung-body text-sm text-green-700 mb-3">{setupResult.message}</p>
                  
                  <div className="space-y-2">
                    {Object.entries(setupResult.results).map(([key, value]: [string, BucketResult]) => (
                      <div key={key} className="text-sm samsung-body">
                        <span className="font-medium text-green-800">{key}:</span>
                        {value.exists && <span className="text-green-700 ml-2">Already exists</span>}
                        {value.created && <span className="text-green-700 ml-2">Created successfully</span>}
                        {value.error && <span className="text-red-700 ml-2">Error: {value.error}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="glass-card p-6">
            <h2 className="text-lg samsung-heading text-gray-900 mb-4">Instructions</h2>
            <div className="space-y-3 samsung-body text-sm text-gray-700">
              <p>This tool sets up the required Supabase Storage buckets for file uploads:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>profile-images</strong> - Public bucket for user profile pictures (5MB limit)</li>
                <li><strong>task-submissions</strong> - Private bucket for student task submissions (50MB limit)</li>
              </ul>
              
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important: RLS Policies Required</h3>
                <p className="text-yellow-800 mb-3">
                  After creating buckets, you must apply the RLS policies for file uploads to work:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-yellow-800 ml-2">
                  <li>Go to your Supabase Dashboard → SQL Editor</li>
                  <li>Copy the contents of <code className="px-2 py-1 bg-yellow-100 rounded">database/migrations/add_storage_policies.sql</code></li>
                  <li>Paste and run the SQL in the editor</li>
                  <li>Verify policies are created in Authentication → Policies → storage.objects</li>
                </ol>
              </div>

              <p className="mt-4">
                <strong>Note:</strong> You need to add <code className="px-2 py-1 bg-gray-100 rounded">SUPABASE_SERVICE_ROLE_KEY</code> to your .env.local file for bucket creation to work.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
