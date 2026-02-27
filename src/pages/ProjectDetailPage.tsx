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

const revealProps = {
  initial: { opacity: 0, y: 30, skewY: 1.5 },
  animate: { opacity: 1, y: 0, skewY: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } as any
};

const stagger = {
  container: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } as any },
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

      <div className="mx-auto max-w-7xl px-8 py-16">
        {/* Navigation / Metadata Row */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12"
        >
          <Link
            to={user?.isAdmin ? '/admin' : '/dashboard'}
            className="group flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 hover:text-white transition-colors duration-500"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            cd ../Return
          </Link>
          <div className="flex items-center gap-4 text-[9px] font-mono text-zinc-700">
            <span className="uppercase tracking-widest hidden sm:block">ID: {project.id.slice(0, 8)}</span>
            <span className="h-1 w-1 rounded-full bg-zinc-800 hidden sm:block" />
            <span className="uppercase tracking-widest">Modified: {new Date(project.updated_at).toLocaleDateString()}</span>
          </div>
        </motion.div>

        {/* Header Block */}
        <motion.div
          {...revealProps}
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8 pb-8 border-b border-white/[0.05]">
            <div className="max-w-3xl">
              {project.industry && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-px w-6 bg-accent" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-accent/80">{project.industry}</span>
                </div>
              )}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white leading-[0.85] tracking-tighter uppercase italic">
                {project.project_name}
              </h1>
            </div>
            <div className="flex flex-col items-start md:items-end gap-4">
              <StatusBadge status={project.current_status} />
              <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                Priority // High-Alpha
              </div>
            </div>
          </div>
          {project.description && (
            <p className="text-xl text-zinc-500 max-w-4xl font-sans leading-relaxed mt-4">
              {project.description}
            </p>
          )}
        </motion.div>

        {/* Pipeline - Steel Track Refactor */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <GlassCard hover={false} accentTop className="p-10 border-white/[0.12]">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <Rocket size={14} className="text-accent" />
                <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em]">Development.Vitals / Stage: {currentIdx + 1}</span>
              </div>
              <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest hidden sm:block">Realtime_Telemetry_Active</div>
            </div>

            {/* Desktop pipeline */}
            <div className="hidden sm:block">
              <div className="flex items-start justify-between relative px-4">
                <div className="absolute top-5 left-10 right-10 h-[1px] bg-white/[0.1]" />
                <div
                  className="absolute top-5 left-10 h-[2px] bg-accent transition-all duration-[1500ms] "
                  style={{
                    width: `${Math.min(100, (currentIdx / (PROJECT_STAGES.length - 1)) * 90)}%`,
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
                      transition={{ duration: 0.8, delay: 0.4 + idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col items-center relative z-10 w-1/4"
                    >
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-none border-2 transition-all duration-700 ${isCompleted
                          ? 'border-accent/40 bg-accent/5 text-accent/60'
                          : isCurrent
                            ? 'border-accent bg-accent/10 text-accent shadow-[0_0_30px_rgba(229,9,20,0.2)]'
                            : 'border-white/[0.08] bg-zinc-950 text-zinc-800'
                          }`}
                      >
                        {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                      </div>

                      <p
                        className={`mt-5 text-[10px] font-display font-bold uppercase tracking-widest transition-colors text-center leading-tight max-w-[120px] ${isCurrent
                          ? 'text-white'
                          : 'text-zinc-600'
                          }`}
                      >
                        {stage}
                      </p>

                      {isCurrent && (
                        <div className="mt-2 h-1 w-1 rounded-full bg-accent animate-pulse" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Mobile pipeline */}
            <div className="sm:hidden space-y-2">
              {PROJECT_STAGES.map((stage, idx) => {
                const Icon = STAGE_ICONS[stage];
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div
                    key={stage}
                    className={`flex items-center gap-4 px-4 py-4 transition-all ${isCurrent
                      ? 'bg-white/[0.03] border border-white/[0.08]'
                      : 'opacity-40'
                      }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center border ${isCompleted || isCurrent
                        ? 'border-accent/40 text-accent'
                        : 'border-white/[0.1] text-zinc-800'
                        }`}
                    >
                      {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                    </div>
                    <span
                      className={`text-xs font-mono font-bold uppercase tracking-widest ${isCurrent ? 'text-white' : 'text-zinc-600'
                        }`}
                    >
                      {stage}
                    </span>
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
          className="mb-16 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-4 bg-white/[0.05] border border-white/[0.05]"
        >
          <motion.div variants={stagger.item} className="h-full">
            <InfoCard icon={Target} label="Project.Goals" value={project.goals} />
          </motion.div>
          <motion.div variants={stagger.item} className="h-full">
            <InfoCard icon={Users} label="Target.Demographics" value={project.target_audience} />
          </motion.div>
          <motion.div variants={stagger.item} className="h-full">
            <InfoCard icon={DollarSign} label="Allocated.Capital" value={project.budget_range} />
          </motion.div>
          <motion.div variants={stagger.item} className="h-full">
            <InfoCard icon={Calendar} label="Phase.Deadline" value={formatDate(project.deadline)} />
          </motion.div>
        </motion.div>

        {/* Timeline + Actions */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 mb-20">
          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] } as any}
            className="lg:col-span-8"
          >
            <div className="flex items-center gap-4 mb-10 pb-4 border-b border-white/[0.05]">
              <h2 className="text-xs font-mono font-bold uppercase tracking-[0.4em] text-white whitespace-nowrap">
                Activity.Log
              </h2>
              <div className="h-px w-full bg-white/[0.03]" />
            </div>

            {updates.length === 0 ? (
              <GlassCard hover={false} className="py-20 text-center border-dashed">
                <Clock size={20} className="mx-auto text-zinc-800 mb-4" />
                <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-600 font-bold">Waiting for input_stream</p>
                <p className="mt-2 text-xs text-zinc-700 max-w-[180px] mx-auto leading-relaxed">
                  Project history initialization pending next development cycle.
                </p>
              </GlassCard>
            ) : (
              <div className="space-y-12 relative">
                {/* Vertical track line */}
                <div className="absolute left-[7px] top-4 bottom-4 w-px bg-white/[0.03]" />

                {grouped.map((group) => (
                  <div key={group.label} className="relative">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-[2px] w-4 bg-zinc-800" />
                      <p className="text-[9px] font-mono font-bold uppercase tracking-[0.4em] text-zinc-600">
                        {group.label} / HISTORY
                      </p>
                    </div>

                    <div className="space-y-6">
                      {group.items.map((update, idx) => (
                        <motion.div
                          key={update.id}
                          {...revealProps}
                          transition={{ duration: 0.8, delay: 0.1 * idx, ease: [0.16, 1, 0.3, 1] } as any}
                          className="relative flex gap-8 pl-0 last:pb-0"
                        >
                          <div className="relative mt-2 flex-shrink-0 z-10">
                            <div className={`h-[15px] w-[15px] bg-surface border-2 flex items-center justify-center ${group.label === 'This Week' && idx === 0
                              ? 'border-accent'
                              : 'border-white/[0.05]'
                              }`}>
                              <div className={`h-1 w-1 ${group.label === 'This Week' && idx === 0 ? 'bg-accent animate-pulse' : 'bg-zinc-800'}`} />
                            </div>
                          </div>
                          <GlassCard hover={false} className="flex-1 p-6 border-white/[0.06]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                              {update.updated_stage ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-1 w-1 bg-accent/40" />
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white">
                                    {update.updated_stage}
                                  </span>
                                </div>
                              ) : <div />}
                              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest bg-white/[0.03] px-2 py-1">
                                {formatRelative(update.updated_at)}
                              </span>
                            </div>
                            <p className="text-[13px] text-zinc-400 leading-relaxed font-sans">
                              {update.update_message}
                            </p>
                            <div className="mt-6 flex items-center justify-between border-t border-white/[0.03] pt-4">
                              <div className="flex items-center gap-2">
                                <Users size={10} className="text-zinc-700" />
                                <span className="text-[9px] font-mono uppercase text-zinc-600 tracking-widest">Operator: {update.updated_by}</span>
                              </div>
                              <div className="text-[8px] font-mono text-zinc-800 uppercase tracking-widest">Encrypted_Transmission</div>
                            </div>
                          </GlassCard>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Actions sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] } as any}
            className="lg:col-span-4"
          >
            <div className="sticky top-12 space-y-8">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-xs font-mono font-bold uppercase tracking-[0.4em] text-white whitespace-nowrap">
                  Command.Set
                </h2>
                <div className="h-px w-full bg-white/[0.03]" />
              </div>

              <GlassCard hover={false} className="p-8 space-y-6 border-white/[0.1]">
                {/* Client Info (Admin only) */}
                {user?.isAdmin && (
                  <div className="pb-6 border-b border-white/[0.06]">
                    <p className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-accent/80 mb-4">
                      Primary_Contact
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center bg-white/[0.03] border border-white/[0.05] text-white text-xs font-mono">
                        {project.client_name?.[0] || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white uppercase tracking-wider truncate">{project.client_name}</p>
                        <p className="text-[9px] font-mono text-zinc-600 truncate mt-1">{project.client_email}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
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
                  {user?.isAdmin ? 'Deploy Update' : 'Initialize Request'}
                </Button>

                {/* Metadata Stack */}
                <div className="space-y-6 pt-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Next_Sync_Target</span>
                    <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                      {project.next_update_date ? formatDate(project.next_update_date) : 'Pending_Schedule'}
                    </span>
                  </div>

                  {project.estimated_completion_date && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">Final_Execution_ETA</span>
                      <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                        {formatDate(project.estimated_completion_date)}
                      </span>
                    </div>
                  )}

                  {project.additional_notes && (
                    <div className="pt-4 border-t border-white/[0.03]">
                      <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-2 block">Developer_Directives</span>
                      <p className="text-[11px] text-zinc-500 leading-relaxed font-sans mt-2 italic">
                        "{project.additional_notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Secondary Actions */}
                <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between">
                  <button
                    onClick={() => window.location.assign(reportHref)}
                    className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-700 hover:text-accent transition-colors"
                  >
                    <Bug size={10} />
                    Report_Anomaly
                  </button>
                  <div className="text-[8px] font-mono text-zinc-800">SECURE_CHANNEL_v1.0</div>
                </div>
              </GlassCard>

            </div>
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
