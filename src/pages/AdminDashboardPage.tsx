import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  ArrowUpRight,
  Filter,
  Search,
  Pencil,
  X,
  Plus,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StageBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AdminDashboardSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';
import { EASING } from '@/lib/constants';
import { formatRelative } from '@/lib/utils';
import { api } from '@/lib/api';
import {
  PROJECT_STAGES,
  type ProjectStage,
  type ProjectStatus,
  type Project,
} from '@/types';
import { CopyDebugInfo } from '@/components/ui/CopyDebugInfo';

const PAGE_SIZE = 20;

const stagger = {
  container: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  item: {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASING } },
  },
};

export default function AdminDashboardPage() {
  const toast = useToast();

  const [stageFilter, setStageFilter] = useState<ProjectStage | ''>('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [stageFilter, statusFilter]);

  // ── Data state ──────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Fetch projects from API ─────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (stageFilter) params.set('stage', stageFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String((page - 1) * PAGE_SIZE));

      const qs = params.toString();
      const path = `/admin/projects${qs ? `?${qs}` : ''}`;
      const data = await api.get<{ projects: Project[]; total: number }>(path);

      // Handle both shapes: array (legacy) or { projects, total }
      if (Array.isArray(data)) {
        setProjects(data);
        setTotalCount(data.length);
      } else {
        setProjects(data.projects);
        setTotalCount(data.total);
      }
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [stageFilter, statusFilter, debouncedQuery, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // ── Edit modal state ────────────────────────────────────
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editStage, setEditStage] = useState<ProjectStage>('Discovery & Strategy');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('Active');
  const [editMessage, setEditMessage] = useState('');
  const [editEstDate, setEditEstDate] = useState('');
  const [editNextUpdateDate, setEditNextUpdateDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // ── Stats (from currently loaded projects) ──────────────
  const stats = useMemo(
    () => ({
      total: totalCount,
      active: projects.filter((p) => p.current_status === 'Active').length,
      onHold: projects.filter((p) => p.current_status === 'On Hold').length,
      completed: projects.filter((p) => p.current_status === 'Completed').length,
    }),
    [projects, totalCount]
  );

  const openEditModal = useCallback((project: Project) => {
    setEditingProject(project);
    setEditStage(project.current_stage);
    setEditStatus(project.current_status);
    setEditMessage('');
    setEditEstDate(project.estimated_completion_date || '');
    setEditNextUpdateDate(project.next_update_date || '');
    setEditError(null);
  }, []);

  // ── Save edit via API ───────────────────────────────────
  const handleSaveEdit = useCallback(async () => {
    if (!editingProject) return;

    // Enforce update_message when stage changes (Phase 5E)
    const stageChanged = editStage !== editingProject.current_stage;
    if (stageChanged && !editMessage.trim()) {
      setEditError('An update message is required when changing the project stage.');
      return;
    }

    setSaving(true);
    setEditError(null);

    try {
      const updated = await api.put<Project>(
        `/admin/projects/${editingProject.id}`,
        {
          new_stage: editStage,
          new_status: editStatus,
          update_message: editMessage.trim() || undefined,
          estimated_completion_date: editEstDate || undefined,
          next_update_date: editNextUpdateDate || undefined,
        }
      );

      // Update local state with the API response
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? updated : p))
      );

      setEditingProject(null);
      toast.success('Project updated', `${editingProject.project_name} was updated successfully.`);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update project');
      toast.error('Update failed', err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  }, [editingProject, editStage, editStatus, editMessage, editEstDate, editNextUpdateDate, toast]);

  // Track whether stage changed (for required message hint)
  const stageChanged = editingProject ? editStage !== editingProject.current_stage : false;

  // ── Skeleton loading state ───────────────────────────────
  if (loading && projects.length === 0) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASING }}
      >
        <h1 className="text-2xl font-display font-semibold text-white sm:text-3xl">
          Admin Panel
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage all client projects
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <motion.div variants={stagger.item}>
          <StatCard
            icon={FolderKanban}
            label="Total"
            value={stats.total}
            accent
          />
        </motion.div>
        <motion.div variants={stagger.item}>
          <StatCard
            icon={PlayCircle}
            label="Active"
            value={stats.active}
            color="text-emerald-400"
          />
        </motion.div>
        <motion.div variants={stagger.item}>
          <StatCard
            icon={PauseCircle}
            label="On Hold"
            value={stats.onHold}
            color="text-zinc-400"
          />
        </motion.div>
        <motion.div variants={stagger.item}>
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={stats.completed}
            color="text-accent"
          />
        </motion.div>
      </motion.div>

      {/* Search + Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mt-10 space-y-4"
      >
        {/* Search bar */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects, clients, or industries..."
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] pl-11 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-accent/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Error banner */}
        {fetchError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
            <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-300">{fetchError}</p>
            <CopyDebugInfo error={fetchError} endpoint="/admin/projects" />
          </div>
        )}

        {/* Filter row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-display font-semibold text-white">
            All Projects
            {loading && (
              <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-accent" />
            )}
          </h2>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-600" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as ProjectStage | '')}
              className="rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-accent/40 transition-colors appearance-none"
            >
              <option value="">All Stages</option>
              {PROJECT_STAGES.map((s) => (
                <option key={s} value={s} className="bg-zinc-900">
                  {s}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
              className="rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-accent/40 transition-colors appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="Active" className="bg-zinc-900">Active</option>
              <option value="On Hold" className="bg-zinc-900">On Hold</option>
              <option value="Completed" className="bg-zinc-900">Completed</option>
            </select>
            {(stageFilter || statusFilter || searchQuery) && (
              <button
                onClick={() => {
                  setStageFilter('');
                  setStatusFilter('');
                  setSearchQuery('');
                }}
                className="text-[10px] text-zinc-500 hover:text-accent transition-colors uppercase tracking-wide"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Project list */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="mt-4 space-y-2"
      >
        {projects.length === 0 && !loading ? (
          <GlassCard hover={false} className="py-16 text-center">
            <p className="text-sm text-zinc-500">No projects match the current filters</p>
          </GlassCard>
        ) : (
          projects.map((project) => (
            <motion.div key={project.id} variants={stagger.item}>
              <GlassCard className="group p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: client + project */}
                  <Link to={`/projects/${project.id}`} className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent text-sm font-semibold">
                      {project.client_name?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-white group-hover:text-accent transition-colors duration-300 truncate">
                        {project.project_name}
                      </h3>
                      <p className="text-[11px] text-zinc-600 truncate">
                        {project.client_name} &middot; {project.client_email}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate italic">
                        {project.industry}
                      </p>
                    </div>
                  </Link>

                  {/* Right: badges + actions */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                    <StageBadge stage={project.current_stage} />
                    <StatusBadge status={project.current_status} />
                    <span className="hidden sm:inline text-[11px] text-zinc-600 min-w-[80px] text-right">
                      {formatRelative(project.updated_at)}
                    </span>
                    <button
                      onClick={() => openEditModal(project)}
                      className="rounded-lg p-1.5 text-zinc-600 hover:text-accent hover:bg-accent/10 transition-all duration-200"
                      title="Edit project"
                    >
                      <Pencil size={14} />
                    </button>
                    <Link to={`/projects/${project.id}`}>
                      <ArrowUpRight
                        size={14}
                        className="text-zinc-700 group-hover:text-accent transition-colors duration-300"
                      />
                    </Link>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex items-center justify-between"
        >
          <p className="text-xs text-zinc-600">
            Page {page} of {totalPages} &middot; {totalCount} projects
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 text-zinc-400 hover:text-white hover:border-accent/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${pageNum === page
                    ? 'bg-accent/15 border border-accent/30 text-accent'
                    : 'border border-white/[0.06] text-zinc-500 hover:text-white hover:border-white/[0.12]'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 text-zinc-400 hover:text-white hover:border-accent/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        title={editingProject ? `Edit: ${editingProject.project_name}` : ''}
        maxWidth="max-w-md"
      >
        {editingProject && (
          <div className="space-y-5">
            {/* Client info */}
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-semibold">
                {editingProject.client_name?.[0] || '?'}
              </div>
              <div>
                <p className="text-sm text-white">{editingProject.client_name}</p>
                <p className="text-[11px] text-zinc-600">{editingProject.client_email}</p>
              </div>
            </div>

            {/* Stage select */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500 mb-2">
                Project Stage
              </label>
              <select
                value={editStage}
                onChange={(e) => setEditStage(e.target.value as ProjectStage)}
                className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accent/40 transition-colors appearance-none"
              >
                {PROJECT_STAGES.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Status select */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500 mb-2">
                Project Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accent/40 transition-colors appearance-none"
              >
                <option value="Active" className="bg-zinc-900">Active</option>
                <option value="On Hold" className="bg-zinc-900">On Hold</option>
                <option value="Completed" className="bg-zinc-900">Completed</option>
              </select>
            </div>

            {/* Estimated completion date */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500 mb-2">
                Est. Completion Date
              </label>
              <input
                type="date"
                value={editEstDate}
                onChange={(e) => setEditEstDate(e.target.value)}
                className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accent/40 transition-colors"
              />
            </div>

            {/* Next update date (Phase 5C) */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500 mb-2">
                <CalendarClock size={10} className="inline mr-1" />
                Next Update Date
              </label>
              <input
                type="date"
                value={editNextUpdateDate}
                onChange={(e) => setEditNextUpdateDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-accent/40 transition-colors"
              />
              <p className="mt-1 text-[10px] text-zinc-600">
                Clients will see this as the expected date for the next project update.
              </p>
            </div>

            {/* Update message */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500 mb-2">
                <Plus size={10} className="inline mr-1" />
                Add Update Message
                {stageChanged && <span className="text-accent ml-1">* Required</span>}
              </label>
              <textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                rows={3}
                placeholder={
                  stageChanged
                    ? 'Describe what changed — required when updating the stage'
                    : 'What changed? This will appear in the project timeline...'
                }
                className={`w-full rounded-xl bg-white/[0.05] border px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-accent/40 transition-colors resize-none ${stageChanged && !editMessage.trim()
                  ? 'border-accent/30'
                  : 'border-white/[0.08]'
                  }`}
              />
            </div>

            {/* Error message */}
            {editError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300">{editError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setEditingProject(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                loading={saving}
                onClick={handleSaveEdit}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  color,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: number;
  accent?: boolean;
  color?: string;
}) {
  return (
    <GlassCard accentTop={accent} className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-display font-bold text-white">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-2 ${accent ? 'bg-accent/10' : 'bg-white/[0.04]'}`}>
          <Icon size={16} className={color || (accent ? 'text-accent' : 'text-zinc-500')} />
        </div>
      </div>
    </GlassCard>
  );
}
