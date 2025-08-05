-- Add video_url column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Update existing projects with sample video URLs (optional)
-- You can remove this section if you don't want sample data
UPDATE projects SET video_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' WHERE id = 'portfolio-website';
UPDATE projects SET video_url = 'https://drive.google.com/file/d/1234567890/view' WHERE id = 'todo-app';
