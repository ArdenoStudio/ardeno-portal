import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Defensive check to prevent top-level "Invalid URL" throw
const isValidUrl = (u: string) => {
    try {
        return u.startsWith('https://') && new URL(u);
    } catch {
        return false;
    }
};

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
