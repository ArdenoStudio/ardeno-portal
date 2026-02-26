import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, FolderKanban, Shield, LogOut, X, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
];

const adminItems = [
  { to: '/admin', icon: Shield, label: 'Admin Panel' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-[240px] flex-col border-r border-white/[0.08] bg-surface',
          'lg:translate-x-0 transition-transform duration-500',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Metal Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-accent z-30" />

        {/* Logo Section */}
        <div className="flex items-center justify-between px-8 py-10">
          <div>
            <div className="text-xl font-display font-extrabold tracking-[0.2em] text-white">
              ARDENO
            </div>
            <div className="text-[10px] font-mono tracking-[0.2em] text-zinc-600 uppercase mt-1">
              v1.5 / Portal
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Project button - Refined */}
        <div className="px-6 mb-8">
          <NavLink
            to="/projects/new"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-none bg-accent/5 border border-accent/20 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-accent hover:bg-accent/10 transition-all duration-300"
          >
            <Plus size={14} />
            Initialize Project
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to === '/projects' &&
                location.pathname.startsWith('/project'));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 text-[13px] font-medium transition-all duration-500 group relative',
                  isActive
                    ? 'text-white bg-white/[0.03]'
                    : 'text-zinc-500 hover:text-white hover:bg-white/[0.01]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent"
                  />
                )}
                <item.icon size={18} className={cn(isActive ? 'text-accent' : 'group-hover:text-accent/70')} />
                <span className="font-display tracking-[0.02em]">{item.label}</span>
              </NavLink>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-10 pb-4 px-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-700">
                  Secure / Admin
                </div>
              </div>
              {adminItems.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3 text-[13px] font-medium transition-all duration-500 group relative',
                      isActive
                        ? 'text-white bg-white/[0.03]'
                        : 'text-zinc-500 hover:text-white hover:bg-white/[0.01]'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent"
                      />
                    )}
                    <item.icon size={18} className={cn(isActive ? 'text-accent' : 'group-hover:text-accent/70')} />
                    <span className="font-display tracking-[0.02em]">{item.label}</span>
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* User - Brutalist Footer */}
        <div className="border-t border-white/[0.06] bg-black/20 p-6 space-y-4">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-8 w-8 rounded-none border border-white/[0.1] grayscale hover:grayscale-0 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center bg-white/5 border border-white/10 text-white text-[10px] font-mono">
                {user?.name?.[0] || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-white truncate uppercase tracking-wider">
                {user?.name}
              </div>
              <div className="text-[9px] font-mono text-zinc-600 truncate mt-0.5">
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center justify-between group py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-600 hover:text-accent transition-colors"
          >
            <span className="flex items-center gap-2">
              <LogOut size={12} className="group-hover:animate-pulse" />
              Terminate Session
            </span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
