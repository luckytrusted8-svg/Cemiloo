import { SupabaseClient } from '@supabase/supabase-js';

// Mode data statis murni (Local Storage di browser/perangkat):
// Supabase dimatikan agar data murni statis dari nol dan tidak mengambil menu demo dari database online
export const isSupabaseConfigured: boolean = false;
export const supabase: SupabaseClient | null = null;
