// ─── Centralized Backend Guards ───────────────────────
// Shared guard utilities used by all Netlify Functions.
//
// requireJwt(event)          – Verify JWT, return user
// requireAdmin(user)         – Assert admin role
// requireProjectOwner(user, projectId) – Assert ownership

import type { HandlerEvent } from '@netlify/functions';
import { verifyAuth, type AuthUser } from './auth';
import { verifyAdmin as _verifyAdmin } from './admin';
import { getDb } from '../db/connection';

export type { AuthUser } from './auth';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verify the JWT in the Authorization header and return the
 * decoded user payload. Throws 401 if missing or invalid.
 */
export async function requireJwt(event: HandlerEvent): Promise<AuthUser> {
  return verifyAuth(event);
}

/**
 * Assert the user has admin privileges (email in ADMIN_EMAILS).
 * Throws 403 if not an admin.
 */
export function requireAdmin(user: AuthUser): void {
  _verifyAdmin(user);
}

/**
 * Assert the authenticated user owns the given project.
 * Admins bypass the ownership check. Non-admin users must
 * own the project or a 403 is thrown.
 */
export async function requireProjectOwner(
  user: AuthUser,
  projectId: string
): Promise<void> {
  // Admins can access any project
  if (user.isAdmin) return;

  if (!UUID_RE.test(projectId)) {
    throw Object.assign(new Error('Invalid project ID format'), {
      statusCode: 400,
      code: 'INVALID_ID',
    });
  }

  const sql = getDb();
  const rows = await sql`
    SELECT user_id FROM projects WHERE id = ${projectId}
  `;

  if (rows.length === 0) {
    throw Object.assign(new Error('Project not found'), {
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  }

  if (rows[0].user_id !== user.sub) {
    throw Object.assign(new Error('Access denied'), {
      statusCode: 403,
      code: 'FORBIDDEN',
    });
  }
}
