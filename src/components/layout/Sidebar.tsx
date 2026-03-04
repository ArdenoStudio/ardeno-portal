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
          'fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-white/[0.08] bg-white/[0.02] backdrop-blur-xl',
          'lg:translate-x-0 transition-transform duration-500',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/[0.08]" />

        {/* Logo Section */}
        <div className="flex items-center justify-between px-7 py-8">
          <div>
            <div className="text-lg font-display font-semibold text-white antialiased">
              Ardeno Studio
            </div>
            <div className="text-[12px] font-body text-white/55 mt-1">
              Client Portal
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
        <div className="px-5 mb-6">
          <NavLink
            to="/projects/new"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-[var(--shadow-2)] hover:shadow-[var(--glow-accent)] transition-shadow"
          >
            <Plus size={14} />
            New project
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
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
                  'flex items-center gap-3 px-4 py-3 text-sm font-body font-medium transition-all duration-300 group relative rounded-xl',
                  isActive
                    ? 'text-white bg-white/[0.06]'
                    : 'text-white/65 hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <item.icon size={16} className={cn('transition-colors', isActive ? 'text-accent' : 'text-white/45 group-hover:text-white/70')} />
                <span className="tracking-tight">{item.label}</span>
              </NavLink>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-6 pb-2 px-5">
                <div className="text-[11px] font-body text-white/40">
                  Admin
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
                    'flex items-center gap-3 px-4 py-3 text-sm font-body font-medium transition-all duration-300 group relative rounded-xl',
                      isActive
                        ? 'text-white bg-white/[0.06]'
                        : 'text-white/65 hover:text-white hover:bg-white/[0.04]'
                    )}
                  >
                    <item.icon size={16} className={cn('transition-colors', isActive ? 'text-accent' : 'text-white/45 group-hover:text-white/70')} />
                    <span className="tracking-tight">{item.label}</span>
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* User - Brutalist Footer */}
        <div className="border-t border-white/[0.06] bg-white/[0.01] p-5 space-y-4">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-8 w-8 rounded-xl border border-white/[0.10] grayscale hover:grayscale-0 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center bg-white/5 border border-white/10 text-white text-[10px] font-mono rounded-xl">
                {user?.name?.[0] || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate font-body tracking-tight">
                {user?.name}
              </div>
              <div className="text-[12px] font-body text-white/50 truncate mt-0.5">
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
            className="flex w-full items-center justify-between group py-2 text-[12px] font-body text-white/55 hover:text-white transition-colors disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <LogOut size={12} className="group-hover:animate-pulse" />
              Sign out
            </span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
