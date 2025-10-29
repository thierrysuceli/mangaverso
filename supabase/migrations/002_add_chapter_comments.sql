-- Migration 002: Add chapter comments support
-- Created: 2025-10-29

-- 1. Add chapter_id column to comments table
ALTER TABLE comments
ADD COLUMN chapter_id TEXT;

-- 2. Add chapter_title and chapter_number for better UX
ALTER TABLE comments
ADD COLUMN chapter_title TEXT,
ADD COLUMN chapter_number TEXT;

-- 3. Update constraint: comment must have either manga_id OR chapter_id (but not both)
ALTER TABLE comments
DROP CONSTRAINT IF EXISTS comments_manga_or_chapter_check;

ALTER TABLE comments
ADD CONSTRAINT comments_manga_or_chapter_check 
CHECK (
  (manga_id IS NOT NULL AND chapter_id IS NULL) OR
  (manga_id IS NULL AND chapter_id IS NOT NULL)
);

-- 4. Create index for chapter comments queries
CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- 5. Update RLS policy for chapter comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

-- 6. Create view for chapter comment stats
CREATE OR REPLACE VIEW chapter_stats AS
SELECT 
  chapter_id,
  COUNT(DISTINCT CASE WHEN parent_id IS NULL THEN id END) as comments_count,
  COUNT(DISTINCT user_id) as unique_commenters
FROM comments
WHERE chapter_id IS NOT NULL
GROUP BY chapter_id;

-- Grant access to views
GRANT SELECT ON chapter_stats TO authenticated;

-- 7. Add helpful comments
COMMENT ON COLUMN comments.chapter_id IS 'Chapter identifier from external API (MangaDex or LerManga)';
COMMENT ON COLUMN comments.chapter_title IS 'Chapter title for display purposes';
COMMENT ON COLUMN comments.chapter_number IS 'Chapter number for sorting and display';
COMMENT ON CONSTRAINT comments_manga_or_chapter_check ON comments IS 'Ensures comment is associated with either a manga or a chapter, not both';
