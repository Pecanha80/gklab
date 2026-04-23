-- Goalkeeper notes table for coach observations per athlete
CREATE TABLE IF NOT EXISTS goalkeeper_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  goalkeeper_id uuid REFERENCES goalkeepers(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL CHECK (category IN ('technical', 'tactical', 'behavioral', 'medical')),
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE goalkeeper_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own goalkeeper notes"
  ON goalkeeper_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for feed queries
CREATE INDEX idx_goalkeeper_notes_gk_date ON goalkeeper_notes (goalkeeper_id, date DESC);
