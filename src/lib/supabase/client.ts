import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://rwlfhgdznebfqncqxyel.supabase.co';
const defaultSupabaseAnonKey = 'sb_publishable_iISG2sof1GP4A2asoqBbdA_yPz2Yx2V';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
