// ─── /api/projects ─────────────────────────────────────
// GET  → List projects (clients see own, admins see all)
// POST → Create a new project (rate limited)
//
// Auth flow:
//   1. Client authenticates via Google OAuth → gets Google ID token
//   2. Client sends ID token to POST /api/auth-google
//   3. Backend verifies Google token (JWKS), upserts user, returns custom JWT
//   4. All subsequent requests (including this one) use the custom JWT
//      via the Authorization: Bearer <jwt> header
//
// The custom JWT contains: sub (user UUID), email, name, avatar, isAdmin
// It is signed with HS256 using JWT_SECRET and expires in 24h.

import type { Handler, HandlerEvent } from '@netlify/functions';
import { getDb } from './db/connection';
import { requireJwt } from './middleware/guards';
import { checkRateLimit } from './middleware/rate-limit';
import { validate, type ValidationSchema } from './middleware/validate';
import { sanitizeString } from './middleware/sanitize';
import {
  createRequestId,
  corsPreflightResponse,
  jsonResponse,
  errorResponse,
  methodNotAllowed,
  parseJsonBody,
  handleError,
} from './middleware/response';

// ─── Validation Schema ────────────────────────────────

const CREATE_PROJECT_SCHEMA: ValidationSchema = {
  project_name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    label: 'Project name',
  },
  industry: {
    type: 'string',
    maxLength: 100,
    label: 'Industry',
  },
  description: {
    type: 'string',
    maxLength: 2000,
    label: 'Description',
  },
  goals: {
    type: 'string',
    maxLength: 1000,
    label: 'Goals',
  },
  target_audience: {
    type: 'string',
    maxLength: 500,
    label: 'Target audience',
  },
  deadline: {
    type: 'string',
    isDate: true,
    label: 'Deadline',
  },
  budget_range: {
    type: 'string',
    maxLength: 100,
    label: 'Budget range',
  },
  additional_notes: {
    type: 'string',
    maxLength: 2000,
    label: 'Additional notes',
  },
};

// ─── Route Handler ────────────────────────────────────

export const handler: Handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin;
  const requestId = createRequestId();

  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse(origin);
  }

  switch (event.httpMethod) {
    case 'GET':
      return handleList(event, requestId, origin);
    case 'POST':
      return handleCreate(event, requestId, origin);
    default:
      return methodNotAllowed(['GET', 'POST'], requestId, origin);
  }
};

// ─── GET /api/projects ────────────────────────────────
//
// - Authenticated users see only their own projects
// - Admin users see all projects with joined client info

async function handleList(event: HandlerEvent, requestId: string, origin?: string) {
  try {
    const user = await requireJwt(event);
    const sql = getDb();

    let projects;

    if (user.isAdmin) {
      projects = await sql`
        SELECT p.*, u.name AS client_name, u.email AS client_email,
               u.profile_picture_url AS client_avatar
        FROM projects p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
      `;
    } else {
      projects = await sql`
        SELECT * FROM projects
        WHERE user_id = ${user.sub}
        ORDER BY created_at DESC
      `;
    }

    return jsonResponse(200, projects, requestId, origin);
  } catch (err) {
    return handleError(err, requestId, origin);
  }
}

// ─── POST /api/projects ──────────────────────────────
//
// Creates a new project for the authenticated user.
//
// Security:
//   - JWT is verified before any processing
//   - Rate limited: 5 project creations per hour per user
//   - Request body is size-guarded, parsed, validated, and sanitized
//   - Only admins may assign a project to another user (user_id override)
//   - When overriding user_id, the target user is verified to exist
//   - Deadline is checked to prevent past dates
//   - All string inputs are stripped of HTML/script tags
//   - Internal errors are never leaked to the client

async function handleCreate(event: HandlerEvent, requestId: string, origin?: string) {
  try {
    // ── 1. Authenticate ─────────────────────────────
    const user = await requireJwt(event);
    const sql = getDb();

    // ── 2. Rate limit: 5 projects per hour per user ──
    await checkRateLimit(`create-project:${user.sub}`, 5, 60);

    // ── 3. Parse request body ───────────────────────
    const parsed = parseJsonBody(event.body, requestId);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    // ── 4. Validate fields ──────────────────────────
    const { valid, errors } = validate(body, CREATE_PROJECT_SCHEMA);
    if (!valid) {
      return errorResponse(400, 'VALIDATION_ERROR', errors.join('; '), requestId, origin);
    }

    // ── 5. Sanitize all string inputs ───────────────
    const project_name = sanitizeString(body.project_name as string);
    const industry = body.industry
      ? sanitizeString(body.industry as string)
      : null;
    const description = body.description
      ? sanitizeString(body.description as string)
      : null;
    const goals = body.goals
      ? sanitizeString(body.goals as string)
      : null;
    const target_audience = body.target_audience
      ? sanitizeString(body.target_audience as string)
      : null;
    const deadline = body.deadline ? (body.deadline as string) : null;
    const budget_range = body.budget_range
      ? sanitizeString(body.budget_range as string)
      : null;
    const additional_notes = body.additional_notes
      ? sanitizeString(body.additional_notes as string)
      : null;

    // ── 6. Resolve project ownership ────────────────
    // Default: project belongs to the authenticated user.
    // Admin override: admins may create projects on behalf of a client
    //   by passing { user_id: "<target-user-uuid>" }.
    let targetUserId = user.sub;

    if (body.user_id && typeof body.user_id === 'string') {
      if (!user.isAdmin) {
        return errorResponse(
          403,
          'FORBIDDEN',
          'Only admins can create projects for other users',
          requestId,
          origin
        );
      }

      // Validate UUID format to prevent injection
      const UUID_RE =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!UUID_RE.test(body.user_id)) {
        return errorResponse(400, 'INVALID_USER_ID', 'user_id must be a valid UUID', requestId, origin);
      }

      // Ensure the target user exists in the database
      const targetUsers = await sql`
        SELECT id FROM users WHERE id = ${body.user_id}
      `;
      if (targetUsers.length === 0) {
        return errorResponse(
          404,
          'USER_NOT_FOUND',
          'The specified user does not exist',
          requestId,
          origin
        );
      }

      targetUserId = body.user_id;
    }

    // ── 7. Validate deadline is not in the past ─────
    if (deadline) {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate < today) {
        return errorResponse(
          400,
          'INVALID_DEADLINE',
          'Deadline cannot be in the past',
          requestId,
          origin
        );
      }
    }

    // ── 8. Insert into database ─────────────────────
    const rows = await sql`
      INSERT INTO projects (
        user_id, project_name, industry, description,
        goals, target_audience, deadline, budget_range,
        additional_notes
      ) VALUES (
        ${targetUserId}, ${project_name}, ${industry},
        ${description}, ${goals}, ${target_audience},
        ${deadline}, ${budget_range}, ${additional_notes}
      )
      RETURNING *
    `;

    return jsonResponse(201, rows[0], requestId, origin);
  } catch (err) {
    return handleError(err, requestId, origin);
  }
}
