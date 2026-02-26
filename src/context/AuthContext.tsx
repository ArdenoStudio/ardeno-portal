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
      setIsLoading(false);
      return;
    }

    try {
      console.log('[AuthContext] Syncing user...');

      // Add a safety timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
        console.error('[AuthContext] Sync failed:', errText);
        setUser(null);
      }
    } catch (err: any) {
      console.error('[AuthContext] Sync error:', err.name === 'AbortError' ? 'Timeout' : err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [lastTokenRef]);

  // ── Hydrate on mount + subscribe to changes ────────
  useEffect(() => {
    let mounted = true;

    async function handleAuthState(sess: Session | null) {
      console.log('[AuthContext] Auth state change...', { sessionPresent: !!sess });
      if (mounted) setIsLoading(true);

      try {
        await syncUser(sess);
      } catch (err: any) {
        console.error('[AuthContext] Handler error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    // 1. Initial hydrate
    const lock = localStorage.getItem('_portal_logged_out');
    if (lock === '1') {
      console.log('[AuthContext] Logout lock active. Skipping initial session check.');
      setIsLoading(false);
    } else {
      supabase.auth.getSession().then(({ data: { session: sess } }) => {
        if (mounted) handleAuthState(sess);
      });
    }

    // 2. Subscribe to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      console.log('[AuthContext] event:', event);

      // If locked, ignore inward session re-activations until flag is cleared by LoginPage
      if (localStorage.getItem('_portal_logged_out') === '1' && (event === 'SIGNED_IN' || !!sess)) {
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
    console.log('[AuthContext] Starting robust logout sequence...');

    // Set lock immediately
    localStorage.setItem('_portal_logged_out', '1');

    // Clear local state immediately to trigger UI transitions
    setUser(null);
    setSession(null);
    setIsLoading(true);

    try {
      // Sign out from Supabase (with a timeout to prevent hanging the redirect)
      await Promise.race([
        supabase.auth.signOut({ scope: 'global' }),
        new Promise(r => setTimeout(r, 1500))
      ]);
    } catch (err) {
      console.warn('[AuthContext] signOut call timed out or failed, proceeding with manual wipe.', err);
    }

    // Definitive storage wipe
    localStorage.clear();
    sessionStorage.clear();

    // Re-set lock because clear() removes it
    localStorage.setItem('_portal_logged_out', '1');

    // Clear cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
    }

    console.log('[AuthContext] Logout complete. Hard redirecting...');
    window.location.replace('/login?logout=1&t=' + Date.now());
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
