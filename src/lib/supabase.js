import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const hasValidSupabaseConfig = typeof url === 'string' && /^https?:\/\//.test(url) && typeof key === 'string' && key.length > 0;

// null means "local mode": the app still works, without accounts or friends.
export const supabase = hasValidSupabaseConfig ? createClient(url, key) : null;
