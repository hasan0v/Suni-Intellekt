import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Admin client with service role key for bucket creation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Check existing buckets
    const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return NextResponse.json(
        { error: 'Failed to list buckets', details: listError.message },
        { status: 500 }
      )
    }

    const results = {
      profileImages: { exists: false, created: false, error: null as string | null },
      taskSubmissions: { exists: false, created: false, error: null as string | null }
    }

    // Check and create profile-images bucket (public)
    const profileImagesBucket = existingBuckets?.find(b => b.name === 'profile-images')
    if (profileImagesBucket) {
      results.profileImages.exists = true
    } else {
      const { error } = await supabaseAdmin.storage.createBucket('profile-images', {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      })
      
      if (error) {
        results.profileImages.error = error.message
      } else {
        results.profileImages.created = true
      }
    }

    // Check and create task-submissions bucket (private)
    const taskSubmissionsBucket = existingBuckets?.find(b => b.name === 'task-submissions')
    if (taskSubmissionsBucket) {
      results.taskSubmissions.exists = true
    } else {
      const { error } = await supabaseAdmin.storage.createBucket('task-submissions', {
        public: false,
        fileSizeLimit: 52428800 // 50MB
      })
      
      if (error) {
        results.taskSubmissions.error = error.message
      } else {
        results.taskSubmissions.created = true
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Storage buckets created. Please run the RLS policy migration: database/migrations/add_storage_policies.sql',
      results,
      note: 'RLS policies must be set up separately via SQL migration'
    })
  } catch (error) {
    console.error('Storage setup error:', error)
    return NextResponse.json(
      { 
        error: 'Storage setup failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to list buckets', details: error.message },
        { status: 500 }
      )
    }

    const requiredBuckets = ['profile-images', 'task-submissions']
    const status = {
      configured: requiredBuckets.every(name => buckets?.some(b => b.name === name)),
      buckets: buckets?.map(b => ({
        name: b.name,
        public: b.public,
        fileSizeLimit: b.file_size_limit
      })),
      missing: requiredBuckets.filter(name => !buckets?.some(b => b.name === name))
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Storage check error:', error)
    return NextResponse.json(
      { 
        error: 'Storage check failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
