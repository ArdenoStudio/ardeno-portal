// ─── GET /api/admin/projects ───────────────────────────
// Admin-only endpoint to list and filter all projects.
// Supports optional query parameters:
//   ?stage=X     – filter by pipeline stage
//   ?status=Y    – filter by project status
//   ?q=Z         – case-insensitive search across project name,
//                  client name, and industry
//   ?limit=N     – pagination: max rows per page (default 20, max 100)
//   ?offset=N    – pagination: skip N rows (default 0)
//
// Returns: { projects: Project[], total: number }
//
// Security:
//   - JWT + admin guard via centralized guards
//   - Request ID for tracing, CORS enforcement

import type { Handler } from '@netlify/functions';
import { getDb } from './db/connection';
import { requireJwt, requireAdmin } from './middleware/guards';
import {
  createRequestId,
  corsPreflightResponse,
  jsonResponse,
  errorResponse,
  methodNotAllowed,
  handleError,
} from './middleware/response';

const VALID_STAGES = [
  'Discovery & Strategy',
  'UX & Wireframing',
  'Visual Design',
  'Development & Launch',
];
const VALID_STATUSES = ['Active', 'On Hold', 'Completed'];

export const handler: Handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin;
  const requestId = createRequestId();

  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse(origin);
  }

  if (event.httpMethod !== 'GET') {
    return methodNotAllowed(['GET'], requestId, origin);
  }

  try {
    const user = await requireJwt(event);
    requireAdmin(user);

    const sql = getDb();
    const stage = event.queryStringParameters?.stage || null;
    const status = event.queryStringParameters?.status || null;
    const q = event.queryStringParameters?.q || null;

    // Pagination params
    const rawLimit = parseInt(event.queryStringParameters?.limit || '20', 10);
    const rawOffset = parseInt(event.queryStringParameters?.offset || '0', 10);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 100);
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);

    // Validate enum values if provided
    if (stage && !VALID_STAGES.includes(stage)) {
      return errorResponse(
        400,
        'INVALID_STAGE',
        `stage must be one of: ${VALID_STAGES.join(', ')}`,
        requestId,
        origin
      );
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return errorResponse(
        400,
        'INVALID_STATUS',
        `status must be one of: ${VALID_STATUSES.join(', ')}`,
        requestId,
        origin
      );
    }

    // Escape LIKE wildcards in search query
    const searchPattern = q
      ? `%${q.replace(/[%_\\]/g, '\\$&')}%`
      : null;

    // Count total matching projects (for pagination metadata)
    const countResult = await sql`
      SELECT COUNT(*)::int AS total
      FROM projects p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE (${stage}::text IS NULL OR p.current_stage = ${stage})
        AND (${status}::text IS NULL OR p.current_status = ${status})
        AND (${searchPattern}::text IS NULL OR (
          p.project_name ILIKE ${searchPattern}
          OR u.name ILIKE ${searchPattern}
          OR COALESCE(p.industry, '') ILIKE ${searchPattern}
        ))
    `;

    const total = countResult[0]?.total ?? 0;

    // Fetch paginated projects
    const projects = await sql`
      SELECT p.*, u.name AS client_name, u.email AS client_email,
             u.profile_picture_url AS client_avatar
      FROM projects p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE (${stage}::text IS NULL OR p.current_stage = ${stage})
        AND (${status}::text IS NULL OR p.current_status = ${status})
        AND (${searchPattern}::text IS NULL OR (
          p.project_name ILIKE ${searchPattern}
          OR u.name ILIKE ${searchPattern}
          OR COALESCE(p.industry, '') ILIKE ${searchPattern}
        ))
      ORDER BY p.updated_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return jsonResponse(200, { projects, total }, requestId, origin);
  } catch (err) {
    return handleError(err, requestId, origin);
  }
};
