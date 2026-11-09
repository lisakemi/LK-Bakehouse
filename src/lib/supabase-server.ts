import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseServerConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseServiceKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseServiceKey.includes('your-supabase-service-role')
  );
};

let serverClientInstance: SupabaseClient | null = null;

if (isSupabaseServerConfigured() && supabaseUrl && supabaseServiceKey) {
  try {
    serverClientInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log('Supabase Server SDK initialized for secure backend operations.');
  } catch (err) {
    console.warn('Failed to initialize Supabase server client:', err);
  }
}

export const supabaseServer = serverClientInstance;
