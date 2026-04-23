CREATE TABLE IF NOT EXISTS competency_assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  goalkeeper_id uuid REFERENCES goalkeepers(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  assessments jsonb NOT NULL DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE competency_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own competency assessments"
  ON competency_assessments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_competency_assessments_gk ON competency_assessments (goalkeeper_id, date DESC);
