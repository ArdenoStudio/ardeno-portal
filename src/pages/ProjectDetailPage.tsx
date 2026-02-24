import { useState, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  PenTool,
  Palette,
  Rocket,
  Check,
  Clock,
  Calendar,
  Target,
  Users,
  DollarSign,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle2,
  Plus,
  Bug,
  CalendarClock,
  Pencil,
  Edit2,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProjectDetailSkeleton } from '@/components/ui/Skeleton';
import { EASING } from '@/lib/constants';
import { formatDate, formatRelative } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useMilestoneCheck } from '@/hooks/useMilestoneCheck';
import { CopyDebugInfo } from '@/components/ui/CopyDebugInfo';
import { MilestoneMoment } from '@/components/ui/MilestoneMoment';
import {
  PROJECT_STAGES,
  STAGE_INDEX,
  type ProjectStage,
  type ProjectStatus,
  type Project,
  type ProjectUpdate,
} from '@/types';

const STAGE_ICONS: Record<ProjectStage, typeof Search> = {
  'Discovery & Strategy': Search,
  'UX & Wireframing': PenTool,
  'Visual Design': Palette,
  'Development & Launch': Rocket,
};

const stagger = {
  container: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASING } },
  },
};

// ─── Timeline Grouping ──────────────────────────────────

