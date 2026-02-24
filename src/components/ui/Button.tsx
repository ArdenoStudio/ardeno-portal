import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      'relative inline-flex items-center justify-center gap-2 font-sans font-medium tracking-wide transition-all duration-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-accent text-white hover:bg-accent-hover shadow-[0_0_20px_rgba(229,9,20,0.25)] hover:shadow-[0_0_30px_rgba(229,9,20,0.4)]',
      secondary:
        'bg-white/[0.08] text-white border border-white/[0.12] hover:bg-white/[0.12] hover:border-white/[0.18]',
      outline:
        'bg-transparent text-white border border-white/[0.15] hover:border-accent/50 hover:text-accent',
      ghost:
        'bg-transparent text-zinc-400 hover:text-white hover:bg-white/[0.05]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-2.5 text-sm',
      lg: 'px-8 py-3 text-sm',
    };

    return (
      <motion.button
        ref={ref as any}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...(props as any)}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
        <span className={cn(loading && 'opacity-0')}>{children}</span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
