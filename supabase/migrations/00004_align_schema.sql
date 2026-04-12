-- 1. Fix exercises table: align CHECK constraints with TypeScript lowercase values

-- Drop old CHECK constraints
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_type_check;
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_intensity_check;

-- Add new CHECK constraints with lowercase values
ALTER TABLE exercises ADD CONSTRAINT exercises_type_check
  CHECK (type IN ('analytical', 'decision', 'contextualized', 'warmup'));

ALTER TABLE exercises ADD CONSTRAINT exercises_intensity_check
  CHECK (intensity IN ('low', 'medium', 'high'));

-- Migrate existing data to lowercase
UPDATE exercises SET type = LOWER(type) WHERE type != LOWER(type);
UPDATE exercises SET intensity = LOWER(intensity) WHERE intensity != LOWER(intensity);


-- 2. Fix sessions table: align with TrainingSession interface

-- Add titles as TEXT array (replaces singular title)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS titles TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing title data to titles array
UPDATE sessions SET titles = ARRAY[title] WHERE title IS NOT NULL AND titles = '{}';

-- Make title nullable (kept for backwards compat, but titles is the source of truth)
ALTER TABLE sessions ALTER COLUMN title DROP NOT NULL;

-- Add generalObjectives as JSONB array (replaces singular generalObjective)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS "generalObjectives" JSONB DEFAULT '[]';

-- Migrate existing generalObjective data
UPDATE sessions SET "generalObjectives" = to_jsonb(ARRAY["generalObjective"])
  WHERE "generalObjective" IS NOT NULL AND "generalObjectives" = '[]'::jsonb;

-- Make time nullable (not always required for new sessions)
ALTER TABLE sessions ALTER COLUMN time DROP NOT NULL;
ALTER TABLE sessions ALTER COLUMN time SET DEFAULT '';
