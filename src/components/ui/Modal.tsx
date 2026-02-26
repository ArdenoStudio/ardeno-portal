import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { EASING } from '@/lib/constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-[#050505]/95 backdrop-blur-[12px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.99 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${maxWidth} bg-surface-modal border border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden`}
          >
            {/* Architectural Rim */}
            <div className="absolute top-0 left-0 right-0 h-px bg-accent/40" />
            <div className="absolute top-0 right-0 w-px h-12 bg-accent/20" />

            {title && (
              <div className="flex items-center justify-between px-8 pt-8 pb-4">
                <div className="flex flex-col gap-1">
                  <div className="h-0.5 w-6 bg-accent mb-1" />
                  <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="h-10 w-10 flex items-center justify-center border border-white/[0.08] text-zinc-600 hover:text-white hover:border-white/20 transition-all group"
                >
                  <X size={16} className="group-hover:rotate-90 transition-transform duration-500" />
                </button>
              </div>
            )}

            <div className="px-8 pb-8 pt-4">{children}</div>

            {/* Tech Decoration */}
            <div className="px-8 pb-4 flex justify-between items-center opacity-20 select-none">
              <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="h-0.5 w-3 bg-zinc-500" />)}
              </div>
              <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Dialog_Secure_Mode_v1</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
