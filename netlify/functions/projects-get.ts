// ─── GET /api/projects/:projectId ──────────────────────
// Returns a single project with its update history.
//
// The projectId arrives via query parameter, mapped by
// the Netlify redirect rule:
//   /api/projects/:projectId → /.netlify/functions/projects-get?id=:projectId
//
// Security:
//   - JWT authentication required
//   - Non-admin users can only access their own projects (ownership check)
//   - Admins can access any project
//   - UUID format is validated before querying
//   - Request ID for tracing, CORS enforcement

import type { Handler } from '@netlify/functions';
import { getDb } from './db/connection';
import { requireJwt } from './middleware/guards';
import {
  createRequestId,
  corsPreflightResponse,
  jsonResponse,
  errorResponse,
  methodNotAllowed,
  handleError,
} from './middleware/response';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const sql = getDb();

    const projectId = event.queryStringParameters?.id;
    if (!projectId) {
      return errorResponse(400, 'MISSING_PARAM', 'Missing project id', requestId, origin);
    }

    // Validate UUID format
    if (!UUID_RE.test(projectId)) {
      return errorResponse(400, 'INVALID_ID', 'Project id must be a valid UUID', requestId, origin);
    }

    // Get project with client info
    const projects = await sql`
      SELECT p.*, u.name AS client_name, u.email AS client_email,
             u.profile_picture_url AS client_avatar
      FROM projects p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ${projectId}
    `;

    if (projects.length === 0) {
      return errorResponse(404, 'NOT_FOUND', 'Project not found', requestId, origin);
    }

    const project = projects[0];

    // Verify ownership (admins bypass)
    if (!user.isAdmin && project.user_id !== user.sub) {
      return errorResponse(403, 'FORBIDDEN', 'Access denied', requestId, origin);
    }

    // Get update history
    const updates = await sql`
      SELECT * FROM project_updates
      WHERE project_id = ${projectId}
      ORDER BY updated_at DESC
    `;

    return jsonResponse(200, { project, updates }, requestId, origin);
  } catch (err) {
    return handleError(err, requestId, origin);
  }
};
