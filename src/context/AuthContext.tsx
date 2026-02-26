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
    // Check for hard logout lock first
    if (localStorage.getItem('_portal_logged_out') === '1') {
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
    console.log('[AuthContext] Starting INSTANT logout sequence...');

    // 1. Set lock immediately so ANY re-renders or hydration calls are blocked
    localStorage.setItem('_portal_logged_out', '1');

    // 2. Wipe state
    setUser(null);
    setSession(null);
    setIsLoading(true);

    // 3. Clear storage (this is synchronous and definitive for this tab)
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('_portal_logged_out', '1'); // Re-set the lock since clear() wiped it

    // 4. Clear cookies manually
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
    }

    // 5. Try server-side logout in the background (we don't wait for it)
    supabase.auth.signOut({ scope: 'global' }).catch(() => { });

    // 6. Hard redirect with cache-buster. window.location.replace stops the React app.
    console.log('[AuthContext] Redirecting to login.');
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
