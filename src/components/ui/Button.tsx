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
      'relative inline-flex items-center justify-center gap-2 font-sans font-medium tracking-[0.05em] uppercase transition-all duration-500 rounded-[2px] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group';

    const variants = {
      primary:
        'bg-accent text-white hover:bg-accent-hover shadow-[0_4px_20px_rgba(255,51,1,0.15)]',
      secondary:
        'bg-white/[0.03] text-white border border-white/[0.1] hover:bg-white/[0.06] hover:border-white/[0.15] font-mono lowercase tracking-normal capitalize',
      outline:
        'bg-transparent text-white border border-white/[0.1] hover:border-accent hover:text-accent font-mono lowercase tracking-normal capitalize',
      ghost:
        'bg-transparent text-zinc-500 hover:text-white hover:bg-white/[0.03] font-mono lowercase tracking-normal capitalize',
    };

    const sizes = {
      sm: 'px-4 py-1.5 text-[10px]',
      md: 'px-6 py-2.5 text-[11px]',
      lg: 'px-8 py-3.5 text-[12px]',
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
