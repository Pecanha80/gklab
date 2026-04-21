-- Add missing columns to sessions table to match TrainingSession interface
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS "gameMoments" JSONB DEFAULT '[]';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS "tacticalPrinciples" JSONB DEFAULT '[]';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS "mesocycle" TEXT DEFAULT '';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS "athleteObservations" JSONB DEFAULT '[]';
