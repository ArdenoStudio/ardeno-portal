import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import type { ProjectStage, ProjectStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatRelative(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  // If less than an hour ago, show "X mins ago"
  if (diffInHours < 1) {
    return formatDistanceToNow(d, { addSuffix: true });
  }

  // If today, show "Today at 2:30 PM"
  if (d.toDateString() === now.toDateString()) {
    return `Today at ${format(d, 'h:mm a')}`;
  }

  // If yesterday, show "Yesterday at 2:30 PM"
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${format(d, 'h:mm a')}`;
  }

  // Otherwise, show "Oct 12 at 2:30 PM"
  return format(d, 'MMM d at h:mm a');
}

export function getStageColor(stage: ProjectStage): string {
  const colors: Record<ProjectStage, string> = {
    'Discovery & Strategy': 'text-amber-500 bg-amber-500/5 border-amber-500/10',
    'UX & Wireframing': 'text-fuchsia-500 bg-fuchsia-500/5 border-fuchsia-500/10',
    'Visual Design': 'text-blue-500 bg-blue-500/5 border-blue-500/10',
    'Development & Launch': 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
  };
  return colors[stage];
}

export function getStatusColor(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    Active: 'text-accent bg-accent/5 border-accent/10',
    'On Hold': 'text-zinc-600 bg-white/5 border-white/5',
    Completed: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
  };
  return colors[status];
}

export function getStageIcon(stage: ProjectStage): string {
  const icons: Record<ProjectStage, string> = {
    'Discovery & Strategy': '01',
    'UX & Wireframing': '02',
    'Visual Design': '03',
    'Development & Launch': '04',
  };
  return icons[stage];
}
