import type { HandlerEvent } from '@netlify/functions';
import { getDb } from '../db/connection';
import { isAdminEmail } from './admin';
import { getSupabase } from './supabase-client';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  avatar: string | null;
  isAdmin: boolean;
}

// ─── Verify Supabase Access Token ────────────────────

export async function verifyAuth(event: HandlerEvent): Promise<AuthUser> {
  const header = event.headers.authorization || event.headers.Authorization;
  if (!header?.startsWith('Bearer ')) {
    throw Object.assign(new Error('Missing authorization token'), {
      statusCode: 401,
      code: 'MISSING_TOKEN',
    });
  }

  const token = header.slice(7);
  const supabase = getSupabase();

  const { data: { user: sbUser }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !sbUser) {
    console.error('[verifyAuth] Supabase auth error:', authError);
    throw Object.assign(new Error('Invalid or expired token'), {
      statusCode: 401,
      code: 'INVALID_TOKEN',
    });
  }

  // Extract user info from Supabase user object
  const email = sbUser.email;
  const meta = (sbUser.user_metadata || {}) as Record<string, string>;
  const name = meta.full_name || meta.name || email || 'Unknown';
  const avatar = meta.avatar_url || null;
  const supabaseId = sbUser.id;

  if (!email) {
    throw Object.assign(new Error('Token missing email claim'), {
      statusCode: 401,
      code: 'INVALID_TOKEN',
    });
  }

  // Get user from local DB (Read-only lookup)
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;

  if (rows.length === 0) {
    // This should theoretically not happen if syncUser was called,
    // but we'll handle it by returning a "sync required" state if needed
    // or just creating a basic record if we're feeling generous.
    // For "Enterprise" hardening, we should probably fail and force a sync.
    throw Object.assign(new Error('User profile not synchronized. Please log in again.'), {
      statusCode: 401,
      code: 'SYNC_REQUIRED',
    });
  }

  const user = rows[0];

  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    avatar: user.profile_picture_url,
    isAdmin: user.is_admin,
  };
}
