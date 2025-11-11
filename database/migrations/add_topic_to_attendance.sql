-- Add topic_id column to class_attendance table
ALTER TABLE class_attendance 
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_class_attendance_topic_id ON class_attendance(topic_id);

-- Update RLS policies to allow topic_id access
-- (existing policies should automatically cover this new column)
