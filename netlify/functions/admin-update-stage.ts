// ─── PUT /api/admin/projects/:projectId ────────────────
// Admin-only endpoint to update a project's stage and/or status.
// Creates an audit record in project_updates.
//
// Accepted body fields:
//   new_stage                – required, one of the 4 pipeline stages
//   new_status               – optional, one of Active / On Hold / Completed
//   update_message           – required when stage changes, max 1000 chars
//   estimated_completion_date – optional, ISO date
//   next_update_date         – optional, ISO date (Phase 5C)
//
// Auto-complete logic: if new_status is NOT explicitly provided
// and the stage is set to "Development & Launch", the project's
// status is automatically marked "Completed" (only if currently Active).
//
// The projectId arrives via query parameter, mapped by
// the Netlify redirect rule:
//   /api/admin/projects/:projectId → /.netlify/functions/admin-update-stage?projectId=:projectId
//
// Security:
//   - JWT + admin guard via centralized guards
//   - Request ID for tracing, CORS enforcement
//   - update_message enforced on stage transitions (Phase 5E)

import type { Handler } from '@netlify/functions';
import { getDb } from './db/connection';
import { requireJwt, requireAdmin } from './middleware/guards';
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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_STAGES = [
  'Discovery & Strategy',
  'UX & Wireframing',
  'Visual Design',
  'Development & Launch',
];

const VALID_STATUSES = ['Active', 'On Hold', 'Completed'];

const UPDATE_SCHEMA: ValidationSchema = {
  new_stage: {
    required: true,
    type: 'string',
    oneOf: VALID_STAGES,
    label: 'New stage',
  },
  new_status: {
    type: 'string',
    oneOf: VALID_STATUSES,
    label: 'New status',
  },
  update_message: {
    type: 'string',
    maxLength: 1000,
    label: 'Update message',
  },
  estimated_completion_date: {
    type: 'string',
    isDate: true,
    label: 'Estimated completion date',
  },
  next_update_date: {
    type: 'string',
    isDate: true,
    label: 'Next update date',
  },
};

export const handler: Handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin;
  const requestId = createRequestId();

  if (event.httpMethod === 'OPTIONS') {
    return corsPreflightResponse(origin);
  }

  if (event.httpMethod !== 'PUT') {
    return methodNotAllowed(['PUT'], requestId, origin);
  }

  try {
    const user = await requireJwt(event);
    requireAdmin(user);

    const sql = getDb();

    // projectId from redirect query param
    const projectId = event.queryStringParameters?.projectId;

    // Parse body
    const parsed = parseJsonBody(event.body, requestId);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    // Allow projectId from body as fallback
    const resolvedProjectId = projectId || (body.projectId as string);

    if (!resolvedProjectId) {
      return errorResponse(400, 'MISSING_PARAM', 'projectId is required', requestId, origin);
    }

    if (!UUID_RE.test(resolvedProjectId)) {
      return errorResponse(
        400,
        'INVALID_ID',
        'projectId must be a valid UUID',
        requestId,
        origin
      );
    }

    // Validate body fields
    const { valid, errors } = validate(body, UPDATE_SCHEMA);
    if (!valid) {
      return errorResponse(400, 'VALIDATION_ERROR', errors.join('; '), requestId, origin);
    }

    const new_stage = body.new_stage as string;
    const new_status = body.new_status as string | undefined;
    const raw_message = body.update_message
      ? sanitizeString(body.update_message as string)
      : '';
    const estimated_completion_date = body.estimated_completion_date
      ? (body.estimated_completion_date as string)
      : null;
    const next_update_date = body.next_update_date
      ? (body.next_update_date as string)
      : null;

    // ── Fetch current project to determine status logic ────
    const current = await sql`
      SELECT current_stage, current_status FROM projects WHERE id = ${resolvedProjectId}
    `;

    if (current.length === 0) {
      return errorResponse(404, 'NOT_FOUND', 'Project not found', requestId, origin);
    }

    // Phase 5E: Enforce update_message when stage changes
    const stageChanged = current[0].current_stage !== new_stage;
    if (stageChanged && !raw_message.trim()) {
      return errorResponse(
        400,
        'MESSAGE_REQUIRED',
        'An update message is required when changing the project stage.',
        requestId,
        origin
      );
    }

    const update_message = raw_message.trim() || `Stage updated to ${new_stage}`;

    // Determine final status
    let finalStatus = current[0].current_status as string;
    if (new_status) {
      // Explicit status from admin takes precedence
      finalStatus = new_status;
    } else if (
      new_stage === 'Development & Launch' &&
      finalStatus === 'Active'
    ) {
      // Auto-complete when reaching final stage (only if currently Active)
      finalStatus = 'Completed';
    }

    // ── Update project ─────────────────────────────────────
    const rows = await sql`
      UPDATE projects SET
        current_stage = ${new_stage},
        current_status = ${finalStatus},
        estimated_completion_date = COALESCE(${estimated_completion_date}::date, estimated_completion_date),
        next_update_date = ${next_update_date}::date,
        last_updated_by = ${user.name},
        updated_at = NOW()
      WHERE id = ${resolvedProjectId}
      RETURNING *
    `;

    // ── Insert audit record ────────────────────────────────
    await sql`
      INSERT INTO project_updates (
        project_id, updated_stage, update_message, updated_by
      ) VALUES (
        ${resolvedProjectId}, ${new_stage},
        ${update_message}, ${user.name}
      )
    `;

    // ── Re-fetch with joined client data ───────────────────
    const updated = await sql`
      SELECT p.*, u.name AS client_name, u.email AS client_email,
             u.profile_picture_url AS client_avatar
      FROM projects p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ${resolvedProjectId}
    `;

    const project = updated[0] || rows[0];

    // ── Send client notification email ─────────────────────
    // Only fire when there's an actual update message to share.
    if (project.client_email && raw_message.trim()) {
      try {
        await sendClientNotification({
          to: project.client_email,
          clientName: project.client_name || 'there',
          projectName: project.project_name,
          stage: new_stage,
          updateMessage: update_message,
          nextUpdateDate: next_update_date,
          requestId,
        });
      } catch (emailErr) {
        // Never fail the request because of email — log and continue
        console.error(`[${requestId}] Email notification failed:`, emailErr);
      }
    }

    return jsonResponse(200, project, requestId, origin);
  } catch (err) {
    return handleError(err, requestId, origin);
  }
};

