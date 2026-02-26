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

    // 1. Initial hydrate - Skip if we just logged out definitively
    if (localStorage.getItem('_portal_logged_out') === '1') {
      console.log('[AuthContext] Logout lock detected. Skipping initialization.');
      setIsLoading(false);
    } else {
      supabase.auth.getSession().then(({ data: { session: sess } }) => {
        if (mounted) handleAuthState(sess);
      });
    }

    // 2. Subscribe to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      console.log('[AuthContext] onAuthStateChange:', event);

      // If we are in a locked state, ignore SIGNED_IN events
      if (localStorage.getItem('_portal_logged_out') === '1' && event === 'SIGNED_IN') {
        console.log('[AuthContext] Ignoring SIGNED_IN due to logout lock.');
        return;
      }

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
      console.log('[AuthContext] Initiating ULTIMATE logout...');

      // 1. Set a persistent lock flag
      localStorage.setItem('_portal_logged_out', '1');

      // 2. Global sign out to revoke tokens on server
      await supabase.auth.signOut({ scope: 'global' });

      // 3. Clear all storage to wipe local traces
      localStorage.clear();
      sessionStorage.clear();

      // Explicitly re-set the lock since clear() wiped it
      localStorage.setItem('_portal_logged_out', '1');

      // 4. Clear cookies
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }

      // 5. Update local state
      (window as any)._lastAuthToken = null;
      setUser(null);
      setSession(null);

      console.log('[AuthContext] Ultimate logout complete. Redirecting.');

      // 6. Hard redirect with cache-buster
      window.location.href = '/login?logout=1&t=' + Date.now();
    } catch (err) {
      console.error('[AuthContext] Ultimate logout failed:', err);
      localStorage.setItem('_portal_logged_out', '1');
      window.location.href = '/login?logout=error';
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
