import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { EASING } from '@/lib/constants';

export function PortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="portal-root flex h-screen overflow-hidden select-none">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="relative z-10 flex flex-1 flex-col lg:ml-[260px] bg-transparent">
        {/* Mobile topbar */}
        <div className="flex items-center justify-between px-4 py-3 lg:hidden border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="text-sm font-display font-semibold tracking-[0.2em] text-white">
            Ardeno
          </div>
          <div className="w-9" />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.99, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.01, filter: 'blur(4px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full p-4 lg:p-0"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
