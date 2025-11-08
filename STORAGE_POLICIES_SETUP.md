# Storage RLS Policies Setup Guide

## Why This Is Needed

Supabase Storage uses Row Level Security (RLS) policies to control who can upload, read, update, and delete files. Without these policies, users will get "row-level security policy" errors when trying to upload files.

## Setup Instructions

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `dcsshjzqyysqpzhgewtx`

2. **Navigate to Storage Policies**
   - Click on **Storage** in the left sidebar
   - Click on **Policies** tab

3. **Create Policies for `profile-images` Bucket**

   #### Policy 1: Upload Own Profile Image
   - Click "New Policy" → "For full customization"
   - **Policy name**: `Users can upload own profile image`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **WITH CHECK expression**:
     ```sql
     (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)
     ```
   - Click "Save policy"

   #### Policy 2: Update Own Profile Image
   - Click "New Policy" → "For full customization"
   - **Policy name**: `Users can update own profile image`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)
     ```
   - Click "Save policy"

   #### Policy 3: Delete Own Profile Image
   - Click "New Policy" → "For full customization"
   - **Policy name**: `Users can delete own profile image`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text)
     ```
   - Click "Save policy"

   #### Policy 4: Public Read Access
   - Click "New Policy" → "For full customization"
   - **Policy name**: `Public can view profile images`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public` (or both `public` and `authenticated`)
   - **USING expression**:
     ```sql
     (bucket_id = 'profile-images')
     ```
   - Click "Save policy"

4. **Create Policies for `task-submissions` Bucket**

   #### Policy 1: Upload Submissions
   - Click "New Policy" → "For full customization"
   - **Policy name**: `Students can upload submissions`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **WITH CHECK expression**:
     ```sql
     (bucket_id = 'task-submissions' AND (storage.foldername(name))[1] = 'submissions')
     ```
   - Click "Save policy"

   #### Policy 2: Read Own Submissions
   - Click "New Policy" → "For full customization"
   - **Policy name**: `Users can read own submissions`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     (bucket_id = 'task-submissions' AND (name LIKE '%' || auth.uid()::text || '%' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))
     ```
   - Click "Save policy"

   #### Policy 3: Delete Own Submissions
   - Click "New Policy" → "For full customization"
   - **Policy name**: `Users can delete own submissions`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**:
     ```sql
     (bucket_id = 'task-submissions' AND (name LIKE '%' || auth.uid()::text || '%' OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')))
     ```
   - Click "Save policy"

### Method 2: Quick Template Policies (Simpler but less secure)

If the above is too complex, you can use Supabase's policy templates:

1. Go to Storage → Policies
2. For **profile-images**:
   - Click "New Policy" → "Allow access to authenticated users only"
   - This creates basic policies for authenticated users
   
3. For **task-submissions**:
   - Click "New Policy" → "Allow access to authenticated users only"
   - This creates basic policies for authenticated users

**Note**: Template policies are less secure as they allow any authenticated user to access any file. The custom policies above restrict access properly.

## Verification

After creating policies:

1. Go to your app: http://localhost:3000/dashboard/profile
2. Try uploading a profile image
3. It should work without errors!

## Troubleshooting

### Still getting RLS errors?

1. Verify all policies are created in Supabase Dashboard → Storage → Policies
2. Check that bucket names match exactly: `profile-images` and `task-submissions`
3. Ensure you're logged in as an authenticated user
4. Check browser console for detailed error messages

### Policies not appearing?

- Make sure RLS is enabled on the bucket (it should be by default)
- Try refreshing the Supabase Dashboard
- Verify you have the correct permissions on your Supabase account

## What These Policies Do

### Profile Images
- ✅ Users can upload files to `users/{their-user-id}/` folder only
- ✅ Users can update/delete their own profile images only
- ✅ Everyone (public) can view profile images
- ❌ Users cannot access other users' profile folders

### Task Submissions
- ✅ Students can upload submissions to `submissions/{task-id}/` folder
- ✅ Users can read their own submissions (filename contains their user ID)
- ✅ Admins can read all submissions
- ✅ Users can delete their own submissions
- ✅ Admins can delete any submission
