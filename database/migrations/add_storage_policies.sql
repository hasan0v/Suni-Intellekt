-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Users can upload own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all submissions" ON storage.objects;

-- ============================================
-- PROFILE IMAGES BUCKET POLICIES
-- ============================================

-- Allow users to upload their own profile images
CREATE POLICY "Users can upload own profile image"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to update their own profile images
CREATE POLICY "Users can update own profile image"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete own profile image"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read access to profile images (since bucket is public)
CREATE POLICY "Public can view profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- ============================================
-- TASK SUBMISSIONS BUCKET POLICIES
-- ============================================

-- Allow students to upload their own task submissions
CREATE POLICY "Students can upload own submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-submissions' AND
  (storage.foldername(name))[1] = 'submissions'
);

-- Allow users to read their own submissions and admins to read all
CREATE POLICY "Users can read own submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-submissions' AND
  (
    -- User can read their own submissions
    name LIKE '%' || auth.uid()::text || '%' OR
    -- Admins can read all submissions
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

-- Allow users to delete their own submissions
CREATE POLICY "Users can delete own submissions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-submissions' AND
  (
    -- User can delete their own submissions
    name LIKE '%' || auth.uid()::text || '%' OR
    -- Admins can delete any submission
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);
