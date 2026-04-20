-- Add category column to exercises table
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS category TEXT;

-- Create an index for better performance when filtering by category
CREATE INDEX IF NOT EXISTS exercises_category_idx ON exercises (category);
