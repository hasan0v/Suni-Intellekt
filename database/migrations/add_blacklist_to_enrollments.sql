-- Add blacklist field to class_enrollments table
-- This allows admins to block students from accessing class materials

ALTER TABLE class_enrollments
ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT FALSE;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_class_enrollments_blacklist 
ON class_enrollments(class_id, is_blacklisted);

-- Update RLS policies to respect blacklist
-- Students cannot access materials if blacklisted

-- Create a function to check if user is blacklisted in a class
CREATE OR REPLACE FUNCTION is_user_blacklisted(p_user_id UUID, p_class_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM class_enrollments 
    WHERE user_id = p_user_id 
    AND class_id = p_class_id 
    AND is_blacklisted = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update class_materials RLS policy to check blacklist
DROP POLICY IF EXISTS "Students can view materials of their enrolled classes" ON class_materials;

CREATE POLICY "Students can view materials of their enrolled classes"
ON class_materials FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM class_enrollments
    WHERE class_enrollments.class_id = class_materials.class_id
    AND class_enrollments.user_id = auth.uid()
    AND class_enrollments.status = 'active'
    AND class_enrollments.is_blacklisted = FALSE
  )
  OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Comment explaining the blacklist feature
COMMENT ON COLUMN class_enrollments.is_blacklisted IS 'When true, student cannot access class materials, courses, or submit tasks';
