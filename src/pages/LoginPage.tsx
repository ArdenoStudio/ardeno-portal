import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function ArdenoLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = params.get("next") || "";

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(user.isAdmin ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Supabase redirect URL
  const redirectTo = useMemo(() => {
    const base = window.location.origin;
    const nextParam = next ? `?next=${encodeURIComponent(next)}` : "";
    return `${base}/auth/callback${nextParam}`;
  }, [next]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap');

      .ardeno-root {
        height: 100vh;
        width: 100%;
        background: #0C0908;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        font-family: 'JetBrains Mono', monospace;
      }

      .ardeno-root::after {
        content: '';
        position: fixed;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        opacity: 0.032;
        pointer-events: none;
        z-index: 100;
      }

      .ardeno-glow {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -68%);
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, rgba(255,51,1,0.09) 0%, transparent 65%);
        pointer-events: none;
        animation: ardenoBreath 7s ease-in-out infinite;
      }

      @keyframes ardenoBreath {
        0%, 100% { opacity: 0.8; transform: translate(-50%, -68%) scale(1); }
        50%       { opacity: 1;   transform: translate(-50%, -68%) scale(1.12); }
      }

      .ardeno-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 56px;
        position: relative;
        z-index: 1;
      }

      .ardeno-logo-wrap {
        width: 68px;
        height: 68px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ardeno-logo {
        width: 68px;
        height: 68px;
        display: block;
      }

      .ardeno-btn {
        display: flex;
        align-items: center;
        width: 272px;
        height: 50px;
        background: rgba(255,255,255,0.045);
        border: 1px solid rgba(255,255,255,0.09);
        border-top-color: rgba(255,255,255,0.16);
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
        opacity: 0;
        animation: ardenoUp 1s cubic-bezier(.16,1,.3,1) 0.28s forwards;
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
        background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 60%);
        pointer-events: none;
      }

      .ardeno-btn:hover:not(:disabled) {
        background: rgba(255,255,255,0.085);
        border-color: rgba(255,255,255,0.18);
      }

      .ardeno-btn-icon {
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-right: 1px solid rgba(255,255,255,0.07);
        flex-shrink: 0;
      }

      .ardeno-btn-label {
        flex: 1;
        text-align: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: rgba(242,238,233,0.5);
      }

      .ardeno-status {
        display: flex;
        align-items: center;
        gap: 7px;
        opacity: 0;
        animation: ardenoUp 1s cubic-bezier(.16,1,.3,1) 0.46s forwards;
      }

      .ardeno-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #39D98A;
        animation: ardenoPulse 2.5s ease-in-out infinite;
      }

      .ardeno-error {
        margin-top: 12px;
        font-size: 8px;
        font-family: 'JetBrains Mono', monospace;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #ff3301;
        opacity: 0.8;
      }

      @keyframes ardenoPulse {
        0%   { box-shadow: 0 0 0 0 rgba(57,217,138,0.6); }
        70%  { box-shadow: 0 0 0 5px rgba(57,217,138,0); }
        100% { box-shadow: 0 0 0 0 rgba(57,217,138,0); }
      }

      .ardeno-dot-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 8px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: rgba(242,238,233,0.2);
      }

      @keyframes ardenoUp {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleGoogleLogin = async () => {
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
  };

  return (
    <div className="ardeno-root">
      <div className="ardeno-glow" />

      <div className="ardeno-wrap">
        {/* Big A mark */}
        <div className="ardeno-logo-wrap" style={{ opacity: 0, animation: 'ardenoUp 1s cubic-bezier(.16,1,.3,1) 0.1s forwards' }}>
          <svg
            className="ardeno-logo"
            viewBox="0 0 1500 1500"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#ff3301"
              d="M 1114.464844 1093.320312 L 902.367188 666.722656
                 C 839.917969 722.578125 784.960938 820.574219 788.027344 900.875
                 L 852.203125 1027.425781
                 C 854.507812 1031.96875 858.433594 1035.472656 863.210938 1037.246094
                 L 1089.253906 1121.335938
                 C 1106.46875 1127.742188 1122.644531 1109.769531 1114.464844 1093.320312 Z
                 M 733.84375 860.191406
                 C 733.300781 860.992188 732.796875 861.84375 732.347656 862.757812
                 L 651.828125 1025.953125
                 C 649.539062 1030.585938 645.566406 1034.179688 640.71875 1035.984375
                 L 410.511719 1121.617188
                 C 393.394531 1127.992188 377.25 1110.242188 385.203125 1093.804688
                 L 726.917969 387.246094
                 C 734.253906 372.085938 755.8125 371.960938 763.3125 387.042969
                 L 895.113281 652.152344
                 C 822.84375 703.808594 766.253906 776.003906 733.84375 860.191406"
            />
          </svg>
        </div>

        {/* Google login button */}
        <button
          className="ardeno-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <div className="ardeno-btn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24">
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

        {/* Secure indicator */}
        <div className="flex flex-col items-center gap-2">
          <div className="ardeno-status">
            <div className="ardeno-dot" />
            <span className="ardeno-dot-label">Secure · TLS 1.3</span>
          </div>
          {error && <span className="ardeno-error">{error}</span>}
        </div>
      </div>
    </div>
  );
}