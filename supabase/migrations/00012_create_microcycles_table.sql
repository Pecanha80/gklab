-- Create microcycles table (documents the schema already in production)
-- This table was created manually; this migration ensures it exists with the correct schema.

CREATE TABLE IF NOT EXISTS public.microcycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  match_day TEXT,
  match_opponent TEXT,
  match_location TEXT,
  match_time TEXT,
  match_competition TEXT,
  rest_days TEXT[] DEFAULT '{}',
  mesocycle TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE microcycles ENABLE ROW LEVEL SECURITY;

-- User-scoped policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'microcycles_select_own' AND tablename = 'microcycles') THEN
    CREATE POLICY microcycles_select_own ON microcycles FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'microcycles_insert_own' AND tablename = 'microcycles') THEN
    CREATE POLICY microcycles_insert_own ON microcycles FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'microcycles_update_own' AND tablename = 'microcycles') THEN
    CREATE POLICY microcycles_update_own ON microcycles FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'microcycles_delete_own' AND tablename = 'microcycles') THEN
    CREATE POLICY microcycles_delete_own ON microcycles FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
