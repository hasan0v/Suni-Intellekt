-- Add slide_url column to topics table
ALTER TABLE topics ADD COLUMN IF NOT EXISTS slide_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN topics.slide_url IS 'URL to uploaded slide file (PDF, PPTX) stored in Supabase storage';
