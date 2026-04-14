-- Add INSERT, UPDATE, DELETE policies for all tables (matching existing public SELECT pattern)
-- TODO: Scope to auth.uid() when authentication is implemented

-- Goalkeepers
CREATE POLICY "Allow public insert on goalkeepers" ON goalkeepers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on goalkeepers" ON goalkeepers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on goalkeepers" ON goalkeepers FOR DELETE USING (true);

-- Sessions
CREATE POLICY "Allow public insert on sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on sessions" ON sessions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on sessions" ON sessions FOR DELETE USING (true);

-- Videos
CREATE POLICY "Allow public insert on videos" ON videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on videos" ON videos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on videos" ON videos FOR DELETE USING (true);

-- Exercises
CREATE POLICY "Allow public insert on exercises" ON exercises FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on exercises" ON exercises FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on exercises" ON exercises FOR DELETE USING (true);
