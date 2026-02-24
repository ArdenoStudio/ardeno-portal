import { getDb } from '../db/connection';

export async function checkRateLimit(
  key: string,
  maxRequests: number = 1,
  windowMinutes: number = 60
): Promise<void> {
  const sql = getDb();

  const rows = await sql`
    SELECT count, window_start FROM rate_limits WHERE key = ${key}
  `;

  const now = new Date();

  if (rows.length === 0) {
    await sql`
      INSERT INTO rate_limits (key, count, window_start)
      VALUES (${key}, 1, ${now.toISOString()})
    `;
    return;
  }

  const row = rows[0];
  const windowStart = new Date(row.window_start);
  const elapsedMinutes =
    (now.getTime() - windowStart.getTime()) / (1000 * 60);

  if (elapsedMinutes > windowMinutes) {
    await sql`
      UPDATE rate_limits
      SET count = 1, window_start = ${now.toISOString()}
      WHERE key = ${key}
    `;
    return;
  }

  if (row.count >= maxRequests) {
    throw Object.assign(
      new Error('Rate limit exceeded. Please try again later.'),
      { statusCode: 429, code: 'RATE_LIMITED' }
    );
  }

  await sql`
    UPDATE rate_limits SET count = count + 1 WHERE key = ${key}
  `;
}
