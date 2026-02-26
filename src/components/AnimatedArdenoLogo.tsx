import { useEffect, useState } from 'react';

export function AnimatedArdenoLogo() {
    const [isReducedMotion, setIsReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setIsReducedMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    return (
        <div className="logo-container">
            <style>{`
        .logo-container {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          opacity: 0;
          animation: at-revealUp 1s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards;
        }

        @keyframes at-drawPath {
          from { stroke-dashoffset: 2000; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes at-fillFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes at-revealUp {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .ardeno-draw-path {
          stroke-dasharray: 2000;
          animation: at-drawPath 2.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
        }

        .ardeno-fill-path {
          opacity: 0;
          animation: at-fillFade 1.2s ease 1.7s forwards;
        }

        /* Support prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .logo-container { animation: none; opacity: 1; }
          .ardeno-draw-path { animation: none; stroke-dashoffset: 0; }
          .ardeno-fill-path { animation: none; opacity: 1; }
        }
      `}</style>

            <svg
                viewBox="200 580 360 340"
                className="w-full h-full"
                style={{ filter: 'drop-shadow(0 0 12px rgba(229, 9, 20, 0.2))' }}
            >
                <defs>
                    <linearGradient id="at-gGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E50914" />
                        <stop offset="100%" stopColor="#9b060d" />
                    </linearGradient>
                    <linearGradient id="at-gStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#E50914" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#E50914" stopOpacity="0.4" />
                    </linearGradient>
                    <filter id="at-gGlow">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Path for drawing animation */}
                {!isReducedMotion && (
                    <path
                        d="M 514.300781 878.699219 L 434.792969 718.777344 C 411.382812 739.714844 390.78125 776.453125 391.929688 806.554688 L 415.984375 853.996094 C 416.851562 855.699219 418.324219 857.015625 420.113281 857.679688 L 504.851562 889.203125 C 511.304688 891.605469 517.367188 884.867188 514.300781 878.699219 Z M 371.617188 791.304688 C 371.410156 791.605469 371.222656 791.925781 371.054688 792.265625 L 340.871094 853.445312 C 340.011719 855.183594 338.523438 856.527344 336.707031 857.207031 L 250.40625 889.308594 C 243.988281 891.699219 237.9375 885.042969 240.917969 878.878906 L 369.019531 614.007812 C 371.769531 608.324219 379.851562 608.277344 382.664062 613.929688 L 432.074219 713.316406 C 404.980469 732.679688 383.765625 759.746094 371.617188 791.304688"
                        fill="none"
                        stroke="url(#at-gStroke)"
                        strokeWidth="3"
                        className="ardeno-draw-path"
                    />
                )}

                {/* Path for final fill */}
                <path
                    d="M 514.300781 878.699219 L 434.792969 718.777344 C 411.382812 739.714844 390.78125 776.453125 391.929688 806.554688 L 415.984375 853.996094 C 416.851562 855.699219 418.324219 857.015625 420.113281 857.679688 L 504.851562 889.203125 C 511.304688 891.605469 517.367188 884.867188 514.300781 878.699219 Z M 371.617188 791.304688 C 371.410156 791.605469 371.222656 791.925781 371.054688 792.265625 L 340.871094 853.445312 C 340.011719 855.183594 338.523438 856.527344 336.707031 857.207031 L 250.40625 889.308594 C 243.988281 891.699219 237.9375 885.042969 240.917969 878.878906 L 369.019531 614.007812 C 371.769531 608.324219 379.851562 608.277344 382.664062 613.929688 L 432.074219 713.316406 C 404.980469 732.679688 383.765625 759.746094 371.617188 791.304688"
                    fill="url(#at-gGrad)"
                    filter="url(#at-gGlow)"
                    className={isReducedMotion ? '' : 'ardeno-fill-path'}
                />
            </svg>
        </div>
    );
}
