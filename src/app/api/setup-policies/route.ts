import { NextResponse } from 'next/server'

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
        { status: 500 }
      )
    }

    // Profile Images Policies
    const profilePolicies = [
      {
        name: 'Users can upload own profile image',
        bucket_id: 'profile-images',
        command: 'INSERT',
        definition: `(bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)`,
        roles: ['authenticated']
      },
      {
        name: 'Users can update own profile image',
        bucket_id: 'profile-images',
        command: 'UPDATE',
        definition: `(bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)`,
        roles: ['authenticated']
      },
      {
        name: 'Users can delete own profile image',
        bucket_id: 'profile-images',
        command: 'DELETE',
        definition: `(bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)`,
        roles: ['authenticated']
      },
      {
        name: 'Public can view profile images',
        bucket_id: 'profile-images',
        command: 'SELECT',
        definition: `(bucket_id = 'profile-images')`,
        roles: ['public', 'authenticated']
      }
    ]

    // Task Submissions Policies
    const taskPolicies = [
      {
        name: 'Students can upload submissions',
        bucket_id: 'task-submissions',
        command: 'INSERT',
        definition: `(bucket_id = 'task-submissions' AND (storage.foldername(name))[1] = 'submissions')`,
        roles: ['authenticated']
      },
      {
        name: 'Users can read own submissions',
        bucket_id: 'task-submissions',
        command: 'SELECT',
        definition: `(bucket_id = 'task-submissions' AND (name LIKE '%' || auth.uid()::text || '%' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))`,
        roles: ['authenticated']
      },
      {
        name: 'Users can delete own submissions',
        bucket_id: 'task-submissions',
        command: 'DELETE',
        definition: `(bucket_id = 'task-submissions' AND (name LIKE '%' || auth.uid()::text || '%' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))`,
        roles: ['authenticated']
      }
    ]

    // Try to create policies using Management API
    // Note: This requires the Management API which may not be available in all plans

    return NextResponse.json({
      success: false,
      message: 'Storage policies cannot be created via API. Please use Supabase Dashboard.',
      instructions: {
        step1: 'Go to Supabase Dashboard → Storage → Policies',
        step2: 'For each bucket (profile-images, task-submissions), add the policies shown below',
        policies: {
          profileImages: profilePolicies,
          taskSubmissions: taskPolicies
        }
      },
      manualInstructions: `
MANUAL SETUP REQUIRED:

1. Go to Supabase Dashboard
2. Navigate to Storage → Policies
3. Create the following policies:

=== PROFILE-IMAGES BUCKET ===

Policy 1: "Users can upload own profile image"
- Operation: INSERT
- Target roles: authenticated
- USING expression (leave empty for INSERT)
- WITH CHECK expression:
  (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)

Policy 2: "Users can update own profile image"  
- Operation: UPDATE
- Target roles: authenticated
- USING expression:
  (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)

Policy 3: "Users can delete own profile image"
- Operation: DELETE
- Target roles: authenticated
- USING expression:
  (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)

Policy 4: "Public can view profile images"
- Operation: SELECT
- Target roles: public
- USING expression:
  (bucket_id = 'profile-images')

=== TASK-SUBMISSIONS BUCKET ===

Policy 1: "Students can upload submissions"
- Operation: INSERT
- Target roles: authenticated
- WITH CHECK expression:
  (bucket_id = 'task-submissions' AND (storage.foldername(name))[1] = 'submissions')

Policy 2: "Users can read own submissions"
- Operation: SELECT
- Target roles: authenticated
- USING expression:
  (bucket_id = 'task-submissions' AND (name LIKE '%' || auth.uid()::text || '%' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))

Policy 3: "Users can delete own submissions"
- Operation: DELETE
- Target roles: authenticated
- USING expression:
  (bucket_id = 'task-submissions' AND (name LIKE '%' || auth.uid()::text || '%' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))
      `
    })
  } catch (error) {
    console.error('Policy setup error:', error)
    return NextResponse.json(
      { 
        error: 'Policy setup failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to get policy setup instructions'
  })
}
