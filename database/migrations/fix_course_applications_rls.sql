-- Fix RLS policy for course_applications table
-- Allow anonymous users to insert applications (public form)

-- First, check if the table exists and create if not
CREATE TABLE IF NOT EXISTS course_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  programming_experience TEXT NOT NULL,
  development_environment TEXT NOT NULL,
  computer_type TEXT NOT NULL,
  motivation TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IMPORTANT: Disable RLS first, then re-enable with correct policies
ALTER TABLE course_applications DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'course_applications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON course_applications', pol.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE course_applications ENABLE ROW LEVEL SECURITY;

-- Create a simple INSERT policy that allows ANYONE to insert (no role check)
CREATE POLICY "public_insert_applications"
ON course_applications
FOR INSERT
TO public
WITH CHECK (true);

-- Also grant anon role explicitly
CREATE POLICY "anon_insert_applications"
ON course_applications
FOR INSERT
TO anon
WITH CHECK (true);

-- Create SELECT policy for admins
CREATE POLICY "admin_select_applications"
ON course_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create UPDATE policy for admins  
CREATE POLICY "admin_update_applications"
ON course_applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_applications_email ON course_applications(email);
CREATE INDEX IF NOT EXISTS idx_course_applications_status ON course_applications(status);
CREATE INDEX IF NOT EXISTS idx_course_applications_created_at ON course_applications(created_at DESC);
