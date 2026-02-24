// ─── Schema-based Input Validation ─────────────────────
// Lightweight validation without external dependencies.
// Used to enforce field types, lengths, patterns, and
// allowed values before data hits the database.

export interface ValidationRule {
  /** Field is required (must be present and non-empty) */
  required?: boolean;
  /** Expected JavaScript type */
  type?: 'string' | 'number' | 'boolean';
  /** Maximum string length */
  maxLength?: number;
  /** Minimum string length */
  minLength?: number;
  /** Regex pattern the string must match */
  pattern?: RegExp;
  /** Restrict to a set of allowed values */
  oneOf?: string[];
  /** Validate as an ISO date string */
  isDate?: boolean;
  /** Custom human-readable label for error messages */
  label?: string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a data object against a schema.
 * Returns { valid: true } or { valid: false, errors: [...] }.
 */
export function validate(
  data: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult {
  const errors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const label = rules.label || field;
    const value = data[field];

    // ── Required check ──────────────────────────────
    if (rules.required) {
      if (value === undefined || value === null || value === '') {
        errors.push(`${label} is required`);
        continue;
      }
    }

    // Skip optional fields that aren't provided
    if (value === undefined || value === null || value === '') {
      continue;
    }

    // ── Type check ──────────────────────────────────
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${label} must be a ${rules.type}`);
      continue;
    }

    // ── String-specific rules ───────────────────────
    if (typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push(
          `${label} must be at least ${rules.minLength} characters`
        );
      }

      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push(
          `${label} must be at most ${rules.maxLength} characters`
        );
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${label} has an invalid format`);
      }

      if (rules.oneOf && !rules.oneOf.includes(value)) {
        errors.push(`${label} must be one of: ${rules.oneOf.join(', ')}`);
      }

      if (rules.isDate) {
        const d = new Date(value);
        if (isNaN(d.getTime())) {
          errors.push(`${label} must be a valid date`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
