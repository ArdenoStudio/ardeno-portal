import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, FolderKanban, Zap, CalendarCheck, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { StageBadge, StatusBadge } from '@/components/ui/StatusBadge';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { EASING } from '@/lib/constants';
import { formatRelative } from '@/lib/utils';
import { useApi } from '@/hooks/useApi';
import { PROJECT_STAGES, STAGE_INDEX, type ProjectStage, type Project } from '@/types';
import { CopyDebugInfo } from '@/components/ui/CopyDebugInfo';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const stagger = {
  container: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASING } },
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: projects, loading, error } = useApi<Project[]>('/projects');

  const projectList: Project[] = Array.isArray(projects) ? projects : [];

  const stats = useMemo(() => {
    const active = projectList.filter((p) => p.current_status === 'Active').length;
    const completed = projectList.filter((p) => p.current_status === 'Completed').length;
    const activeProjects = projectList.filter((p) => p.current_status === 'Active');
    let currentStage: ProjectStage = 'Discovery & Strategy';
    let maxIdx = -1;
    for (const p of activeProjects) {
      const idx = STAGE_INDEX[p.current_stage];
      if (idx > maxIdx) {
        maxIdx = idx;
        currentStage = p.current_stage;
      }
    }
    const upcoming = activeProjects
      .filter((p) => p.deadline)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    const nearestDeadline = upcoming[0]?.deadline;
    const daysUntil = nearestDeadline
      ? Math.max(0, Math.ceil((new Date(nearestDeadline).getTime() - Date.now()) / 86400000))
      : null;

    return { active, completed, currentStage, daysUntil, total: projectList.length };
  }, [projectList]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  // ── Skeleton loading state ────────────────────────────
  if (loading) return <DashboardSkeleton />;

  // ── Error state ───────────────────────────────────────
  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <GlassCard hover={false} className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <p className="text-sm text-red-400 mb-2">Failed to load projects</p>
          <p className="text-xs text-zinc-600">{error}</p>
          <CopyDebugInfo error={error} endpoint="/projects" />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASING }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-semibold text-white sm:text-3xl">
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Here&apos;s what&apos;s happening with your projects
          </p>
        </div>
        <Link to="/projects/new">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(255,51,1,0.25)] hover:shadow-[0_0_30px_rgba(255,51,1,0.4)] transition-shadow"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Project</span>
          </motion.button>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <motion.div variants={stagger.item}>
          <GlassCard accentTop className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500">
                  Active Projects
                </p>
                <p className="mt-2 text-3xl font-display font-bold text-white">
                  {stats.active}
                </p>
              </div>
              <div className="rounded-xl bg-accent/10 p-2.5">
                <FolderKanban size={18} className="text-accent" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={stagger.item}>
          <GlassCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500">
                  Furthest Stage
                </p>
                <div className="mt-3">
                  <StageBadge stage={stats.currentStage} />
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.05] p-2.5">
                <Zap size={18} className="text-zinc-400" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={stagger.item}>
          <GlassCard className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500">
                  Next Milestone
                </p>
                <p className="mt-2 text-3xl font-display font-bold text-white">
                  {stats.daysUntil !== null ? stats.daysUntil : '\u2014'}
                </p>
                {stats.daysUntil !== null && (
                  <p className="text-[11px] text-zinc-600">days remaining</p>
                )}
              </div>
              <div className="rounded-xl bg-white/[0.05] p-2.5">
                <CalendarCheck size={18} className="text-zinc-400" />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Projects */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-12"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-display font-semibold text-white">
            Your Projects
          </h2>
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-600">
            {stats.total} total
          </span>
        </div>

        {projectList.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={stagger.container}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {projectList.map((project) => (
              <motion.div key={project.id} variants={stagger.item}>
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const stageIdx = STAGE_INDEX[project.current_stage];

  return (
    <Link to={`/projects/${project.id}`}>
      <GlassCard className="group p-6 cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-3">
              {project.industry && (
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
                  {project.industry}
                </span>
              )}
            </div>
            <h3 className="text-base font-display font-semibold text-white group-hover:text-accent transition-colors duration-300 truncate">
              {project.project_name}
            </h3>
          </div>
          <div className="rounded-full border border-white/[0.06] p-2 text-zinc-600 group-hover:border-accent/20 group-hover:text-accent transition-all duration-300">
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Stage progress dots */}
        <div className="mt-5 flex items-center gap-1.5">
          {PROJECT_STAGES.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${idx < stageIdx
                  ? 'w-8 bg-accent/60'
                  : idx === stageIdx
                    ? 'w-10 bg-accent'
                    : 'w-6 bg-white/[0.08]'
                  }`}
              />
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StageBadge stage={project.current_stage} />
            <StatusBadge status={project.current_status} />
          </div>
          <span className="text-[11px] text-zinc-600">
            {formatRelative(project.updated_at)}
          </span>
        </div>
      </GlassCard>
    </Link>
  );
}

// ─── Empty State ──────────────────────────────────────

function EmptyState() {
  return (
    <GlassCard hover={false} className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 h-16 w-16 rounded-2xl bg-accent/10 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
          <Sparkles size={24} className="text-zinc-500" />
        </div>
      </div>
      <h3 className="text-base font-display font-semibold text-white">
        No active projects yet
      </h3>
      <p className="mt-2 text-sm text-zinc-500 max-w-xs">
        Let&apos;s build something iconic. Start a project and watch it come to life.
      </p>
      <Link
        to="/projects/new"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:shadow-[0_0_25px_rgba(255,51,1,0.3)] transition-shadow"
      >
        <Plus size={16} />
        Request a Project
      </Link>
    </GlassCard>
  );
}
