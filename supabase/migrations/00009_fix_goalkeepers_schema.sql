-- Fix goalkeepers table: align CHECK constraint with frontend values and add missing columns

-- 1. Drop the old category CHECK constraint that only allows 'First Team', 'U23', 'U18'
ALTER TABLE goalkeepers DROP CONSTRAINT IF EXISTS goalkeepers_category_check;

-- 2. Migrate existing category data to match frontend values
UPDATE goalkeepers SET category = 'firstTeam' WHERE category = 'First Team';
UPDATE goalkeepers SET category = 'u23' WHERE category = 'U23';
UPDATE goalkeepers SET category = 'u18' WHERE category = 'U18';

-- 3. Add new CHECK constraint matching frontend category values
ALTER TABLE goalkeepers ADD CONSTRAINT goalkeepers_category_check
  CHECK (category IN ('firstTeam', 'u23', 'u21', 'u18', 'u16', 'academy'));

-- 4. Add missing columns for extended goalkeeper profile
ALTER TABLE goalkeepers ADD COLUMN IF NOT EXISTS "birthDate" TEXT;
ALTER TABLE goalkeepers ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE goalkeepers ADD COLUMN IF NOT EXISTS weight INTEGER;
ALTER TABLE goalkeepers ADD COLUMN IF NOT EXISTS membership TEXT DEFAULT 'permanent' CHECK (membership IN ('permanent', 'trial'));
ALTER TABLE goalkeepers ADD COLUMN IF NOT EXISTS "trialStartDate" TEXT;
ALTER TABLE goalkeepers ADD COLUMN IF NOT EXISTS "trialEndDate" TEXT;
ALTER TABLE goalkeepers ADD COLUMN IF NOT EXISTS "trialNotes" TEXT;
