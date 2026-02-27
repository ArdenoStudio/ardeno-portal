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
        'inline-flex items-center gap-2 px-3 py-1',
        'text-[9px] font-mono font-medium uppercase tracking-[0.3em]',
        'bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm relative overflow-hidden rounded-sm',
        getStageColor(stage),
        className
      )}
    >
      <span className="relative z-10">{stage}</span>
    </span>
  );
}

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isActive = status === 'Active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-4 py-1.5',
        'text-[10px] font-mono font-bold uppercase tracking-[0.4em]',
        'bg-white/[0.03] border border-white/[0.1] relative overflow-hidden rounded-sm',
        getStatusColor(status),
        className
      )}
    >
      {isActive && (
        <span className="relative flex h-1.5 w-1.5 mr-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
        </span>
      )}
      <span className="relative z-10">{status}</span>
    </span>
  );
}
