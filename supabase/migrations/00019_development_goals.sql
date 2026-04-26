-- Development Goals for Individual Development Plan (IDP)
CREATE TABLE IF NOT EXISTS development_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goalkeeper_id UUID REFERENCES goalkeepers(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'tactical', 'physical', 'psychological')),
  description TEXT,
  target_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'achieved')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE development_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own development goals"
  ON development_goals FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_development_goals_gk_status ON development_goals(goalkeeper_id, status);
