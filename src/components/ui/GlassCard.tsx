import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GrainOverlay } from './GrainOverlay';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode;
  accentTop?: boolean;
  hover?: boolean;
}

export function GlassCard({
  children,
  className,
  accentTop = false,
  hover = true,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? {
        y: -4,
        scale: 1.005,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
      } : {}}
      className={cn(
        'relative overflow-hidden rounded-lg transition-all duration-500',
        'bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl',
        hover && 'hover:bg-white/[0.05] hover:border-white/[0.15] hover:shadow-[var(--glow-accent)]',
        className
      )}
      {...props}
    >
      {/* Inner Highlight for depth */}
      <div className="absolute inset-0 border border-white/[0.05] pointer-events-none rounded-lg" />
      <div className="absolute inset-[1px] border border-black/20 pointer-events-none rounded-lg" />

      {accentTop && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-accent z-30" />
      )}
      <GrainOverlay />
      <div className="relative z-20 h-full">{children}</div>
    </motion.div>
  );
}
