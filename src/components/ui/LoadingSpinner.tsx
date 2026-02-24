import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';

// ─── Simple spinner (used inside cards/buttons) ──────────

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

  return (
    <div className="flex items-center justify-center">
      <motion.div
        className={`${dims[size]} rounded-full border-2 border-white/10 border-t-accent`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ─── Font loader (runs once) ──────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("avl-fonts")) {
  const link = document.createElement("link");
  link.id = "avl-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,300" +
    "&family=Cormorant+Garamond:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400" +
    "&family=Sora:wght@300;400" +
    "&family=Cinzel:wght@400;600" +
    "&display=swap";
  document.head.appendChild(link);
}

// ─── Global keyframes (injected once) ─────────────────────────────────────────
const STYLES = `
  @keyframes avl-breathe {
    0%,100% { opacity:.5; transform:scale(1); }
    50%      { opacity:1;  transform:scale(1.1); }
  }
  @keyframes avl-drawPath {
    from { stroke-dashoffset: 2000; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes avl-fillFade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes avl-charIn {
    from { opacity:0; transform:translateY(14px); filter:blur(5px); }
    to   { opacity:1; transform:translateY(0);    filter:blur(0);   }
  }
  @keyframes avl-scaleX {
    from { transform:scaleX(0); opacity:0; }
    to   { transform:scaleX(1); opacity:1; }
  }
  @keyframes avl-progressFill {
    from { transform:scaleX(0); }
    to   { transform:scaleX(1); }
  }
  @keyframes avl-shimmerSlide {
    from { left:-14px; }
    to   { left:calc(100% - 14px); }
  }
  @keyframes avl-flashRed {
    0%   { opacity:0; }
    40%  { opacity:1; }
    100% { opacity:0; }
  }
  @keyframes avl-fadeOutPhase {
    from { opacity:1; transform:scale(1); }
    to   { opacity:0; transform:scale(1.04); }
  }
  @keyframes avl-crownReveal {
    from { opacity:0; transform:translateY(-14px) scale(0.92); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes avl-fadeInSimple {
    from { opacity:0; }
    to   { opacity:1; }
  }
`;

const A_MARK_PATH =
  "M 514.300781 878.699219 L 434.792969 718.777344 " +
  "C 411.382812 739.714844 390.78125 776.453125 391.929688 806.554688 " +
  "L 415.984375 853.996094 " +
  "C 416.851562 855.699219 418.324219 857.015625 420.113281 857.679688 " +
  "L 504.851562 889.203125 " +
  "C 511.304688 891.605469 517.367188 884.867188 514.300781 878.699219 Z " +
  "M 371.617188 791.304688 " +
  "C 371.410156 791.605469 371.222656 791.925781 371.054688 792.265625 " +
  "L 340.871094 853.445312 " +
  "C 340.011719 855.183594 338.523438 856.527344 336.707031 857.207031 " +
  "L 250.40625 889.308594 " +
  "C 243.988281 891.699219 237.9375 885.042969 240.917969 878.878906 " +
  "L 369.019531 614.007812 " +
  "C 371.769531 608.324219 379.851562 608.277344 382.664062 613.929688 " +
  "L 432.074219 713.316406 " +
  "C 404.980469 732.679688 383.765625 759.746094 371.617188 791.304688";

const GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E" +
  "%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' " +
  "numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E" +
  "%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const FULL_COVER: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
};

const GRAIN_STYLE: React.CSSProperties = {
  ...FULL_COVER,
  backgroundImage: GRAIN_BG,
  opacity: 0.05,
  mixBlendMode: "overlay" as const,
  pointerEvents: "none",
};

const VIGNETTE_STYLE: React.CSSProperties = {
  ...FULL_COVER,
  background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)",
  pointerEvents: "none",
};

