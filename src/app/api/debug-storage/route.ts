import { NextResponse } from 'next/server'
import { supabaseAdmin, supabaseServiceKey } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bucketName = searchParams.get('bucket') || 'profile-images'
    
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Service key not configured' },
        { status: 500 }
      )
    }

    // Get all policies for the bucket
    const { data: policies, error } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .or(`tablename.eq.objects`)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch policies', details: error.message },
        { status: 500 }
      )
    }

    // Get bucket info
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucket = buckets?.find(b => b.name === bucketName)

    return NextResponse.json({
      bucket: bucket,
      policies: policies,
      recommendation: `
The policy should check:
1. bucket_id = '${bucketName}'
2. Path structure matches: storage.foldername(name)

For profile-images, the path is: users/{user_id}/profile.{ext}
So the policy should check:
- (storage.foldername(name))[1] = 'users' (first folder)
- (storage.foldername(name))[2] = auth.uid()::text (second folder should be user's ID)

Current bucket configuration:
${JSON.stringify(bucket, null, 2)}
      `
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
