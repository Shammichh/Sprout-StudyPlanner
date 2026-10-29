import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// null means "local mode": the app still works, without accounts or friends.
export const supabase = url && key ? createClient(url, key) : null;
