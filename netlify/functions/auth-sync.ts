
// ─── POST /api/auth/sync ─────────────────────────────────
// Performs a safe UPSERT of the user profile from Supabase
// into the local database. Returns the DB user + is_admin flag.
//
// This is called once per dashboard session to ensure the 
// local DB is in sync without overhead on every API call.
//
// Security:
//   - Supabase JWT verification
//   - Request ID for tracing

import type { Handler } from '@netlify/functions';
import { getDb } from './db/connection';
import { isAdminEmail } from './middleware/admin';
import { getSupabase } from './middleware/supabase-client';
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

    if (event.httpMethod !== 'POST') {
        return methodNotAllowed(['POST'], requestId, origin);
    }

    try {
        const authHeader = event.headers.authorization || event.headers.Authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return errorResponse(401, 'MISSING_TOKEN', 'Missing token', requestId, origin);
        }

        const token = authHeader.slice(7);
        const supabase = getSupabase();
        const { data: { user: sbUser }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !sbUser) {
            return errorResponse(401, 'INVALID_TOKEN', 'Invalid session', requestId, origin);
        }

        const email = sbUser.email;
        const meta = (sbUser.user_metadata || {}) as Record<string, string>;
        const name = meta.full_name || meta.name || email || 'Unknown';
        const avatar = meta.avatar_url || null;
        const supabaseId = sbUser.id;

        if (!email) {
            return errorResponse(401, 'INVALID_TOKEN', 'Email missing', requestId, origin);
        }

        const sql = getDb();
        const adminByEmail = isAdminEmail(email);

        // Atomic UPSERT
        const rows = await sql`
      INSERT INTO users (google_id, email, name, profile_picture_url, is_admin)
      VALUES (${supabaseId}, ${email}, ${name}, ${avatar}, ${adminByEmail})
      ON CONFLICT (email) DO UPDATE SET
        google_id = EXCLUDED.google_id,
        name = EXCLUDED.name,
        profile_picture_url = EXCLUDED.profile_picture_url,
        -- We only update is_admin if they are in the ENV list
        -- This allows "promoting" to admin via ENV, then persistence in DB
        is_admin = CASE 
          WHEN EXCLUDED.is_admin = TRUE THEN TRUE 
          ELSE users.is_admin 
        END,
        updated_at = NOW()
      RETURNING *
    `;

        const user = rows[0];

        return jsonResponse(200, {
            sub: user.id,
            email: user.email,
            name: user.name,
            avatar: user.profile_picture_url,
            isAdmin: user.is_admin,
        }, requestId, origin);

    } catch (err) {
        return handleError(err, requestId, origin);
    }
};

function errorResponse(status: number, code: string, message: string, requestId: string, origin?: string) {
    return {
        statusCode: status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin || '*',
        },
        body: JSON.stringify({ success: false, error: { code, message }, requestId }),
    };
}
