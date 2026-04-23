CREATE TABLE IF NOT EXISTS physical_tests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  goalkeeper_id uuid REFERENCES goalkeepers(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  test_type text NOT NULL,
  value numeric NOT NULL,
  unit text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE physical_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own physical tests" ON physical_tests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_physical_tests_gk ON physical_tests (goalkeeper_id, date DESC);
