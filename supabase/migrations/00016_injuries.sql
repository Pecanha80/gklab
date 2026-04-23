CREATE TABLE IF NOT EXISTS injuries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  goalkeeper_id uuid REFERENCES goalkeepers(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date,
  body_part text NOT NULL,
  injury_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  treatment text,
  return_to_play_status text DEFAULT 'not_started' CHECK (return_to_play_status IN ('not_started', 'phase_1', 'phase_2', 'phase_3', 'cleared')),
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own injuries" ON injuries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_injuries_gk ON injuries (goalkeeper_id, start_date DESC);
