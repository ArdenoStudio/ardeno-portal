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
    <div className="flex h-screen bg-black">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col lg:ml-[260px]">
        {/* Mobile topbar */}
        <div className="flex items-center justify-between px-4 py-3 lg:hidden border-b border-white/[0.06]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="text-sm font-display font-semibold tracking-[0.2em] text-white">
            ARDENO
          </div>
          <div className="w-9" />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASING }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
