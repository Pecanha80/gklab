-- Remove all remaining public access policies

-- Exercises
DROP POLICY IF EXISTS "Public DELETE access on exercises" ON exercises;
DROP POLICY IF EXISTS "Public INSERT access on exercises" ON exercises;
DROP POLICY IF EXISTS "Public SELECT access on exercises" ON exercises;
DROP POLICY IF EXISTS "Public UPDATE access on exercises" ON exercises;

-- Goalkeepers
DROP POLICY IF EXISTS "Public DELETE access on goalkeepers" ON goalkeepers;
DROP POLICY IF EXISTS "Public INSERT access on goalkeepers" ON goalkeepers;
DROP POLICY IF EXISTS "Public SELECT access on goalkeepers" ON goalkeepers;
DROP POLICY IF EXISTS "Public UPDATE access on goalkeepers" ON goalkeepers;

-- Sessions
DROP POLICY IF EXISTS "Public DELETE access on sessions" ON sessions;
DROP POLICY IF EXISTS "Public INSERT access on sessions" ON sessions;
DROP POLICY IF EXISTS "Public SELECT access on sessions" ON sessions;
DROP POLICY IF EXISTS "Public UPDATE access on sessions" ON sessions;

-- Videos
DROP POLICY IF EXISTS "Public DELETE access on videos" ON videos;
DROP POLICY IF EXISTS "Public INSERT access on videos" ON videos;
DROP POLICY IF EXISTS "Public SELECT access on videos" ON videos;
DROP POLICY IF EXISTS "Public UPDATE access on videos" ON videos;

-- Attendance
DROP POLICY IF EXISTS "Enable delete for all users" ON attendance;
DROP POLICY IF EXISTS "Enable insert for all users" ON attendance;
DROP POLICY IF EXISTS "Enable read access for all users" ON attendance;
DROP POLICY IF EXISTS "Enable update for all users" ON attendance;

-- Wellness logs
DROP POLICY IF EXISTS "Public All Access" ON wellness_logs;
