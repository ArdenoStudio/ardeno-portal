// ─── Auth Context ─────────────────────────────────────
// Manages Supabase auth state for the entire app.
//
// On mount: hydrates session from Supabase cache.
// On SIGNED_IN: calls GET /api/auth/me to get portal
//   user profile (local DB UUID + isAdmin).
// On SIGNED_OUT: clears user state.
//
// Exposes the same PortalUser shape consumed by Sidebar,
// DashboardPage, ProjectDetailPage, etc.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import type { JwtPayload } from '@/types';

interface AuthState {
  user: JwtPayload | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Sync session → portal user profile ─────────────
  const lastTokenRef = useCallback((token: string) => {
    return (window as any)._lastAuthToken === token;
  }, []);

  const syncUser = useCallback(async (sess: Session | null) => {
    if (!sess) {
      setUser(null);
      setSession(null);
      (window as any)._lastAuthToken = null;
      return;
    }

    setSession(sess);

    // Skip if we already synced this specific token successfully
    if (lastTokenRef(sess.access_token)) {
      return;
    }

    try {
      console.log('[AuthContext] Syncing user...');

      // Add a safety timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      console.log('[AuthContext] Synchronizing session...');
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sess.access_token}`,
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const portalUser: JwtPayload = json.data || json;
        (window as any)._lastAuthToken = sess.access_token;
        setUser(portalUser);
        console.log('[AuthContext] Sync success:', portalUser.email);
      } else {
        const errText = await res.text();
        console.error('[AuthContext] Sync failed (res not ok):', errText);
        setUser(null);
      }
    } catch (err: any) {
      console.error('[AuthContext] Sync error/timeout:', err.name === 'AbortError' ? 'Timeout' : err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [lastTokenRef]);

  // ── Hydrate on mount + subscribe to changes ────────
  useEffect(() => {
    let mounted = true;

    async function handleAuthState(sess: Session | null) {
      console.log('[AuthContext] Processing auth state change...', { sessionPresent: !!sess });
      if (mounted) setIsLoading(true); // Ensure loading is true while we sync

      try {
        await syncUser(sess);
      } catch (err: any) {
        console.error('[AuthContext] Critical auth handler error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
          console.log('[AuthContext] Auth processing complete, isLoading set to false');
        }
      }
    }

    // 1. Initial hydrate
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (mounted) handleAuthState(sess);
    });

    // 2. Subscribe to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      console.log('[AuthContext] onAuthStateChange:', event);
      if (mounted && (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED')) {
        handleAuthState(sess);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncUser]);

  // ── Sign out ───────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      console.log('[AuthContext] Initiating definitive logout...');

      // 1. Manually clear Supabase local storage to prevent session recovery
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          console.log('[AuthContext] Clearing storage key:', key);
          localStorage.removeItem(key);
        }
      });

      // 2. Call Supabase sign out
      await supabase.auth.signOut();

      // 3. Clear in-memory state
      (window as any)._lastAuthToken = null;
      setUser(null);
      setSession(null);

      console.log('[AuthContext] Logout phase complete. Redirecting to login.');

      // 4. Use window.location.href for a clean redirect
      // This ensures we land on the login page with a fresh app state.
      window.location.href = '/login';
    } catch (err) {
      console.error('[AuthContext] Error during logout:', err);
      // Fallback: Force redirect anyway
      window.location.href = '/login';
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin: user?.isAdmin ?? false,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
