import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, FolderKanban, Zap, CalendarCheck, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
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
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } as any
};

const stagger = {
  container: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as any },
  },
};

// ─── CountUp Component ────────────────────────────────
function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value <= 0) return;
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuad = (t: number) => t * (2 - t);
      setCount(Math.floor(easeOutQuad(progress) * value));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{count}</>;
}

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
        <GlassCard hover={false} className="flex flex-col items-center justify-center py-20 px-8 text-center ring-1 ring-accent/20">
          <p className="text-[10px] uppercase tracking-widest text-accent mb-2 font-mono">Sync Failure / Error</p>
          <p className="text-xl font-display text-white mb-4">{error}</p>
          <CopyDebugInfo error={error} endpoint="/projects" />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-16">
      <motion.div
        {...revealProps}
        className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20"
      >
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-10 bg-accent/70" />
            <span className="text-[12px] font-body text-white/55">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit' })}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-semibold text-white leading-[1.02] tracking-[-0.02em]">
            {getGreeting()},<br />
            <span className="text-white/70">{firstName}.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-white/55 max-w-xl font-body leading-relaxed">
            A quick overview of your projects, timelines, and what needs attention.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-6">
          <div className="text-right hidden md:block">
            <div className="text-[11px] font-body text-white/45 mb-2">Status</div>
            <div className="flex items-center justify-end gap-3 px-4 py-2.5 bg-white/[0.02] border border-white/[0.08] rounded-full backdrop-blur-xl">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-40"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></span>
              </div>
              <div className="text-[12px] text-white/80 font-body font-medium">All systems normal</div>
            </div>
          </div>
          <Link to="/projects/new">
            <Button size="lg" className="w-full md:w-auto h-16 px-10">
              <Plus size={18} />
              Initialize Project
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats - Broken Grid Layout */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-16"
      >
        <motion.div variants={stagger.item} className="md:col-span-5">
          <GlassCard accentTop className="p-10 h-full relative overflow-hidden group">
            <div className="absolute inset-0 shimmer-bg animate-shimmer opacity-[0.03] pointer-events-none" />
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-2">
                <FolderKanban size={14} className="text-accent-tier-1" />
                <div className="flex flex-col">
                  <span className="text-[12px] font-body text-white/55">Active projects</span>
                  <div className="card-title-underline" />
                </div>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl md:text-7xl font-display font-semibold text-white tracking-tight">
                  <CountUp value={stats.active} />
                </span>
                <span className="text-[12px] text-white/50 font-body whitespace-nowrap">in progress</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={stagger.item} className="md:col-span-4">
          <GlassCard className="p-10 h-full border-l-0 md:border-l border-white/[0.08] relative overflow-hidden group">
            <div className="absolute inset-0 shimmer-bg animate-shimmer opacity-[0.03] pointer-events-none" />
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-zinc-500" />
                <div className="flex flex-col">
                  <span className="text-[12px] font-body text-white/55">Current stage</span>
                  <div className="card-title-underline" />
                </div>
              </div>
              <div className="pt-2">
                <StageBadge stage={stats.currentStage} />
                <p className="mt-4 text-[12px] text-white/45 leading-relaxed font-body">
                  Based on your most advanced active project.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={stagger.item} className="md:col-span-3">
          <GlassCard className="p-10 h-full border-l-0 md:border-l border-white/[0.08] relative overflow-hidden group">
            <div className="absolute inset-0 shimmer-bg animate-shimmer opacity-[0.03] pointer-events-none" />
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-2">
                <CalendarCheck size={14} className="text-zinc-500" />
                <div className="flex flex-col">
                  <span className="text-[12px] font-body text-white/55">Next deadline</span>
                  <div className="card-title-underline" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-display font-medium text-white">
                  {stats.daysUntil !== null ? <CountUp value={stats.daysUntil} /> : '--'}
                </span>
                <span className="text-[12px] text-white/45 font-body">days</span>
              </div>
              <div className="h-[2px] w-full bg-white/[0.05] relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 bg-accent-tier-1 w-1/3" />
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
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-6">
            <h2 className="text-title font-display font-extrabold uppercase tracking-[0.15em] text-white">
              Project Archive
            </h2>
            <div className="text-caption font-mono text-zinc-500 bg-white/[0.03] px-3 py-1.5 border border-white/[0.06] rounded">[{stats.total} total_items]</div>
          </div>
          <div className="text-caption font-mono text-zinc-500 uppercase tracking-[0.25em] hidden sm:block">
            Sort: Chronological // 0xDESC
          </div>
        </div>

        {projectList.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={stagger.container}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-px bg-white/[0.05] border border-white/[0.05] relative overflow-hidden"
          >
            <div className="absolute inset-0 industrial-grid opacity-40 pointer-events-none" />
            {projectList.map((project) => (
              <motion.div key={project.id} variants={stagger.item} className="relative z-10 transition-colors hover:bg-white/[0.02]">
                <ProjectCard project={project} />
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
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
                <span className="text-caption font-medium uppercase tracking-[0.2em] text-zinc-500">
                  {project.industry}
                </span>
              )}
            </div>
            <h3 className="text-base font-display font-semibold text-white tracking-tight group-hover:text-accent-tier-1 transition-colors duration-300 truncate">
              {project.project_name}
            </h3>
          </div>
          <div className="rounded-full border border-white/[0.06] p-2 text-zinc-600 group-hover:border-accent-tier-1/20 group-hover:text-accent-tier-1 transition-all duration-300">
            <ArrowUpRight size={14} />
          </div>
        </div>

        {/* Stage progress dots */}
        <div className="mt-5 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          {PROJECT_STAGES.map((stage, idx) => (
            <div key={stage} className="flex items-center gap-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${idx < stageIdx
                  ? 'w-8 bg-accent-tier-3/60'
                  : idx === stageIdx
                    ? 'w-10 bg-accent-tier-1 shadow-[0_0_10px_rgba(255,51,1,0.3)]'
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
          <span className="text-caption text-zinc-500">
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
      <h3 className="text-title font-display font-semibold text-white tracking-tight">
        No active projects yet
      </h3>
      <p className="mt-2 text-sm font-body text-zinc-500 max-w-xs leading-relaxed">
        Let&apos;s build something iconic. Start a project and watch it come to life.
      </p>
      <Link
        to="/projects/new"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:shadow-[0_0_25px_rgba(229,9,20,0.3)] transition-shadow"
      >
        <Plus size={16} />
        Request a Project
      </Link>
    </GlassCard>
  );
}
