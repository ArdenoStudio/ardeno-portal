import { API_BASE } from './constants';
import { supabase } from './supabase';

export class ApiError extends Error {
  status: number;
  code: string;
  requestId: string | null;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId || null;
  }
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  // Get token from Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  // Auto-logout on 401
  if (res.status === 401) {
    await supabase.auth.signOut();
    window.location.href = '/login';
    throw new ApiError(401, 'UNAUTHORIZED', 'Unauthorized');
  }

  const text = await res.text();
  let json: any;

  try {
    json = JSON.parse(text);
  } catch {
    if (!res.ok) {
      throw new ApiError(res.status, 'UNKNOWN', text);
    }
    return text as unknown as T;
  }

  // Handle error responses: { success: false, error: { code, message }, requestId }
  if (!res.ok) {
    const code = json.error?.code || 'UNKNOWN';
    const message = json.error?.message || text;
    const requestId = json.requestId;
    throw new ApiError(res.status, code, message, requestId);
  }

  // Unwrap standardized response: { success: true, data: T, requestId }
  if (json.success === true && 'data' in json) {
    return json.data as T;
  }

  // Fallback for non-standardized responses
  return json as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),

  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
};
