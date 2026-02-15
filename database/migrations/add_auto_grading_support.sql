-- Add auto-grading support to submissions table
-- This migration adds columns needed for automatic AI grading with bonus points and review queue

-- Add needs_review flag for admin review queue
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE;

-- Add ai_score to store original AI score before bonus adjustment
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_score INTEGER;

-- Add auto_graded_at timestamp
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS auto_graded_at TIMESTAMP WITH TIME ZONE;

-- Update status check constraint to include 'pending_review' status
-- First drop the existing constraint, then add a new one with the additional status
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_status_check 
  CHECK (status IN ('submitted', 'graded', 'pending_review', 'rejected'));

-- Add index for review queue queries
CREATE INDEX IF NOT EXISTS idx_submissions_needs_review ON submissions(needs_review) WHERE needs_review = TRUE;

-- Add index for auto-grading queries (pending submissions)
CREATE INDEX IF NOT EXISTS idx_submissions_status_submitted ON submissions(status) WHERE status = 'submitted';

-- Update RLS policies to allow admin to access review queue
-- (Existing admin policies should already cover this, but adding explicit comment)

COMMENT ON COLUMN submissions.needs_review IS 'Flag indicating submission needs manual admin review (AI score < 70)';
COMMENT ON COLUMN submissions.ai_score IS 'Original AI-suggested score before any bonus adjustments';
COMMENT ON COLUMN submissions.auto_graded_at IS 'Timestamp of last auto-grading attempt';
