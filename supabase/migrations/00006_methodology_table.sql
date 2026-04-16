-- Methodology: stores the coach's training methodology as a single JSON document per user
-- Since there's no auth yet, we use a singleton row with a fixed key

CREATE TABLE IF NOT EXISTS methodology (
  id text PRIMARY KEY DEFAULT 'default',
  game_model jsonb NOT NULL DEFAULT '[]'::jsonb,
  competency_profiles jsonb NOT NULL DEFAULT '[]'::jsonb,
  periodization jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS (public read/write like other tables)
ALTER TABLE methodology ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on methodology"
  ON methodology FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on methodology"
  ON methodology FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on methodology"
  ON methodology FOR UPDATE
  USING (true);
