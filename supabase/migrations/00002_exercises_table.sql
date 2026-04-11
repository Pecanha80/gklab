-- Create Exercises Table
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Analytical', 'Decision', 'Contextualized', 'Warmup')),
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  organization TEXT NOT NULL,
  execution TEXT NOT NULL,
  progression TEXT NOT NULL,
  "successCriteria" TEXT NOT NULL,
  duration TEXT NOT NULL,
  intensity TEXT NOT NULL CHECK (intensity IN ('Low', 'Medium', 'High')),
  diagram TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read/write access (since we don't have auth setup yet)
CREATE POLICY "Allow public read access on exercises" ON exercises FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on exercises" ON exercises FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on exercises" ON exercises FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on exercises" ON exercises FOR DELETE USING (true);

-- Also add insert/update/delete policies for other tables if they don't exist
CREATE POLICY "Allow public insert access on goalkeepers" ON goalkeepers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on goalkeepers" ON goalkeepers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on goalkeepers" ON goalkeepers FOR DELETE USING (true);

CREATE POLICY "Allow public insert access on sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on sessions" ON sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on sessions" ON sessions FOR DELETE USING (true);

CREATE POLICY "Allow public insert access on videos" ON videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on videos" ON videos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on videos" ON videos FOR DELETE USING (true);