const CENTER_FLEX: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const StaggerWord = memo<{ text: string; baseDelay: number; charStyle: React.CSSProperties; animName?: string }>(
  ({ text, baseDelay, charStyle, animName = "avl-charIn" }) => (
    <span style={{ display: "inline-block", overflow: "hidden" }}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          style={{
            ...charStyle,
            display: "inline-block",
            opacity: 0,
            animation: `${animName} 0.7s cubic-bezier(0.22,1,0.36,1) ${baseDelay + i * 0.06}s forwards`,
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  )
);

const SvgDefs = memo(() => (
  <defs>
    <linearGradient id="loader-aGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#ff8060" />
      <stop offset="100%" stopColor="#ff3301" />
    </linearGradient>
    <linearGradient id="loader-aStroke" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#ffc4b4" />
      <stop offset="100%" stopColor="#ff3301" />
    </linearGradient>
    <filter id="loader-aGlow">
      <feGaussianBlur stdDeviation="4" result="g" />
      <feMerge>
        <feMergeNode in="g" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
));

interface PageLoaderProps {
  onComplete?: () => void;
  minDuration?: number;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  onComplete,
  minDuration = 2200,
}) => {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const rafRef = useRef(0);
  const lastProgressRef = useRef(0);

  useEffect(() => {
    if (document.getElementById("avl-keyframes")) return;
    const style = document.createElement("style");
    style.id = "avl-keyframes";
    style.textContent = STYLES;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  useEffect(() => {
    const start = Date.now();
    const duration = minDuration * 0.85;
    const tick = () => {
      const raw = Math.min(((Date.now() - start) / duration) * 100, 100);
      const rounded = Math.round(raw);
      if (rounded !== lastProgressRef.current) {
        lastProgressRef.current = rounded;
        setProgress(rounded);
      }
      if (raw < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [minDuration]);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => {
      setFlashRed(true);
      setExiting(true);
    }, minDuration);

    const t2 = setTimeout(() => {
      setIsDone(true);
      onCompleteRef.current?.();
    }, minDuration + 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [minDuration]);

  if (isDone) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "hidden", background: "#050303" }}>
      <div
        style={{
          ...FULL_COVER,
          background: "radial-gradient(ellipse at 50% 45%, #1a1210 0%, #0d0a08 55%, #050303 100%)",
          animation: exiting ? "avl-fadeOutPhase 0.8s cubic-bezier(0.4,0,0.2,1) forwards" : undefined,
        }}
      >
        <div style={GRAIN_STYLE} />
        <div style={VIGNETTE_STYLE} />

        {/* Ambient red glow */}
        <div
          style={{
            ...FULL_COVER,
            background: "radial-gradient(circle at 50% 50%, rgba(255,51,1,0.08) 0%, transparent 65%)",
            animation: "avl-breathe 4.5s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        {/* Center */}
        <div style={CENTER_FLEX}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            {/* A-mark SVG */}
            <div style={{ width: 80, height: 80, marginBottom: 10, opacity: 0, animation: "avl-crownReveal 1s cubic-bezier(0.22,1,0.36,1) 0.15s forwards" }}>
              <svg viewBox="200 580 360 340" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 12px rgba(255,51,1,0.15))" }}>
                <SvgDefs />
                <path d={A_MARK_PATH} fill="none" stroke="url(#loader-aStroke)" strokeWidth="3" style={{ strokeDasharray: 2000, animation: "avl-drawPath 2s cubic-bezier(0.22,1,0.36,1) 0.3s forwards" }} />
                <path d={A_MARK_PATH} fill="url(#loader-aGrad)" filter="url(#loader-aGlow)" style={{ opacity: 0, animation: "avl-fillFade 1.2s ease 1.6s forwards" }} />
              </svg>
            </div>

            {/* Text */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <StaggerWord
                text="ARDENO STUDIO"
                baseDelay={0.6}
                charStyle={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "0.24em"
                }}
              />
              <div style={{
                height: 1,
                width: 100,
                background: "linear-gradient(90deg, transparent, rgba(255,51,1,0.3), transparent)",
                margin: "6px 0",
                transformOrigin: "center",
                animation: "avl-scaleX 0.9s cubic-bezier(0.22,1,0.36,1) 1.1s forwards",
                opacity: 0
              }} />
              <StaggerWord
                text="CLIENT PORTAL"
                baseDelay={1.3}
                charStyle={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 12,
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.5em"
                }}
              />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          opacity: 0,
          animation: "avl-fadeInSimple 0.8s ease 0.5s forwards"
        }}>
          <span style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.15em",
            fontWeight: 300
          }}>
            {String(Math.round(progress)).padStart(2, "0")}
          </span>
          <div style={{ width: 140, height: 1, background: "rgba(255,255,255,0.1)", borderRadius: 1, position: "relative", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              background: "linear-gradient(90deg, rgba(255,51,1,0.3), #ff3301)",
              transformOrigin: "left",
              transform: `scaleX(${progress / 100})`,
              transition: 'transform 0.1s linear'
            }} />
            <div style={{
              position: "absolute",
              top: 0,
              width: 28,
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              animation: "avl-shimmerSlide 1.8s ease-in-out 0.6s infinite"
            }} />
          </div>
        </div>

        {flashRed && (
          <div style={{
            ...FULL_COVER,
            background: "radial-gradient(circle at 50% 50%, rgba(255,51,1,0.15) 0%, transparent 70%)",
            animation: "avl-flashRed 0.7s ease-out forwards",
            pointerEvents: "none",
            zIndex: 10
          }} />
        )}
      </div>
    </div>
  );
};

export default PageLoader;
