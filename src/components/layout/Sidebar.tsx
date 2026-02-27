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
            <div className="text-xl font-display font-extrabold tracking-[0.2em] text-white antialiased">
              ARDENO
            </div>
            <div className="text-caption font-mono tracking-[0.25em] text-zinc-500 uppercase mt-1.5 font-medium">
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
            className="flex items-center justify-center gap-2 rounded-md bg-accent/5 border border-accent/20 px-4 py-3 text-caption font-semibold uppercase tracking-[0.2em] text-accent hover:bg-accent/10 transition-all duration-300"
          >
            <Plus size={14} />
            Initialize Project
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to === '/projects' &&
                location.pathname.startsWith('/projects/'));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 text-sm font-body font-medium transition-all duration-500 group relative rounded-md',
                  isActive
                    ? 'text-white bg-white/[0.05] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-accent shadow-[0_0_10px_var(--accent-0)]"
                  />
                )}
                <item.icon size={16} className={cn('transition-colors', isActive ? 'text-accent' : 'text-zinc-600 group-hover:text-zinc-400')} />
                <span className="font-sans font-medium tracking-wide">{item.label}</span>
              </NavLink>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-12 pb-4 px-5">
                <div className="text-caption font-mono uppercase tracking-[0.4em] text-zinc-600">
                  Secure_Linkage
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
                    'flex items-center gap-4 px-5 py-4 text-sm font-body font-medium transition-all duration-500 group relative rounded-md',
                      isActive
                        ? 'text-white bg-white/[0.05]'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-accent shadow-[0_0_10px_var(--accent-0)]"
                      />
                    )}
                    <item.icon size={16} className={cn('transition-colors', isActive ? 'text-accent' : 'text-zinc-600 group-hover:text-zinc-400')} />
                    <span className="font-sans font-medium tracking-wide">{item.label}</span>
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
              <div className="text-caption font-semibold text-white truncate uppercase tracking-[0.15em] font-body">
                {user?.name}
              </div>
              <div className="text-caption font-mono text-zinc-500 truncate mt-0.5 text-[10px]">
                {user?.email}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
            className="flex w-full items-center justify-between group py-2 text-caption font-mono uppercase tracking-[0.2em] text-zinc-500 hover:text-accent transition-colors disabled:opacity-50"
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
