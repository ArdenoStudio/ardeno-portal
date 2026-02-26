import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600',
            'bg-white/[0.05] border border-white/[0.1]',
            'focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(229,9,20,0.08)]',
            'transition-all duration-200',
            'font-body tracking-wide',
            error && 'border-accent/80',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-accent/80">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600',
            'bg-white/[0.05] border border-white/[0.1]',
            'focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(229,9,20,0.08)]',
            'transition-all duration-200',
            'font-body tracking-wide resize-none',
            error && 'border-accent/80',
            className
          )}
          rows={4}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-accent/80">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full rounded-xl px-4 py-3 text-sm text-white',
            'bg-white/[0.05] border border-white/[0.1]',
            'focus:outline-none focus:border-accent/60 focus:shadow-[0_0_0_3px_rgba(229,9,20,0.08)]',
            'transition-all duration-200',
            'font-body tracking-wide appearance-none',
            className
          )}
          {...(props as any)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';