function groupUpdates(updates: ProjectUpdate[]) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const thisWeek: ProjectUpdate[] = [];
  const thisMonth: ProjectUpdate[] = [];
  const earlier: ProjectUpdate[] = [];

  for (const u of updates) {
    const d = new Date(u.updated_at);
    if (d >= weekAgo) thisWeek.push(u);
    else if (d >= monthAgo) thisMonth.push(u);
    else earlier.push(u);
  }

  return [
    { label: 'This Week', items: thisWeek },
    { label: 'This Month', items: thisMonth },
    { label: 'Earlier', items: earlier },
  ].filter((g) => g.items.length > 0);
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();

  const { data, loading, error, refetch } = useApi<{ project: Project; updates: ProjectUpdate[] }>(
    id ? `/projects/${id}` : null
  );

  const project = data?.project ?? null;
  const updates = data?.updates ?? [];

  // ── Milestone moment check (Moved to top to follow Rules of Hooks) ──
  const milestone = useMilestoneCheck(project?.id, project?.current_stage);

  // ── Request Update modal state ──────────────────────────
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateSending, setUpdateSending] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // ── Admin update state ──────────────────────────────────
  const [isAdminEditOpen, setIsAdminEditOpen] = useState(false);
  const [editStage, setEditStage] = useState<ProjectStage>('Discovery & Strategy');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('Active');
  const [editMessage, setEditMessage] = useState('');
  const [editEstDate, setEditEstDate] = useState('');
  const [editNextUpdateDate, setEditNextUpdateDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openAdminEdit = useCallback(() => {
    if (!project) return;
    setEditStage(project.current_stage);
    setEditStatus(project.current_status);
    setEditMessage('');
    setEditEstDate(project.estimated_completion_date || '');
    setEditNextUpdateDate(project.next_update_date || '');
    setEditError(null);
    setIsAdminEditOpen(true);
  }, [project]);

  const handleAdminSave = useCallback(async () => {
    if (!project) return;
    const stageChanged = editStage !== project.current_stage;
    if (stageChanged && !editMessage.trim()) {
      setEditError('An update message is required when changing the stage.');
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      await api.put(`/admin/projects/${project.id}`, {
        new_stage: editStage,
        new_status: editStatus,
        update_message: editMessage.trim() || undefined,
        estimated_completion_date: editEstDate || undefined,
        next_update_date: editNextUpdateDate || undefined,
      });
      await refetch();
      setIsAdminEditOpen(false);
      toast.success('Project updated');
    } catch (err: any) {
      setEditError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }, [project, editStage, editStatus, editMessage, editEstDate, editNextUpdateDate, refetch, toast]);

  const handleRequestUpdate = useCallback(async () => {
    if (!id || !updateMessage.trim()) return;
    setUpdateSending(true);
    setUpdateError(null);

    try {
      await api.post('/contact/request-update', {
        projectId: id,
        message: updateMessage.trim(),
      });
      setUpdateSuccess(true);
      setUpdateMessage('');
      toast.success('Request sent', 'Our team will get back to you shortly.');
      setTimeout(() => {
        setShowUpdateModal(false);
        setUpdateSuccess(false);
      }, 2000);
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'RATE_LIMITED') {
        setUpdateError('You can only request one update per hour per project. Please try again later.');
      } else {
        setUpdateError(err.message || 'Failed to send request');
        toast.error('Failed to send', err.message || 'Please try again.');
      }
    } finally {
      setUpdateSending(false);
    }
  }, [id, updateMessage, toast]);

  // ── Skeleton loading state ────────────────────────────
  if (loading) return <ProjectDetailSkeleton />;

  // ── Error state ─────────────────────────────────────────
  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <GlassCard hover={false} className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <AlertCircle size={24} className="text-red-400 mb-3" />
          <p className="text-sm text-red-400 mb-2">Failed to load project</p>
          <p className="text-xs text-zinc-600">{error}</p>
          <CopyDebugInfo error={error} endpoint={`/projects/${id}`} />
          <Link
            to={user?.isAdmin ? '/admin' : '/dashboard'}
            className="mt-6 text-sm text-accent hover:text-white transition-colors"
          >
            Go back
          </Link>
        </GlassCard>
      </div>
    );
  }

  if (!project) return <Navigate to="/dashboard" replace />;

  if (!user?.isAdmin && project.user_id !== user?.sub) {
    return <Navigate to="/dashboard" replace />;
  }

  const currentIdx = STAGE_INDEX[project.current_stage] ?? 0;
  const grouped = groupUpdates(updates);

  // ── Report Issue mailto ───────────────────────────────
  const reportSubject = encodeURIComponent(`Issue Report: ${project.project_name}`);
  const reportBody = encodeURIComponent(
    `Project: ${project.project_name}\nProject ID: ${project.id}\nUser: ${user?.email || ''}\n\nDescribe the issue:\n`
  );
  const reportHref = `mailto:support@ardeno.studio?subject=${reportSubject}&body=${reportBody}`;

  return (
    <>
      {/* Milestone interstitial */}
      {milestone.newStage && (
        <MilestoneMoment
          stage={milestone.newStage}
          visible={milestone.shouldShow}
          onDismiss={milestone.dismiss}
        />
      )}

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to={user?.isAdmin ? '/admin' : '/dashboard'}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft size={16} />
            Back to {user?.isAdmin ? 'Admin' : 'Dashboard'}
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASING }}
          className="mt-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {project.industry && (
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-600 mb-2">
                  {project.industry}
                </p>
              )}
              <h1 className="text-2xl font-display font-bold text-white sm:text-3xl">
                {project.project_name}
              </h1>
            </div>
            <StatusBadge status={project.current_status} />
          </div>
          {project.description && (
            <p className="mt-4 text-sm leading-relaxed text-zinc-400 max-w-2xl">
              {project.description}
            </p>
          )}
        </motion.div>

        {/* Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: EASING }}
          className="mt-10"
        >
          <GlassCard hover={false} accentTop className="p-6 sm:p-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500 mb-8">
              Project Pipeline
            </p>

            {/* Desktop pipeline */}
            <div className="hidden sm:block">
              <div className="flex items-start justify-between relative">
                <div className="absolute top-5 left-[12%] right-[12%] h-px bg-white/[0.06]" />
                <div
                  className="absolute top-5 left-[12%] h-px bg-accent/40 transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, (currentIdx / (PROJECT_STAGES.length - 1)) * 76)}%`,
                  }}
                />

                {PROJECT_STAGES.map((stage, idx) => {
                  const Icon = STAGE_ICONS[stage];
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <motion.div
                      key={stage}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + idx * 0.08 }}
                      className="flex flex-col items-center relative z-10"
                      style={{ width: '25%' }}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${isCompleted
                          ? 'border-accent/60 bg-accent/15 text-accent'
                          : isCurrent
                            ? 'border-accent bg-accent/20 text-accent shadow-[0_0_20px_rgba(255,51,1,0.3)]'
                            : 'border-white/[0.08] bg-white/[0.02] text-zinc-600'
                          }`}
                      >
                        {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                      </div>

                      <p
                        className={`mt-3 text-[10px] font-medium tracking-wide transition-colors text-center leading-tight ${isCurrent
                          ? 'text-accent'
                          : isCompleted
                            ? 'text-zinc-400'
                            : 'text-zinc-600'
                          }`}
                      >
                        {stage}
                      </p>

                      {isCurrent && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.2em] text-accent/60"
                        >
                          Current
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Mobile pipeline */}
            <div className="sm:hidden space-y-3">
              {PROJECT_STAGES.map((stage, idx) => {
                const Icon = STAGE_ICONS[stage];
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div
                    key={stage}
                    className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all ${isCurrent
                      ? 'bg-accent/10 border border-accent/20'
                      : isCompleted
                        ? 'opacity-60'
                        : 'opacity-30'
                      }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${isCompleted
                        ? 'bg-accent/20 text-accent'
                        : isCurrent
                          ? 'bg-accent/20 text-accent'
                          : 'bg-white/[0.04] text-zinc-600'
                        }`}
                    >
                      {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                    </div>
                    <span
                      className={`text-sm font-medium ${isCurrent ? 'text-accent' : isCompleted ? 'text-zinc-400' : 'text-zinc-600'
                        }`}
                    >
                      {stage}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto text-[9px] font-medium uppercase tracking-[0.2em] text-accent/60">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>

        {/* Info grid */}
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={stagger.item}>
            <InfoCard icon={Target} label="Goals" value={project.goals} />
          </motion.div>
          <motion.div variants={stagger.item}>
            <InfoCard icon={Users} label="Target Audience" value={project.target_audience} />
          </motion.div>
          <motion.div variants={stagger.item}>
            <InfoCard icon={DollarSign} label="Budget" value={project.budget_range} />
          </motion.div>
          <motion.div variants={stagger.item}>
            <InfoCard icon={Calendar} label="Deadline" value={formatDate(project.deadline)} />
          </motion.div>
        </motion.div>

        {/* Timeline + Actions */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <h2 className="text-base font-display font-semibold text-white mb-4">
              Activity Timeline
            </h2>

            {updates.length === 0 ? (
              <GlassCard hover={false} className="p-8 text-center">
                <Clock size={20} className="mx-auto text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-500">No updates yet</p>
                <p className="mt-1 text-xs text-zinc-700">
                  Activity will appear here as your project progresses.
                </p>
              </GlassCard>
            ) : (
              <div className="space-y-6">
                {grouped.map((group) => (
                  <div key={group.label}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600 mb-3 pl-8">
                      {group.label}
                    </p>
                    <div className="space-y-0">
                      {group.items.map((update, idx) => (
                        <div key={update.id} className="relative flex gap-4 pb-6 last:pb-0">
                          {idx < group.items.length - 1 && (
                            <div className="absolute left-[11px] top-8 bottom-0 w-px bg-white/[0.06]" />
                          )}
                          <div className="relative mt-1.5 flex-shrink-0">
                            <div className={`h-[9px] w-[9px] rounded-full border-2 ${group.label === 'This Week' && idx === 0
                              ? 'border-accent bg-accent/30'
                              : 'border-zinc-700 bg-zinc-800'
                              }`} />
                          </div>
                          <GlassCard hover={false} className="flex-1 p-4">
                            <div className="flex items-center justify-between mb-2">
                              {update.updated_stage && (
                                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-accent/70">
                                  {update.updated_stage}
                                </span>
                              )}
                              <span className="text-[10px] text-zinc-600">
                                {formatRelative(update.updated_at)}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed">
                              {update.update_message}
                            </p>
                            <p className="mt-2 text-[10px] text-zinc-600">
                              by {update.updated_by}
                            </p>
                          </GlassCard>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Actions sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-base font-display font-semibold text-white mb-4">
              Actions
            </h2>
            <GlassCard hover={false} className="p-5 space-y-4">
              {/* Client Info (Admin only) */}
              {user?.isAdmin && (
                <div className="pb-4 border-b border-white/[0.06]">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-accent/70 mb-2">
                    Client Details
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-semibold">
                      {project.client_name?.[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{project.client_name}</p>
                      <p className="text-[11px] text-zinc-600 truncate">{project.client_email}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => {
                  if (user?.isAdmin) {
                    openAdminEdit();
                  } else {
                    setShowUpdateModal(true);
                    setUpdateError(null);
                    setUpdateSuccess(false);
                    setUpdateMessage('');
                  }
                }}
              >
                {user?.isAdmin ? <Edit2 size={16} /> : <MessageSquare size={16} />}
                {user?.isAdmin ? 'Admin: Post Update' : 'Request Update'}
              </Button>

              {/* Next update date */}
              {project.next_update_date ? (
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600 mb-1">
                    Next Update
                  </p>
                  <p className="text-sm text-zinc-300">
                    Scheduled: {formatDate(project.next_update_date)}
                  </p>
                </div>
              ) : (
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600 mb-1">
                    Next Update
                  </p>
                  <p className="text-xs text-zinc-500">To be scheduled</p>
                </div>
              )}

              {project.estimated_completion_date && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600 mb-1">
                    Est. Completion
                  </p>
                  <p className="text-sm text-zinc-300">
                    {formatDate(project.estimated_completion_date)}
                  </p>
                </div>
              )}

              {project.last_updated_by && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600 mb-1">
                    Last Updated By
                  </p>
                  <p className="text-sm text-zinc-300">{project.last_updated_by}</p>
                </div>
              )}

              {project.additional_notes && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600 mb-1">
                    Notes
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {project.additional_notes}
                  </p>
                </div>
              )}

              {/* Report Issue */}
              <div className="pt-3 border-t border-white/[0.06]">
                <button
                  onClick={() => window.location.assign(reportHref)}
                  className="inline-flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors bg-transparent border-none p-0 cursor-pointer"
                >
                  <Bug size={12} />
                  Report an issue
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* ── Request Update Modal ───────────────────────────── */}
        <Modal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          title="Request Project Update"
          maxWidth="max-w-md"
        >
          {updateSuccess ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 size={24} className="text-emerald-400" />
              </div>
              <p className="text-sm text-white font-medium">Request sent!</p>
              <p className="mt-1 text-xs text-zinc-500">
                Our team will get back to you shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500 mb-2">
                  Message
                </label>
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  rows={4}
                  minLength={10}
                  maxLength={1000}
                  placeholder="What would you like an update on? (min 10 characters)"
                  className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-accent/40 transition-colors resize-none"
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[10px] text-zinc-700">
                    {updateMessage.length < 10
                      ? `${10 - updateMessage.length} more characters needed`
                      : '\u00A0'}
                  </p>
                  <p className="text-[10px] text-zinc-700">
                    {updateMessage.length}/1000
                  </p>
                </div>
              </div>

              {updateError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                  <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-300">{updateError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  variant="ghost"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowUpdateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  loading={updateSending}
                  disabled={updateMessage.trim().length < 10}
                  onClick={handleRequestUpdate}
                >
                  <Send size={14} />
                  Send Request
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* ── Admin Management Modal ─────────────────────────── */}
        <Modal
          isOpen={isAdminEditOpen}
          onClose={() => setIsAdminEditOpen(false)}
          title={project ? `Admin: ${project.project_name}` : ''}
          maxWidth="max-w-md"
        >
          <div className="space-y-5">
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

            {/* Next update date */}
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
            </div>

            {/* Update message */}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500 mb-2">
                <Plus size={10} className="inline mr-1" />
                Add Update Message
                {editStage !== project?.current_stage && (
                  <span className="text-accent ml-1">* Required</span>
                )}
              </label>
              <textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                rows={3}
                placeholder="What changed? This will appear in the timeline..."
                className="w-full rounded-xl bg-white/[0.05] border border-white/[0.08] px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-accent/40 transition-colors resize-none"
              />
            </div>

            {editError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
                <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300">{editError}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setIsAdminEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                loading={saving}
                onClick={handleAdminSave}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}

// ─── Info Card ────────────────────────────────────────

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string | null;
}) {
  return (
    <GlassCard hover={false} className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-zinc-600" />
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
          {label}
        </p>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">
        {value || '\u2014'}
      </p>
    </GlassCard>
  );
}
