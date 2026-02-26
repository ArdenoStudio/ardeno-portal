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
      className={cn(
        'relative overflow-hidden rounded-xl transition-all duration-500',
        'bg-surface-card border border-white/[0.08]',
        'backdrop-blur-[24px]',
        hover &&
        'hover:bg-surface-card-hover hover:border-white/[0.12]',
        className
      )}
      {...props}
    >
      {accentTop && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20 z-30" />
      )}
      <GrainOverlay />
      <div className="relative z-20 h-full">{children}</div>
    </motion.div>
  );
}
