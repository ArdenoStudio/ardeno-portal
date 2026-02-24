import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Lightweight data-fetching hook.
 * Pass `null` as the path to skip the request (useful for conditional fetching).
 *
 * Important: supports APIs that return:
 * - an array/object directly
 * - { data: ... }
 * - { projects: ... } (or any single-key wrapper)
 */
export function useApi<T>(path: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!path);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const unwrap = (result: any): T => {
    // Common wrappers
    if (result && typeof result === "object") {
      if ("data" in result) return result.data as T;
      if ("projects" in result) return result.projects as T;

      // If it’s a single-key wrapper, unwrap it (e.g. { items: [...] })
      // CRITICAL: Ensure we don't accidentally unwrap an Array here!
      if (!Array.isArray(result)) {
        const keys = Object.keys(result);
        if (keys.length === 1) return (result as any)[keys[0]] as T;
      }
    }
    // Raw payload
    return result as T;
  };

  const fetchData = useCallback(async () => {
    if (!path) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const result = await api.get<any>(path);
      const payload = unwrap(result);

      if (mountedRef.current) {
        setData(payload);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message || "Failed to load data");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [path]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}