// ─── Input Sanitization ────────────────────────────────
// Strips HTML tags, script blocks, and event-handler
// attributes from user-supplied strings to prevent
// stored XSS. No external dependencies required.

const SCRIPT_BLOCK_RE =
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAG_RE = /<\/?[^>]+(>|$)/g;
const EVENT_HANDLER_RE = /\bon\w+\s*=/gi;
const JAVASCRIPT_URI_RE = /javascript\s*:/gi;

/**
 * Sanitize a single string value.
 * Removes script blocks, HTML tags, event handlers,
 * and javascript: URIs. Returns trimmed result.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(SCRIPT_BLOCK_RE, '')
    .replace(HTML_TAG_RE, '')
    .replace(EVENT_HANDLER_RE, '')
    .replace(JAVASCRIPT_URI_RE, '')
    .trim();
}

/**
 * Sanitize all string values in an object (shallow, one level deep).
 * Non-string values are left untouched.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T
): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeString(
        result[key] as string
      );
    }
  }
  return result;
}
