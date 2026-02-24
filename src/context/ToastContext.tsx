// ─── Toast Notification System ────────────────────────
// Global toast system with success, error, and warning variants.
// Matches the dark glassmorphism design system with accent colors.

import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { EASING } from '@/lib/constants';

// ─── Types ───────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  addToast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

// ─── Context ─────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Provider ────────────────────────────────────────

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = `toast-${++toastCounter}`;
      const toast: Toast = { id, type, title, message };
      setToasts((prev) => [...prev, toast]);

      // Auto-dismiss after delay
      const duration = type === 'error' ? 6000 : 4000;
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => addToast('success', title, message),
    [addToast]
  );
  const error = useCallback(
    (title: string, message?: string) => addToast('error', title, message),
    [addToast]
  );
  const warning = useCallback(
    (title: string, message?: string) => addToast('warning', title, message),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, success, error, warning }}>
      {children}

      {/* Toast container — top right */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ─── Toast Item ──────────────────────────────────────

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
};

const STYLES: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: {
    border: 'border-emerald-500/20',
    icon: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
  },
  error: {
    border: 'border-red-500/20',
    icon: 'text-red-400',
    bg: 'bg-red-500/5',
  },
  warning: {
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
    bg: 'bg-amber-500/5',
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const Icon = ICONS[toast.type];
  const style = STYLES[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.35, ease: EASING }}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border ${style.border} ${style.bg} bg-[rgba(12,12,14,0.9)] backdrop-blur-xl px-4 py-3 shadow-2xl`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <Icon size={16} className={style.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{toast.title}</p>
          {toast.message && (
            <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}
