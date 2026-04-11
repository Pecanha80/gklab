-- Create Goalkeepers Table
CREATE TABLE goalkeepers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('First Team', 'U23', 'U18')),
  status TEXT NOT NULL CHECK (status IN ('Ready', 'Minor Strain', 'In Training', 'Injured')),
  form INTEGER NOT NULL DEFAULT 0,
  recovery INTEGER NOT NULL DEFAULT 0,
  load INTEGER NOT NULL DEFAULT 0,
  "imageUrl" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Sessions Table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  focus TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  attending TEXT[] NOT NULL DEFAULT '{}',
  "imageUrl" TEXT,
  "isLive" BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Videos Table
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  duration TEXT,
  "imageUrl" TEXT,
  status TEXT NOT NULL CHECK (status IN ('Analysis Ready', 'Uncut', 'Edited')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE goalkeepers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access (since we don't have auth setup yet)
CREATE POLICY "Allow public read access on goalkeepers" ON goalkeepers FOR SELECT USING (true);
CREATE POLICY "Allow public read access on sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read access on videos" ON videos FOR SELECT USING (true);

-- Insert Initial Mock Data
INSERT INTO goalkeepers (id, name, category, status, form, recovery, load, "imageUrl") VALUES
  (gen_random_uuid(), 'Marcus Vogt', 'First Team', 'Ready', 98, 100, 85, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&h=256&auto=format&fit=crop'),
  (gen_random_uuid(), 'Daniel Silva', 'U23', 'Minor Strain', 65, 42, 30, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop'),
  (gen_random_uuid(), 'Leon Richter', 'U23', 'In Training', 78, 90, 76, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256&h=256&auto=format&fit=crop');

INSERT INTO sessions (id, title, time, focus, description, attending, "imageUrl", "isLive") VALUES
  (gen_random_uuid(), 'U23 Development', '14:30 - 16:00', ARRAY['Distribution', 'High Line'], 'Focus on transition play and rapid counter-distribution from hand to the wings. Drills involve 3v1 pressing scenarios.', ARRAY['JD', 'MK', 'AL'], 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop', true);

INSERT INTO videos (id, title, subtitle, duration, "imageUrl", status) VALUES
  (gen_random_uuid(), 'Lateral Save Mechanics', 'Vogt vs. Bayern U23 • Oct 18', '04:12', 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?q=80&w=800&auto=format&fit=crop', 'Analysis Ready'),
  (gen_random_uuid(), 'Session: High Ball Mastery', 'U23 Full Session • Oct 17', '12:45', 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?q=80&w=800&auto=format&fit=crop', 'Uncut'),
  (gen_random_uuid(), 'Reaction Speed Drills', 'Silva • Skill Spotlight', '02:22', 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=800&auto=format&fit=crop', 'Edited'),
  (gen_random_uuid(), 'Distribution Workshop', 'All Keepers • Oct 15', '05:30', 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=800&auto=format&fit=crop', 'Analysis Ready');
