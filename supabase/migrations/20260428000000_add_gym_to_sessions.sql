-- Add gym column to sessions table for pre-training exercises
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS gym JSONB DEFAULT '[]';
