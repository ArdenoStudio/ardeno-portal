// ─── OAuth Callback Page ──────────────────────────────
// Supabase redirects here after Google OAuth.
// Finalizes the session and navigates to the requested
// destination (or /dashboard by default).

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { EASING } from '@/lib/constants';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      // Check for OAuth error in URL params
      const errorDesc =
        params.get('error_description') ||
        new URLSearchParams(window.location.hash.slice(1)).get(
          'error_description'
        );

      if (errorDesc) {
        setError(errorDesc);
        return;
      }

      // Try to get session — Supabase auto-handles code exchange on init
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (session) {
        const next = params.get('next') || '/dashboard';
        navigate(next, { replace: true });
        return;
      }

      // Fallback: explicit PKCE code exchange
      const code = params.get('code');
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }

        const next = params.get('next') || '/dashboard';
        navigate(next, { replace: true });
        return;
      }

      // No session and no code — redirect to login
      navigate('/login', { replace: true });
    }

    handleCallback();
  }, [navigate, params]);

  // ── Error state ───────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASING }}
          className="text-center max-w-sm px-6"
        >
          <p className="text-sm text-red-400 mb-4">{error}</p>
          <a
            href="/login"
            className="text-sm text-accent hover:text-white transition-colors"
          >
            Back to sign in
          </a>
        </motion.div>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto mb-4 h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-accent" />
        <p className="text-sm text-zinc-400">Finishing sign-in&hellip;</p>
      </motion.div>
    </div>
  );
}
