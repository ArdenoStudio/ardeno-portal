import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { EASING } from "@/lib/constants";

// Supabase envs (ONLY these are needed on the frontend)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth(); // assume your context maps supabase user + role
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = params.get("next") || ""; // optional return path

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(user.isAdmin ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Supabase redirect URL (must be in Supabase Redirect URLs allowlist)
  const redirectTo = useMemo(() => {
    const base = window.location.origin;
    const nextParam = next ? `?next=${encodeURIComponent(next)}` : "";
    return `${base}/auth/callback${nextParam}`;
  }, [next]);

  async function handleGoogleOAuth() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // If success: browser redirects out → back to /auth/callback
  }

  // Dev mock login (only if Supabase env missing)
  async function handleMockLogin(isAdmin: boolean) {
    setLoading(true);
    setError(null);

    const { MOCK_CLIENT, MOCK_ADMIN, createMockToken } = await import("@/lib/mock-data");
    const mockUser = isAdmin ? MOCK_ADMIN : MOCK_CLIENT;
    const token = createMockToken(mockUser);
    localStorage.setItem("auth_token", token);

    setTimeout(() => {
      window.location.href = isAdmin ? "/admin" : "/dashboard";
    }, 600);
  }

  const hasSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-[40%] -left-[20%] h-[80vh] w-[80vh] rounded-full bg-[#ff3301]/[0.04] blur-[120px]" />
        <div className="absolute -top-[30%] -right-[15%] h-[60vh] w-[60vh] rounded-full bg-[#ff3301]/[0.02] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[50vh] w-[50vh] rounded-full bg-white/[0.01] blur-[80px]" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASING }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASING }}
          className="mb-8"
        >
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute h-20 w-20 rounded-full bg-accent/10 blur-xl" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
              <span className="text-2xl font-display font-bold text-accent">A</span>
            </div>
          </div>
        </motion.div>

        {/* Brand */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl font-display font-bold tracking-[0.35em] text-white sm:text-4xl"
        >
          ARDENO
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-2 text-[11px] font-medium uppercase tracking-[0.4em] text-zinc-600"
        >
          Client Portal
        </motion.p>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="my-10 h-px w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}

        {/* Sign-in area */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASING }}
          className="flex w-full max-w-[280px] flex-col items-center gap-3"
        >
          {/* Loading overlay */}
          {loading && (
            <div className="flex items-center gap-3 py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
              <span className="text-sm text-zinc-400">Redirecting to Google...</span>
            </div>
          )}

          {/* Real Google OAuth via Supabase */}
          {hasSupabaseEnv && !loading && (
            <button
              onClick={handleGoogleOAuth}
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)] disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          )}

          {/* Dev mock login */}
          {!hasSupabaseEnv && !loading && (
            <>
              <button
                onClick={() => handleMockLogin(false)}
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)] disabled:opacity-50"
              >
                Sign in (Mock Client)
              </button>

              <button
                onClick={() => handleMockLogin(true)}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-6 py-3 text-sm font-medium text-zinc-400 transition-all duration-300 hover:border-accent/30 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                Sign in (Mock Admin)
              </button>

              <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-zinc-700">
                Dev Mode · Missing Supabase env
              </p>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-12 text-[10px] uppercase tracking-[0.25em] text-zinc-700"
        >
          Secure · Encrypted · Private
        </motion.p>
      </motion.div>
    </div>
  );
}