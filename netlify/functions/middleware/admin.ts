import type { AuthUser } from './auth';

export function verifyAdmin(user: AuthUser): void {
  if (!user.isAdmin) {
    throw Object.assign(new Error('Admin access required'), {
      statusCode: 403,
      code: 'ADMIN_REQUIRED',
    });
  }
}

export function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}
