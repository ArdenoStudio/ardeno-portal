// ─── Milestone Moment ────────────────────────────────
// Full-screen cinematic interstitial that celebrates
// a project advancing to a new stage.

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Box } from 'lucide-react';
import type { ProjectStage } from '@/types';
import { Button } from './Button';

interface MilestoneMomentProps {
    stage: ProjectStage;
    visible: boolean;
    onDismiss: () => void;
}

const STAGE_META: Record<
    ProjectStage,
    { label: string; description: string; number: string; industrialTitle: string }
> = {
    'Discovery & Strategy': {
        label: 'Discovery & Strategy',
        industrialTitle: 'Foundation_Protocol',
        description: 'Mapping the digital landscape. We are aligning core vision with architectural requirements to build a bulletproof structural base.',
        number: '01',
    },
    'UX & Wireframing': {
        label: 'UX & Wireframing',
        industrialTitle: 'Structural_Blueprint',
        description: 'Translating strategy into pure interaction logic. Engineering the flows and spatial hierarchy that will define the user experience.',
        number: '02',
    },
    'Visual Design': {
        label: 'Visual Design',
        industrialTitle: 'Aesthetic_Refinement',
        description: 'Applying high-fidelity visual identity. Bringing the brand to life through specialized typography, obsidian surfaces, and blood accents.',
        number: '03',
    },
    'Development & Launch': {
        label: 'Development & Launch',
        industrialTitle: 'Full_Deployment',
        description: 'Executing the production-ready build. Engineering your vision into a high-performance, live-state digital environment.',
        number: '04',
    },
};

const ease = [0.16, 1, 0.3, 1] as const;

export function MilestoneMoment({
    stage,
    visible,
    onDismiss,
}: MilestoneMomentProps) {
    const meta = STAGE_META[stage];

    if (!meta) {
        if (visible) onDismiss();
        return null;
    }

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
                    transition={{ duration: 1, ease }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050505]"
                    onClick={onDismiss}
                >
                    {/* Background Texture / Grain */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grain-y.com/images/grain-dark.png')] mix-blend-overlay" />

                    {/* Metal Accent Line */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                        className="absolute top-1/2 left-0 right-0 h-px bg-white/[0.05] -translate-y-1/2 z-0"
                    />

                    {/* Content */}
                    <div className="relative z-10 w-full max-w-7xl px-8 flex flex-col md:flex-row items-end justify-between gap-20">
                        {/* Number Block */}
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1.2, delay: 0.4, ease }}
                            className="hidden lg:block"
                        >
                            <span className="text-[240px] font-display font-black leading-none text-white/[0.02] select-none">
                                {meta.number}
                            </span>
                        </motion.div>

                        {/* Text Block */}
                        <div className="flex-1 max-w-2xl text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6, ease }}
                                className="flex items-center gap-4 mb-8"
                            >
                                <div className="h-px w-10 bg-accent" />
                                <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-accent/80">
                                    {meta.industrialTitle} // STAGE_{meta.number}
                                </span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 40, skewY: 2 }}
                                animate={{ opacity: 1, y: 0, skewY: 0 }}
                                transition={{ duration: 1.2, delay: 0.8, ease }}
                                className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white leading-[0.9] tracking-tighter mb-10"
                            >
                                {meta.label}
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, delay: 1.0, ease }}
                                className="text-lg md:text-xl text-zinc-500 font-sans leading-relaxed mb-12 max-w-lg"
                            >
                                {meta.description}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 1.2, ease }}
                                className="flex flex-col sm:flex-row items-start sm:items-center gap-8"
                            >
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={onDismiss}
                                    className="px-10"
                                >
                                    Proceed_to_Terminal
                                    <ArrowRight size={14} className="ml-2" />
                                </Button>

                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Operator.Auth</span>
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Encrypted_Broadcast_Active</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Visual Ornament */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                            animate={{ opacity: 0.1, scale: 1, rotate: 0 }}
                            transition={{ duration: 2, delay: 0.5, ease }}
                            className="hidden xl:block absolute -right-20 -top-20 text-white pointer-events-none"
                        >
                            <Box size={400} strokeWidth={0.2} />
                        </motion.div>
                    </div>

                    {/* Dismiss Hint */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 2.5 }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[9px] font-mono text-zinc-800 uppercase tracking-[0.4em]"
                    >
                        [ Interaction_Required ]
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
