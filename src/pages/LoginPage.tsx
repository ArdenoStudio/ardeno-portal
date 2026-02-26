import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function ArdenoLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const janitorFired = useRef(false);

  const next = params.get("next") || "";
  const isLoggingOut = params.get("logout") === "1";

  // Perform Janitor logout on mount if requested - Guarded against loops
  useEffect(() => {
    if (isLoggingOut && !janitorFired.current) {
      janitorFired.current = true;
      console.log("[LoginPage] Janitor logout sequence started...");

      const performWipe = async () => {
        try {
          // 1. Wipe storage
          localStorage.clear();
          sessionStorage.clear();
          localStorage.setItem('_portal_logged_out', '1');

          // 2. Wipe cookies
          const cookies = document.cookie.split(";");
          for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
          }

          // 3. Inform Supabase in the background
          await supabase.auth.signOut({ scope: 'global' }).catch(() => { });
          console.log("[LoginPage] Janitor wipe complete.");
        } catch (err) {
          console.error("[LoginPage] Janitor error:", err);
        }
      };

      performWipe();
    }
  }, [isLoggingOut]);

  // If already logged in, redirect (unless we just logged out)
  useEffect(() => {
    if (isLoggingOut) return;
    if (user) {
      navigate(user.isAdmin ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, navigate, isLoggingOut]);

  // Supabase redirect URL
  const redirectTo = useMemo(() => {
    const base = window.location.origin;
    const nextParam = next ? `?next=${encodeURIComponent(next)}` : "";
    return `${base}/auth/callback${nextParam}`;
  }, [next]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    localStorage.removeItem("_portal_logged_out");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="ardeno-root">
      <style>{`
        .ardeno-root {
          height: 100vh;
          width: 100%;
          background: #080605;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          font-family: 'JetBrains Mono', monospace;
        }

        /* Simplified noise pattern for better performance */
        .ardeno-root::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.025;
          pointer-events: none;
          z-index: 100;
        }

        .ardeno-glow {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -68%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(229,9,20,0.07) 0%, transparent 70%);
          pointer-events: none;
          animation: ardenoBreath 8s ease-in-out infinite;
        }

        @keyframes ardenoBreath {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -68%) scale(1); }
          50%       { opacity: 1;   transform: translate(-50%, -68%) scale(1.08); }
        }

        .ardeno-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 64px;
          position: relative;
          z-index: 1;
        }

        .ardeno-logo-wrap {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ardeno-logo {
          width: 80px;
          height: 80px;
          display: block;
        }

        .ardeno-btn {
          display: flex;
          align-items: center;
          width: 280px;
          height: 52px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-top-color: rgba(255,255,255,0.14);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0;
          animation: ardenoUp 1s cubic-bezier(.16,1,.3,1) 0.3s forwards;
          position: relative;
          overflow: hidden;
        }

        .ardeno-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .ardeno-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 60%);
          pointer-events: none;
        }

        .ardeno-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.16);
          transform: translateY(-1px);
        }

        .ardeno-btn-icon {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }

        .ardeno-btn-label {
          flex: 1;
          text-align: center;
          font-family: inherit;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          font-weight: 500;
        }

        .ardeno-status {
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0;
          animation: ardenoUp 1s cubic-bezier(.16,1,.3,1) 0.5s forwards;
        }

        .ardeno-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 10px rgba(74, 222, 128, 0.4);
        }

        .ardeno-error {
          margin-top: 16px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #E50914;
          opacity: 0.9;
        }

        .ardeno-dot-label {
          font-size: 9px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.15);
          font-weight: 400;
        }

        @keyframes ardenoUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="ardeno-glow" />

      <div className="ardeno-wrap">
        <div className="ardeno-logo-wrap" style={{ opacity: 0, animation: 'ardenoUp 1s cubic-bezier(.16,1,.3,1) 0.1s forwards' }}>
          <svg className="ardeno-logo" viewBox="0 0 1500 1500" xmlns="http://www.w3.org/2000/svg">
            <path fill="#E50914" d="M 1114.464844 1093.320312 L 902.367188 666.722656 C 839.917969 722.578125 784.960938 820.574219 788.027344 900.875 L 852.203125 1027.425781 C 854.507812 1031.96875 858.433594 1035.472656 863.210938 1037.246094 L 1089.253906 1121.335938 C 1106.46875 1127.742188 1122.644531 1109.769531 1114.464844 1093.320312 Z M 733.84375 860.191406 C 733.300781 860.992188 732.796875 861.84375 732.347656 862.757812 L 651.828125 1025.953125 C 649.539062 1030.585938 645.566406 1034.179688 640.71875 1035.984375 L 410.511719 1121.617188 C 393.394531 1127.992188 377.25 1110.242188 385.203125 1093.804688 L 726.917969 387.246094 C 734.253906 372.085938 755.8125 371.960938 763.3125 387.042969 L 895.113281 652.152344 C 822.84375 703.808594 766.253906 776.003906 733.84375 860.191406" />
          </svg>
        </div>

        <button className="ardeno-btn" onClick={handleGoogleLogin} disabled={loading}>
          <div className="ardeno-btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <span className="ardeno-btn-label">
            {loading ? 'Establishing Link...' : 'Continue with Google'}
          </span>
        </button>

        <div className="flex flex-col items-center gap-2">
          <div className="ardeno-status">
            <div className="ardeno-dot" />
            <span className="ardeno-dot-label">Encrypted Session · TLS 1.3</span>
          </div>
          {error && <span className="ardeno-error">{error}</span>}
        </div>
      </div>
    </div>
  );
}