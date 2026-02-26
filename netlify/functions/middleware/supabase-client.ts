import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error('Supabase URL or Key not set in environment');
    }

    return createClient(url, key);
}
