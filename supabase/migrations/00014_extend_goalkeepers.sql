-- Phase 3: Extended Goalkeeper Profile Fields
ALTER TABLE goalkeepers
  ADD COLUMN IF NOT EXISTS preferred_foot TEXT,
  ADD COLUMN IF NOT EXISTS dominant_hand TEXT,
  ADD COLUMN IF NOT EXISTS wingspan INTEGER,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
  ADD COLUMN IF NOT EXISTS club_affiliation TEXT,
  ADD COLUMN IF NOT EXISTS registration_date TEXT,
  ADD COLUMN IF NOT EXISTS jersey_number INTEGER;
