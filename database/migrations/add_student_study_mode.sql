-- Add study_mode column to class_enrollments table
-- This allows classifying students as offline, online, or self_study

-- Add the study_mode column with default 'offline' (most common type)
ALTER TABLE class_enrollments 
ADD COLUMN IF NOT EXISTS study_mode VARCHAR(20) DEFAULT 'offline' 
CHECK (study_mode IN ('offline', 'online', 'self_study'));

-- Create index for filtering by study_mode
CREATE INDEX IF NOT EXISTS idx_class_enrollments_study_mode ON class_enrollments(study_mode);

-- Create composite index for common queries (class + study_mode)
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_mode ON class_enrollments(class_id, study_mode);

-- Add comment to describe the column
COMMENT ON COLUMN class_enrollments.study_mode IS 'Student study mode: offline (in-person), online (virtual), or self_study (independent learning)';

-- Optional: Update existing records to have a default value if null
UPDATE class_enrollments SET study_mode = 'offline' WHERE study_mode IS NULL;
