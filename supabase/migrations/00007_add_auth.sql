-- Add user_id to all tables for row-level ownership

ALTER TABLE goalkeepers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE wellness_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE methodology ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old public policies
DROP POLICY IF EXISTS "Allow public read on goalkeepers" ON goalkeepers;
DROP POLICY IF EXISTS "Allow public insert on goalkeepers" ON goalkeepers;
DROP POLICY IF EXISTS "Allow public update on goalkeepers" ON goalkeepers;
DROP POLICY IF EXISTS "Allow public delete on goalkeepers" ON goalkeepers;

DROP POLICY IF EXISTS "Allow public read on sessions" ON sessions;
DROP POLICY IF EXISTS "Allow public insert on sessions" ON sessions;
DROP POLICY IF EXISTS "Allow public update on sessions" ON sessions;
DROP POLICY IF EXISTS "Allow public delete on sessions" ON sessions;

DROP POLICY IF EXISTS "Allow public read on exercises" ON exercises;
DROP POLICY IF EXISTS "Allow public insert on exercises" ON exercises;
DROP POLICY IF EXISTS "Allow public update on exercises" ON exercises;
DROP POLICY IF EXISTS "Allow public delete on exercises" ON exercises;
DROP POLICY IF EXISTS "Public full access to exercises" ON exercises;

DROP POLICY IF EXISTS "Allow public read on videos" ON videos;
DROP POLICY IF EXISTS "Allow public insert on videos" ON videos;
DROP POLICY IF EXISTS "Allow public update on videos" ON videos;
DROP POLICY IF EXISTS "Allow public delete on videos" ON videos;

DROP POLICY IF EXISTS "Allow public read on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public insert on attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public update on attendance" ON attendance;

DROP POLICY IF EXISTS "Allow public read on wellness_logs" ON wellness_logs;
DROP POLICY IF EXISTS "Allow public insert on wellness_logs" ON wellness_logs;
DROP POLICY IF EXISTS "Allow public update on wellness_logs" ON wellness_logs;

DROP POLICY IF EXISTS "Allow public read on methodology" ON methodology;
DROP POLICY IF EXISTS "Allow public insert on methodology" ON methodology;
DROP POLICY IF EXISTS "Allow public update on methodology" ON methodology;

-- Create user-scoped policies for all tables

-- Goalkeepers
CREATE POLICY "Users can read own goalkeepers" ON goalkeepers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goalkeepers" ON goalkeepers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goalkeepers" ON goalkeepers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goalkeepers" ON goalkeepers FOR DELETE USING (auth.uid() = user_id);

-- Sessions
CREATE POLICY "Users can read own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);

-- Exercises
CREATE POLICY "Users can read own exercises" ON exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercises" ON exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercises" ON exercises FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercises" ON exercises FOR DELETE USING (auth.uid() = user_id);

-- Videos
CREATE POLICY "Users can read own videos" ON videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own videos" ON videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own videos" ON videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own videos" ON videos FOR DELETE USING (auth.uid() = user_id);

-- Attendance
CREATE POLICY "Users can read own attendance" ON attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attendance" ON attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON attendance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own attendance" ON attendance FOR DELETE USING (auth.uid() = user_id);

-- Wellness logs
CREATE POLICY "Users can read own wellness_logs" ON wellness_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wellness_logs" ON wellness_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wellness_logs" ON wellness_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wellness_logs" ON wellness_logs FOR DELETE USING (auth.uid() = user_id);

-- Methodology
CREATE POLICY "Users can read own methodology" ON methodology FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own methodology" ON methodology FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own methodology" ON methodology FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own methodology" ON methodology FOR DELETE USING (auth.uid() = user_id);

-- Update methodology primary key to include user_id (singleton per user)
-- Drop the old primary key and create a composite one
ALTER TABLE methodology DROP CONSTRAINT IF EXISTS methodology_pkey;
ALTER TABLE methodology ADD PRIMARY KEY (id, user_id);
