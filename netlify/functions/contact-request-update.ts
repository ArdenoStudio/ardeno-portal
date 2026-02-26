// ─── POST /api/contact/request-update ──────────────────
// Allows authenticated clients to request a project update.
// Sends a notification email via Resend. Rate limited to
// 1 request per hour per project to prevent abuse.
//
// Security:
//   - JWT authentication required via centralized guards
//   - User must own the project (ownership check)
//   - Rate limited per project
//   - Input sanitized before inclusion in email HTML
//   - Request ID for tracing, CORS enforcement

import type { Handler } from '@netlify/functions';
import { getDb } from './db/connection';
import { requireJwt, requireProjectOwner } from './middleware/guards';
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
import { Resend } from 'resend';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const REQUEST_UPDATE_SCHEMA: ValidationSchema = {
  projectId: {
    required: true,
    type: 'string',
    label: 'Project ID',
  },
  message: {
    required: true,
    type: 'string',
    minLength: 10,
    maxLength: 1000,
    label: 'Message',
  },
};

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
    const user = await requireJwt(event);
    const sql = getDb();

    // Parse and validate
    const parsed = parseJsonBody(event.body, requestId);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const { valid, errors } = validate(body, REQUEST_UPDATE_SCHEMA);
    if (!valid) {
      return errorResponse(400, 'VALIDATION_ERROR', errors.join('; '), requestId, origin);
    }

    const projectId = body.projectId as string;
    const message = sanitizeString(body.message as string);

    if (!UUID_RE.test(projectId)) {
      return errorResponse(400, 'INVALID_ID', 'projectId must be a valid UUID', requestId, origin);
    }

    // Verify ownership — use centralized guard
    await requireProjectOwner(user, projectId);

    // Fetch project details for the email
    const projects = await sql`
      SELECT * FROM projects WHERE id = ${projectId}
    `;
    const project = projects[0];

    // Rate limit: 1 request per hour per project
    await checkRateLimit(`update-request:${projectId}`, 1, 60);

    // Send email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const adminEmails = (process.env.ADMIN_EMAILS || 'support@ardeno.studio')
      .split(',')
      .map((e) => e.trim());
    const portalUrl = process.env.URL || 'https://ardenostudio.netlify.app';

    if (resendKey) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: fromEmail,
        to: adminEmails,
        subject: `Update Request: ${project.project_name}`,
        html: `
          <div style="font-family: 'Helvetica Neue', -apple-system, sans-serif; background: #0a0a0c; color: #ffffff; padding: 40px; max-width: 600px; margin: 0 auto;">
            <!-- Header -->
            <div style="border-bottom: 1px solid rgba(255,51,1,0.3); padding-bottom: 20px; margin-bottom: 28px;">
              <h1 style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 0.25em; color: #fff;">ARDENO</h1>
              <p style="margin: 4px 0 0; font-size: 10px; letter-spacing: 0.35em; color: #52525b; text-transform: uppercase;">Admin Notification</p>
            </div>

            <p style="color: #d4d4d8; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
              A client has requested a project update.
            </p>

            <!-- Details Table -->
            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px; font-size: 13px; color: #a1a1aa;">
                <strong style="color: #fff;">Client:</strong> ${sanitizeString(user.name)} (${user.email})
              </p>
              <p style="margin: 0 0 12px; font-size: 13px; color: #a1a1aa;">
                <strong style="color: #fff;">Project:</strong> ${sanitizeString(project.project_name)}
              </p>
              <p style="margin: 0 0 12px; font-size: 13px; color: #a1a1aa;">
                <strong style="color: #fff;">Stage:</strong> ${project.current_stage}
              </p>
            </div>

            <!-- Message Card -->
            <div style="background: rgba(255,51,1,0.05); border: 1px solid rgba(255,51,1,0.2); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
              <p style="color: #ff3301; margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600;">Client Message</p>
              <p style="color: #e4e4e7; margin: 0; font-size: 14px; line-height: 1.7;">
                ${message}
              </p>
            </div>

            <!-- CTA -->
            <div>
              <a href="${portalUrl}/projects/${projectId}" style="display: inline-block; background: #ff3301; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-size: 13px; font-weight: 600;">
                Respond in Portal
              </a>
            </div>

            <!-- Footer -->
            <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06);">
              <p style="color: #3f3f46; margin: 0; font-size: 11px; letter-spacing: 0.05em;">
                Request ID: ${requestId}
              </p>
            </div>
          </div>
        `,
      });
    } else {
      console.log(`[${requestId}] RESEND_API_KEY not set. Email would have been sent to ${adminEmails.join(', ')}:`, {
        client: user.name,
        project: project.project_name,
        message,
      });
    }

    return jsonResponse(200, { sent: true }, requestId, origin);
  } catch (err) {
    return handleError(err, requestId, origin);
  }
};
