-- Add repetitions field to exercises table
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS repetitions text;

-- Update type constraint to support new GK-specific exercise types
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_type_check;
ALTER TABLE exercises ADD CONSTRAINT exercises_type_check
  CHECK (type IN ('shotStopping', 'crosses', 'oneVsOne', 'footwork', 'distribution', 'depthControl', 'setPieces', 'warmup',
                  'analytical', 'decision', 'contextualized'));

-- Migrate legacy exercise types to new GK-specific types
UPDATE exercises SET type = 'shotStopping' WHERE type = 'analytical';
UPDATE exercises SET type = 'oneVsOne' WHERE type = 'decision';
UPDATE exercises SET type = 'footwork' WHERE type = 'contextualized';
