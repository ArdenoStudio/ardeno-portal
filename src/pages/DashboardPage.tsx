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

const revealProps = {
  initial: { opacity: 0, y: 30, skewY: 1.5 },
  animate: { opacity: 1, y: 0, skewY: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } as any
};

const stagger = {
  container: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } as any },
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

  const firstName = user?.name?.split(' ')[0] || 'Member';

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-8 py-16">
        <GlassCard hover={false} className="flex flex-col items-center justify-center py-20 px-8 text-center ring-1 ring-red-500/20">
          <p className="text-[10px] uppercase tracking-widest text-red-400 mb-2 font-mono">Sync Failure / Error</p>
          <p className="text-xl font-display text-white mb-4">{error}</p>
          <CopyDebugInfo error={error} endpoint="/projects" />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-16">
      {/* Header - Staggered Slide */}
      <motion.div
        {...revealProps}
        className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16"
      >
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-accent" />
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-600">Overview / {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-white leading-[0.9] tracking-tighter">
            {getGreeting()},<br />
            <span className="text-accent">{firstName}.</span>
          </h1>
          <p className="mt-6 text-base text-zinc-500 max-w-md font-sans">
            Your creative initiatives are scaling. Currently monitoring {stats.active} active trajectories.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Global Status</div>
            <div className="text-xs text-white uppercase font-bold tracking-widest mt-1">Systems Nominal</div>
          </div>
          <Link to="/projects/new" className="group">
            <div className="relative">
              <div className="absolute inset-0 bg-accent blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative flex items-center gap-3 bg-accent text-white px-8 py-4 font-display font-bold uppercase tracking-widest text-[11px] overflow-hidden">
                <Plus size={16} />
                Initialize Project
              </div>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Stats - Broken Grid Layout */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-12 gap-1 mb-16"
      >
        <motion.div variants={stagger.item} className="md:col-span-5">
          <GlassCard accentTop className="p-10 h-full">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <FolderKanban size={14} className="text-accent" />
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Active.Trajectories</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-7xl font-display font-black text-white">{stats.active}</span>
                <span className="text-xs text-zinc-600 uppercase font-bold tracking-widest whitespace-nowrap">Projects in flight</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={stagger.item} className="md:col-span-4">
          <GlassCard className="p-10 h-full border-l-0 md:border-l border-white/[0.08]">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-zinc-500" />
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Peak.Stage</span>
              </div>
              <div className="pt-2">
                <StageBadge stage={stats.currentStage} />
                <p className="mt-4 text-[10px] text-zinc-600 leading-relaxed font-mono italic">
                  Level {STAGE_INDEX[stats.currentStage] + 1} integration reached.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={stagger.item} className="md:col-span-3">
          <GlassCard className="p-10 h-full border-l-0 md:border-l border-white/[0.08]">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <CalendarCheck size={14} className="text-zinc-500" />
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em]">Critical.Days</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-display font-medium text-white">{stats.daysUntil !== null ? stats.daysUntil : '--'}</span>
                <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Days</span>
              </div>
              <div className="h-[2px] w-full bg-white/[0.05] relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 bg-accent w-1/3" />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Projects Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="flex items-end justify-between mb-10 pb-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-mono font-bold uppercase tracking-[0.4em] text-white">
              Project Archive
            </h2>
            <div className="text-[10px] font-mono text-zinc-600">[{stats.total} total_items]</div>
          </div>
          <div className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest hidden sm:block">
            Sort: Chronological / DESC
          </div>
        </div>

        {projectList.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={stagger.container}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-px bg-white/[0.05] border border-white/[0.05]"
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
