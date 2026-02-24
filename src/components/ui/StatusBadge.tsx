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
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1',
        'text-[10px] font-medium uppercase tracking-[0.15em]',
        getStageColor(stage),
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {stage}
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
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1',
        'text-[10px] font-medium uppercase tracking-[0.15em]',
        getStatusColor(status),
        className
      )}
    >
      {status}
    </span>
  );
}
