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
      'relative inline-flex items-center justify-center gap-2 font-body font-semibold tracking-[0.06em] transition-all duration-500 rounded-full disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group';

    const variants = {
      primary:
        'text-white border border-white/[0.10] shadow-[var(--shadow-2)]',
      secondary:
        'bg-white/[0.03] text-zinc-300 border border-white/[0.1] hover:bg-white/[0.06] hover:text-white',
      outline:
        'bg-transparent text-white border border-white/[0.15] hover:border-accent hover:text-accent',
      ghost:
        'bg-transparent text-zinc-500 hover:text-white hover:bg-white/[0.03]',
    };

    const sizes = {
      sm: 'px-5 py-2.5 text-caption',
      md: 'px-8 py-3.5 text-sm',
      lg: 'px-10 py-4 text-sm',
    };

    return (
      <motion.button
        ref={ref as any}
        whileHover={{
          y: disabled || loading ? 0 : -3,
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
        }}
        whileTap={{
          y: disabled || loading ? 0 : 1,
          scale: 0.98
        }}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...(props as any)}
      >
        {/* Ambient Glow Layer for Primary */}
        {variant === 'primary' && (
          <>
            <div className="absolute inset-0 bg-accent" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: 'var(--accent-glow)' }} />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
        <span className={cn('relative z-10', loading && 'opacity-0')}>{children}</span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
