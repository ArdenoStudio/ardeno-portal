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
          'fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col border-r border-white/[0.06] bg-[#0a0a0c]',
          'lg:translate-x-0 transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Red accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-accent/40 via-accent/20 to-transparent" />

        {/* Logo */}
        <div className="flex items-center justify-between px-6 pt-8 pb-8">
          <div>
            <div className="text-lg font-display font-bold tracking-[0.25em] text-white">
              ARDENO
            </div>
            <div className="text-[9px] tracking-[0.35em] text-zinc-600 uppercase mt-0.5">
              Client Portal
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden rounded-full p-1.5 text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* New Project button */}
        <div className="px-3 mb-4">
          <NavLink
            to="/projects/new"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent/10 border border-accent/20 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/15 transition-colors duration-200"
          >
            <Plus size={16} />
            New Project
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
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
                  'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-4">
                <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-700">
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
                      'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-accent/10 text-accent border border-accent/20'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                    )}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 rounded-full border border-white/[0.1]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent text-sm font-semibold">
                {user?.name?.[0] || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {user?.name}
              </div>
              <div className="text-[11px] text-zinc-600 truncate">
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.04] transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </motion.aside>
    </>
  );
}
