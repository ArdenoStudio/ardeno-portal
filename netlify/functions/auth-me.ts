// ─── GET /api/auth/me ─────────────────────────────────
// Returns the authenticated user's portal profile.
// Used by the frontend AuthContext after Supabase login
// to get the local DB user info + isAdmin flag.
//
// Security:
//   - Supabase JWT verification via centralized guard
//   - Request ID for tracing, CORS enforcement

import type { Handler } from '@netlify/functions';
import { requireJwt } from './middleware/guards';
import {
  createRequestId,
  corsPreflightResponse,
  jsonResponse,
  methodNotAllowed,
  handleError,
} from './middleware/response';

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
    return jsonResponse(200, user, requestId, origin);
  } catch (err) {
    return handleError(err, requestId, origin);
  }
};
