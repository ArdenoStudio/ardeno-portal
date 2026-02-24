// ─── Auth Utilities ───────────────────────────────────
// Lightweight helpers. The main auth state is managed by
// Supabase via AuthContext. These are kept for backward
// compatibility and utility use only.

import type { JwtPayload } from '@/types';

/**
 * Decode a JWT payload without verification.
 * Useful for quick inspection only — never trust the
 * result for authorization decisions.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}
