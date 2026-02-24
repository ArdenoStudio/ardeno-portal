// ─── Shared API Response Helpers ───────────────────────
// Ensures consistent JSON format, request tracing,
// CORS, and security headers across all Netlify Functions.

import { randomUUID } from 'node:crypto';

// ─── Request ID ───────────────────────────────────────
export function createRequestId(): string {
  return randomUUID();
}

// ─── CORS / Security ─────────────────────────────────

function getAllowedOrigins(): string[] {
  const origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8888',
  ];
  // Netlify sets URL automatically in production
  const siteUrl = process.env.URL || process.env.SITE_URL;
  if (siteUrl) origins.push(siteUrl);
  return origins;
}

function getHeaders(origin?: string): Record<string, string> {
  const origins = getAllowedOrigins();
  const allowed = origin && origins.includes(origin) ? origin : origins[0];

  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/** Respond to CORS preflight (OPTIONS) requests. */
export function corsPreflightResponse(origin?: string) {
  return {
    statusCode: 204,
    headers: { ...getHeaders(origin), 'Access-Control-Max-Age': '86400' },
    body: '',
  };
}

// ─── Success Response ─────────────────────────────────

/**
 * Standardized success response.
 *
 * Shape: `{ success: true, data: <T>, requestId }`
 */
export function jsonResponse(
  statusCode: number,
  data: unknown,
  requestId: string,
  origin?: string
) {
  return {
    statusCode,
    headers: { ...getHeaders(origin), 'X-Request-Id': requestId },
    body: JSON.stringify({ success: true, data, requestId }),
  };
}

// ─── Error Response ───────────────────────────────────

/**
 * Standardized error response.
 *
 * Shape: `{ success: false, error: { code, message }, requestId }`
 */
export function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  requestId: string,
  origin?: string
) {
  return {
    statusCode,
    headers: { ...getHeaders(origin), 'X-Request-Id': requestId },
    body: JSON.stringify({ success: false, error: { code, message }, requestId }),
  };
}

/**
 * Return a 405 Method Not Allowed with an Allow header.
 */
export function methodNotAllowed(
  allowed: string[],
  requestId: string,
  origin?: string
) {
  return {
    statusCode: 405,
    headers: {
      ...getHeaders(origin),
      'X-Request-Id': requestId,
      Allow: allowed.join(', '),
    },
    body: JSON.stringify({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Allowed methods: ${allowed.join(', ')}`,
      },
      requestId,
    }),
  };
}

// ─── Body Parsing ─────────────────────────────────────

/**
 * Safely parse a JSON request body with size and type guards.
 * Returns the parsed object or an error response.
 */
export function parseJsonBody(
  rawBody: string | null,
  requestId: string,
  maxBytes: number = 64 * 1024
):
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; response: ReturnType<typeof errorResponse> } {
  if (!rawBody) {
    return {
      ok: false,
      response: errorResponse(400, 'EMPTY_BODY', 'Request body is required', requestId),
    };
  }

  if (rawBody.length > maxBytes) {
    return {
      ok: false,
      response: errorResponse(
        413,
        'BODY_TOO_LARGE',
        'Request body exceeds maximum allowed size',
        requestId
      ),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_JSON', 'Request body must be valid JSON', requestId),
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      response: errorResponse(400, 'INVALID_BODY', 'Request body must be a JSON object', requestId),
    };
  }

  return { ok: true, data: parsed as Record<string, unknown> };
}

// ─── Error Handler ────────────────────────────────────

/**
 * Build an error response from a caught exception.
 * Logs structured context for traceability. Prevents leaking
 * internal details to the client.
 */
export function handleError(
  err: unknown,
  requestId: string,
  origin?: string,
  context?: { route?: string; userEmail?: string; projectId?: string }
) {
  const e = err as { statusCode?: number; code?: string; message?: string };
  const ctx = { requestId, ...context };

  // Known application errors (auth, admin, rate-limit) include statusCode
  if (e.statusCode && e.statusCode < 500) {
    console.warn(`[${requestId}] ${e.code || 'REQUEST_ERROR'}: ${e.message}`, ctx);
    return errorResponse(
      e.statusCode,
      e.code || 'REQUEST_ERROR',
      e.message || 'Request failed',
      requestId,
      origin
    );
  }

  // Unknown / internal errors — log with full context
  console.error(`[${requestId}] Unhandled error:`, err, ctx);
  return errorResponse(
    500,
    'INTERNAL_ERROR',
    'An unexpected error occurred',
    requestId,
    origin
  );
}
