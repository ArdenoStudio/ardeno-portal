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
        y: -2,
        transition: { duration: 0.35, ease: [0.2, 1, 0.25, 1] }
      } : {}}
      className={cn(
        'relative overflow-hidden rounded-2xl transition-all duration-500',
        'bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl',
        hover && 'hover:bg-white/[0.03] hover:border-white/[0.12] hover:shadow-[var(--shadow-2)]',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-white/[0.06]" />

      {accentTop && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-accent/70" />
      )}
      <GrainOverlay />
      <div className="relative z-20 h-full">{children}</div>
    </motion.div>
  );
}
