import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if the user has configured the keys in the environment
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

// Create the Supabase client (uses placeholders if not configured to prevent crashes)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
