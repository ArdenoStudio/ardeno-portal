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

  const revealProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    <div className="mx-auto max-w-7xl px-8 py-16 lg:py-24">
      {/* Header */}
      <motion.div
        {...revealProps as any}
        className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16"
      >
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-accent" />
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-accent/80">Command_Center // v1.5</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter uppercase leading-none">
            Project Logistics
          </h1>
          <p className="mt-4 text-sm text-zinc-500 font-sans max-w-md leading-relaxed">
            Centralized management hub for all active client streams. Oversee deployment status, sync targets, and architectural milestones.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest leading-none mb-1">System_Status</p>
            <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest leading-none font-bold">Encrypted_Link_Active</p>
          </div>
          <Button variant="primary" size="lg" className="px-8">
            <Plus size={14} className="mr-2" />
            Create_Project
          </Button>
        </div>
      </motion.div>

      {/* Stats - Broken Grid Layout */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-12 gap-1 mb-16"
      >
        <motion.div variants={stagger.item} className="md:col-span-3">
          <StatCard
            icon={FolderKanban}
            label="Total_Fleet"
            value={stats.total}
            accent
          />
        </motion.div>
        <motion.div variants={stagger.item} className="md:col-span-3">
          <StatCard
            icon={PlayCircle}
            label="Active_Deploy"
            value={stats.active}
            color="text-accent"
          />
        </motion.div>
        <motion.div variants={stagger.item} className="md:col-span-3">
          <StatCard
            icon={PauseCircle}
            label="Stalled_Sync"
            value={stats.onHold}
            color="text-zinc-600"
          />
        </motion.div>
        <motion.div variants={stagger.item} className="md:col-span-3">
          <StatCard
            icon={CheckCircle2}
            label="Verified_Final"
            value={stats.completed}
            color="text-emerald-500"
          />
        </motion.div>
      </motion.div>

      {/* Search + Filters */}
      <motion.div
        {...revealProps as any}
        transition={{ ...revealProps.transition, delay: 0.4 } as any}
        className="mb-8 space-y-6"
      >
        {/* Search bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search size={14} className="text-zinc-700 group-focus-within:text-accent transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search_Internal_Registry..."
            className="w-full bg-white/[0.02] border border-white/[0.05] pl-14 pr-6 py-4 text-xs font-mono text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-accent/40 focus:bg-white/[0.04] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-4 border-t border-white/[0.03]">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-[0.4em] text-white">
              Project_Registry
              {loading && (
                <span className="ml-4 inline-block h-1 w-8 bg-accent animate-pulse" />
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Filter_Set:</span>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value as ProjectStage | '')}
                className="bg-transparent text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 focus:text-accent transition-colors outline-none cursor-pointer"
              >
                <option value="">All Stages</option>
                {PROJECT_STAGES.map((s) => (
                  <option key={s} value={s} className="bg-[#050505]">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-white/10" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
              className="bg-transparent text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 focus:text-accent transition-colors outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Active" className="bg-[#050505]">Active</option>
              <option value="On Hold" className="bg-[#050505]">On Hold</option>
              <option value="Completed" className="bg-[#050505]">Completed</option>
            </select>

            {(stageFilter || statusFilter || searchQuery) && (
              <button
                onClick={() => {
                  setStageFilter('');
                  setStatusFilter('');
                  setSearchQuery('');
                }}
                className="text-[9px] font-mono text-accent hover:underline uppercase tracking-widest pl-2"
              >
                Reset_View
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Project list - Technical Specs Row */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="space-y-px bg-white/[0.05] border border-white/[0.05]"
      >
        {projects.length === 0 && !loading ? (
          <div className="py-32 text-center bg-[#050505]">
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-800">No_Matching_Registry_Entries</p>
          </div>
        ) : (
          projects.map((project) => (
            <motion.div key={project.id} variants={stagger.item} className="bg-[#050505] hover:bg-white/[0.02] transition-colors group">
              <div className="flex flex-col lg:flex-row lg:items-center px-8 py-8 gap-8">
                {/* ID + Client Index */}
                <div className="hidden xl:block min-w-[100px]">
                  <span className="text-[10px] font-mono text-zinc-800 uppercase tracking-widest block mb-1">Ref_ID</span>
                  <span className="text-[11px] font-mono text-zinc-600 block truncate">{project.id.slice(0, 8)}...</span>
                </div>

                {/* Project Main */}
                <Link to={`/projects/${project.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-2 w-2 bg-accent/40 group-hover:bg-accent transition-colors" />
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight group-hover:text-accent transition-all">
                      {project.project_name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 ml-6">
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{project.client_name}</span>
                    <div className="h-1 w-1 bg-zinc-800" />
                    <span className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest italic">{project.industry}</span>
                  </div>
                </Link>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-4 lg:min-w-[400px] justify-end">
                  <StageBadge stage={project.current_stage} />
                  <StatusBadge status={project.current_status} className="min-w-[120px] justify-center" />

                  <div className="h-8 w-px bg-white/10 mx-2 hidden lg:block" />

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => openEditModal(project)}
                      className="h-10 w-10 flex items-center justify-center border border-white/[0.08] text-zinc-600 hover:text-white hover:border-white/20 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <Link
                      to={`/projects/${project.id}`}
                      className="h-10 w-10 flex items-center justify-center bg-white/[0.03] border border-white/[0.08] text-zinc-600 hover:text-accent hover:border-accent/40 transition-all"
                    >
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          {...revealProps as any}
          className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest leading-none mb-1">Index_Page</p>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none font-bold">{page} / {totalPages}</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest leading-none mb-1">Total_Registry</p>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none font-bold">{totalCount} SETS</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-10 w-10 flex items-center justify-center border border-white/[0.08] bg-white/[0.02] text-zinc-600 hover:text-white transition-all disabled:opacity-20"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-10 w-10 text-[10px] font-mono font-bold transition-all border ${pageNum === page
                      ? 'border-accent text-accent bg-accent/5'
                      : 'border-white/[0.05] text-zinc-700 hover:text-white hover:border-white/20'
                      }`}
                  >
                    {pageNum.toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-10 w-10 flex items-center justify-center border border-white/[0.08] bg-white/[0.02] text-zinc-600 hover:text-white transition-all disabled:opacity-20"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        title={editingProject ? `Sync_Override: ${editingProject.project_name.toUpperCase()}` : ''}
        maxWidth="max-w-md"
      >
        {editingProject && (
          <div className="space-y-8 pt-4">
            {/* Client Context */}
            <div className="flex items-center gap-4 p-5 bg-white/[0.02] border border-white/[0.05]">
              <div className="h-10 w-10 flex items-center justify-center bg-white/[0.05] border border-white/[0.05] text-xs font-mono text-white">
                {editingProject.client_name?.[0] || '?'}
              </div>
              <div>
                <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-1">Target_Operator</p>
                <p className="text-[11px] font-bold text-white uppercase tracking-widest">{editingProject.client_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Stage select */}
              <div className="col-span-2">
                <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-600 mb-3">
                  Milestone_Target
                </label>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value as ProjectStage)}
                  className="w-full bg-[#080808] border border-white/[0.08] px-4 py-3 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-accent/40 appearance-none cursor-pointer"
                >
                  {PROJECT_STAGES.map((s) => (
                    <option key={s} value={s} className="bg-[#050505]">
                      {s.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status select */}
              <div>
                <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-600 mb-3">
                  System_Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                  className="w-full bg-[#080808] border border-white/[0.08] px-4 py-3 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-accent/40 appearance-none cursor-pointer"
                >
                  <option value="Active" className="bg-[#050505]">ACTIVE</option>
                  <option value="On Hold" className="bg-[#050505]">ON HOLD</option>
                  <option value="Completed" className="bg-[#050505]">COMPLETED</option>
                </select>
              </div>

              {/* Next update date */}
              <div>
                <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-600 mb-3">
                  Next_Sync_Target
                </label>
                <input
                  type="date"
                  value={editNextUpdateDate}
                  onChange={(e) => setEditNextUpdateDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#080808] border border-white/[0.08] px-4 py-3 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-accent/40"
                />
              </div>
            </div>

            {/* Estimated completion date */}
            <div>
              <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-600 mb-3">
                Final_Execution_ETA
              </label>
              <input
                type="date"
                value={editEstDate}
                onChange={(e) => setEditEstDate(e.target.value)}
                className="w-full bg-[#080808] border border-white/[0.08] px-4 py-3 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-accent/40"
              />
            </div>

            {/* Update message */}
            <div>
              <label className="block text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-600 mb-3">
                Update_Log_Entry
                {stageChanged && <span className="text-accent ml-2 text-[8px] tracking-[0.1em] underline">[ MANDATORY_FOR_STAGE_SHIFT ]</span>}
              </label>
              <textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                rows={4}
                placeholder={
                  stageChanged
                    ? 'Input session summary for milestone shift...'
                    : 'Input latest development log details...'
                }
                className="w-full bg-[#080808] border border-white/[0.08] px-5 py-4 text-[11px] font-mono text-zinc-300 placeholder:text-zinc-800 focus:outline-none focus:border-accent/40 resize-none"
              />
            </div>

            {/* Error Zone */}
            {editError && (
              <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/10">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest">{editError}</p>
              </div>
            )}

            {/* Global Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => setEditingProject(null)}
              >
                Abort
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                loading={saving}
                onClick={handleSaveEdit}
              >
                Execute_Sync
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
    <div className={`
        relative overflow-hidden p-8 border-white/[0.05] border-r border-b h-full group
        bg-[#050505] hover:bg-white/[0.01] transition-all duration-700
    `}>
      <div className="flex flex-col justify-between h-full relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className={`h-1.5 w-1.5 ${accent ? 'bg-accent' : 'bg-zinc-800'}`} />
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-zinc-700 group-hover:text-zinc-500 transition-colors">
              {label}
            </p>
          </div>
          <p className="text-5xl font-display font-black text-white leading-none tracking-tighter">
            {value.toString().padStart(2, '0')}
          </p>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <div className={`h-10 w-10 flex items-center justify-center border border-white/[0.06] ${accent ? 'text-accent border-accent/20' : 'text-zinc-800'}`}>
            <Icon size={16} strokeWidth={accent ? 2 : 1.5} />
          </div>
          <div className="text-[8px] font-mono text-zinc-900 uppercase tracking-[0.2em] select-none">Metric_Reference_v1</div>
        </div>
      </div>
    </div>
  );
}
