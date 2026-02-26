# Lessons: Authentication & Serverless Patterns

## Pattern: Named Exports for Netlify Functions
**Issue:** `TypeError: lambdaFunc[lambdaHandler] is not a function`
**Root Cause:** In certain local development environments (Netlify Dev with Vite/ESM), anonymous arrow functions assigned to `export const handler` can occasionally fail to be recognized as the primary export by the lambda runner, especially when mixed with ESM imports.
**Solution:** Always use a named declaration: `export async function handler(event, context) { ... }`. This ensures clearer export discovery by the function runner.

## Pattern: Auth State Synchronization
**Issue:** Premature redirect to login after successful Google OAuth.
**Root Cause:** `AuthContext` would trigger a state change before the `/api/auth/sync` call completed. `isLoading` would default to `false` (or flip to `false` too early), causing `ProtectedRoute` to see `user: null` and redirect to `/login`.
**Solution:** Force `setIsLoading(true)` at the very beginning of the auth state change handler, regardless of whether a session exists, and only release it once the local database synchronization is confirmed (success or failure).

## Pattern: Port Collision Recovery
**Issue:** `Could not acquire required 'port': '8888'`
**Root Cause:** Previous instances of `netlify dev` or its child processes (Vite, Lambda runner) did not exit cleanly.
**Solution:**
1.  Identify ALL PIDs: `netstat -ano | findstr :8888`
2.  Kill all identified PIDs: `taskkill /F /PID <PID1> /PID <PID2>`
3.  Verification: `netstat -ano | findstr :8888` (ensure no output)
4.  Restart the dev server.