// ─── Email Notification Helper ──────────────────────────

async function sendClientNotification(opts: {
  to: string;
  clientName: string;
  projectName: string;
  stage: string;
  updateMessage: string;
  nextUpdateDate: string | null;
  requestId: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const portalUrl = process.env.URL || 'https://ardenostudio.netlify.app';

  const nextUpdateHtml = opts.nextUpdateDate
    ? `<p style="color: #a1a1aa; margin: 24px 0 0 0; font-size: 14px;">
        📅 <strong style="color: #fff;">Next update scheduled:</strong>
        ${new Date(opts.nextUpdateDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>`
    : '';

  const html = `
    <div style="font-family: 'Helvetica Neue', -apple-system, sans-serif; background: #0a0a0c; color: #ffffff; padding: 40px; max-width: 600px; margin: 0 auto;">
      <!-- Header -->
      <div style="border-bottom: 1px solid rgba(229,9,20,0.3); padding-bottom: 20px; margin-bottom: 28px;">
        <h1 style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 0.25em; color: #fff;">ARDENO</h1>
        <p style="margin: 4px 0 0; font-size: 10px; letter-spacing: 0.35em; color: #52525b; text-transform: uppercase;">Client Portal</p>
      </div>

      <!-- Greeting -->
      <p style="color: #d4d4d8; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Hi ${opts.clientName.split(' ')[0]},
      </p>

      <p style="color: #a1a1aa; margin: 0 0 20px; font-size: 14px; line-height: 1.6;">
        Your project <strong style="color: #fff;">${opts.projectName}</strong> has been updated.
      </p>

      <!-- Update card -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="color: #E50914; margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600;">
          ${opts.stage}
        </p>
        <p style="color: #e4e4e7; margin: 12px 0 0; font-size: 14px; line-height: 1.7;">
          ${opts.updateMessage}
        </p>
      </div>

      ${nextUpdateHtml}

      <!-- CTA -->
      <div style="margin-top: 32px;">
        <a href="${portalUrl}/dashboard" style="display: inline-block; background: #E50914; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-size: 13px; font-weight: 600;">
          View in Portal
        </a>
      </div>

      <!-- Footer -->
      <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06);">
        <p style="color: #3f3f46; margin: 0; font-size: 11px; letter-spacing: 0.05em;">
          Ardeno Client · Secure · Encrypted · Private
        </p>
      </div>
    </div>
  `;

  if (resendKey) {
    const { Resend } = await import('resend');
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: fromEmail,
      to: opts.to,
      subject: `Project Update: ${opts.projectName}`,
      html,
    });
    console.log(`[${opts.requestId}] Notification email sent to ${opts.to}`);
  } else {
    console.log(`[${opts.requestId}] RESEND_API_KEY not set. Would have emailed ${opts.to}:`, {
      project: opts.projectName,
      stage: opts.stage,
      message: opts.updateMessage,
    });
  }
}
