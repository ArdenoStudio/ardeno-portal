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
        'relative overflow-hidden rounded-2xl',
        'bg-[rgba(12,12,14,0.55)] border border-white/[0.07]',
        'backdrop-blur-[20px]',
        hover &&
          'transition-all duration-300 hover:bg-[rgba(18,18,22,0.8)] hover:border-white/[0.1]',
        className
      )}
      {...props}
    >
      {accentTop && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      )}
      <GrainOverlay />
      <div className="relative z-20">{children}</div>
    </motion.div>
  );
}
