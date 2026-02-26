import { cn, getStageColor, getStatusColor } from '@/lib/utils';
import type { ProjectStage, ProjectStatus } from '@/types';

interface StageBadgeProps {
  stage: ProjectStage;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-3 px-4 py-1.5',
        'text-[9px] font-mono font-bold uppercase tracking-[0.4em]',
        'bg-[#080808] border border-white/[0.08] relative group overflow-hidden',
        getStageColor(stage),
        className
      )}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-current opacity-70" />
      <span className="relative z-10">{stage}</span>
    </span>
  );
}

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-3 px-5 py-2',
        'text-[10px] font-mono font-black uppercase tracking-[0.5em]',
        'bg-[#050505] border border-white/[0.05] relative',
        getStatusColor(status),
        className
      )}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-current" />
      <span className="relative z-10">{status}</span>
    </span>
  );
}
