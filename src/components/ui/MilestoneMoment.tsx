// ─── Milestone Moment ────────────────────────────────
// Full-screen cinematic interstitial that celebrates
// a project advancing to a new stage. Designed to feel
// like a quiet, intentional reveal — not a pop-up.

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ProjectStage } from '@/types';

interface MilestoneMomentProps {
    stage: ProjectStage;
    visible: boolean;
    onDismiss: () => void;
}

// ── Stage metadata ─────────────────────────────────────

const STAGE_META: Record<
    ProjectStage,
    { label: string; description: string; number: string }
> = {
    'Discovery & Strategy': {
        label: 'Discovery & Strategy',
        description: 'We\'re shaping the vision, aligning goals, and building your project\'s foundation.',
        number: '01',
    },
    'UX & Wireframing': {
        label: 'UX & Wireframing',
        description: 'Translating strategy into structure \u2014 flows, layouts, and the architecture of experience.',
        number: '02',
    },
    'Visual Design': {
        label: 'Visual Design',
        description: 'Bringing your brand to life through refined aesthetics, typography, and visual identity.',
        number: '03',
    },
    'Development & Launch': {
        label: 'Development & Launch',
        description: 'Engineering your vision into a living, production-ready experience.',
        number: '04',
    },
};

// ── Easing ──────────────────────────────────────────────

const ease = [0.16, 1, 0.3, 1] as const;

// ── Component ───────────────────────────────────────────

export function MilestoneMoment({
    stage,
    visible,
    onDismiss,
}: MilestoneMomentProps) {
    const meta = STAGE_META[stage];

    // Safety check: if stage is invalid/legacy, don't render and don't crash
    if (!meta) {
        if (visible) onDismiss(); // Auto-dismiss if we can't show it
        return null;
    }

    // Lock body scroll while visible
    useEffect(() => {
        if (visible) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [visible]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    key="milestone-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease }}
                    className="fixed inset-0 z-[200] flex items-center justify-center"
                    onClick={onDismiss}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, delay: 0.15, ease }}
                        className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Stage number */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7, delay: 0.3, ease }}
                        >
                            <span className="text-[11px] font-medium tracking-[0.3em] uppercase text-zinc-600">
                                Stage {meta.number}
                            </span>
                        </motion.div>

                        {/* Stage title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.45, ease }}
                            className="mt-4 text-3xl sm:text-4xl font-display font-bold tracking-tight text-white"
                        >
                            {meta.label}
                        </motion.h1>

                        {/* Divider */}
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.9, delay: 0.7, ease }}
                            className="mt-6 h-px w-16 origin-center bg-gradient-to-r from-transparent via-accent/50 to-transparent"
                        />

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.9, ease }}
                            className="mt-6 text-sm leading-relaxed text-zinc-400 max-w-xs"
                        >
                            {meta.description}
                        </motion.p>

                        {/* Sparkle icon */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 0.15, scale: 1 }}
                            transition={{ duration: 1.2, delay: 1.0, ease }}
                            className="absolute -top-16 text-accent"
                        >
                            <Sparkles size={80} strokeWidth={0.5} />
                        </motion.div>

                        {/* CTA */}
                        <motion.button
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 1.2, ease }}
                            onClick={onDismiss}
                            className="mt-10 group inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.08] px-6 py-2.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.1] hover:border-white/[0.15] transition-all duration-300"
                        >
                            Explore this stage
                            <ArrowRight
                                size={14}
                                className="transition-transform duration-300 group-hover:translate-x-0.5"
                            />
                        </motion.button>

                        {/* Subtle hint */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 1.8 }}
                            className="mt-6 text-[10px] text-zinc-700 tracking-wide"
                        >
                            Click anywhere to continue
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
