import { createClient } from '@supabase/supabase-js';

export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgrjxhnkqwpusjqstjwz.supabase.co';
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtncmp4aG5rcXdwdXNqcXN0and6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODQ2NzgsImV4cCI6MjEwNDM2MDY3OH0.v8brtpcjOZpRlJbbG7jHxs4mvPJV7KzbIHEIQ3ee7EM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});