// ─── Skeleton Loaders ─────────────────────────────────
// Premium shimmer skeletons for loading states.
// Matches the dark glassmorphism design system.

import { cn } from '@/lib/utils';

// ─── Base Skeleton Pulse ─────────────────────────────

function Bone({ className, style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-white/[0.06]',
        className
      )}
      style={style}
    />
  );
}

// ─── Dashboard Card Skeleton ─────────────────────────

export function DashboardCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[rgba(12,12,14,0.55)] border border-white/[0.07] p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Bone className="h-3 w-24" />
          <Bone className="h-8 w-12" />
        </div>
        <Bone className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Project Card Skeleton ───────────────────────────

export function ProjectCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[rgba(12,12,14,0.55)] border border-white/[0.07] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <Bone className="h-2.5 w-16" />
          <Bone className="h-5 w-48" />
        </div>
        <Bone className="h-8 w-8 rounded-full" />
      </div>

      {/* Stage progress dots */}
      <div className="mt-5 flex items-center gap-1.5">
        {[8, 8, 10, 6].map((w, i) => (
          <Bone key={i} className="h-1.5 rounded-full" style={{ width: `${w * 4}px` }} />
        ))}
      </div>

      {/* Bottom row */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bone className="h-5 w-24 rounded-full" />
          <Bone className="h-5 w-16 rounded-full" />
        </div>
        <Bone className="h-3 w-20" />
      </div>
    </div>
  );
}

// ─── Dashboard Page Skeleton ─────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Bone className="h-8 w-64" />
          <Bone className="h-4 w-48" />
        </div>
        <Bone className="h-10 w-36 rounded-full" />
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>

      {/* Projects header */}
      <div className="mt-12 flex items-center justify-between mb-6">
        <Bone className="h-6 w-32" />
        <Bone className="h-3 w-16" />
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Project Detail Skeleton ─────────────────────────

export function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Back button */}
      <Bone className="h-4 w-32 mb-6" />

      {/* Header */}
      <div className="space-y-3">
        <Bone className="h-3 w-20" />
        <Bone className="h-8 w-72" />
        <Bone className="h-4 w-full max-w-lg" />
      </div>

      {/* Pipeline */}
      <div className="mt-10 relative overflow-hidden rounded-2xl bg-[rgba(12,12,14,0.55)] border border-white/[0.07] p-8">
        <Bone className="h-3 w-28 mb-8" />
        <div className="hidden sm:flex items-center justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center" style={{ width: '25%' }}>
              <Bone className="h-10 w-10 rounded-full" />
              <Bone className="h-2.5 w-20 mt-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl bg-[rgba(12,12,14,0.55)] border border-white/[0.07] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bone className="h-3.5 w-3.5 rounded" />
              <Bone className="h-2.5 w-16" />
            </div>
            <Bone className="h-4 w-full" />
          </div>
        ))}
      </div>

      {/* Timeline + Actions */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Bone className="h-5 w-36 mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl bg-[rgba(12,12,14,0.55)] border border-white/[0.07] p-4">
              <div className="flex items-center justify-between mb-2">
                <Bone className="h-2.5 w-24" />
                <Bone className="h-2.5 w-16" />
              </div>
              <Bone className="h-4 w-full mt-2" />
              <Bone className="h-4 w-3/4 mt-1" />
              <Bone className="h-2.5 w-20 mt-3" />
            </div>
          ))}
        </div>

        <div>
          <Bone className="h-5 w-20 mb-4" />
          <div className="relative overflow-hidden rounded-2xl bg-[rgba(12,12,14,0.55)] border border-white/[0.07] p-5 space-y-4">
            <Bone className="h-10 w-full rounded-xl" />
            <Bone className="h-px w-full" />
            <Bone className="h-3 w-24" />
            <Bone className="h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Table Skeleton ────────────────────────────

export function AdminProjectRowSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[rgba(12,12,14,0.55)] border border-white/[0.07] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Bone className="h-9 w-9 rounded-full flex-shrink-0" />
          <div className="min-w-0 space-y-1.5 flex-1">
            <Bone className="h-4 w-48" />
            <Bone className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          <Bone className="h-5 w-24 rounded-full" />
          <Bone className="h-5 w-16 rounded-full" />
          <Bone className="hidden sm:block h-3 w-20" />
          <Bone className="h-7 w-7 rounded-lg" />
          <Bone className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Header */}
      <div className="space-y-2">
        <Bone className="h-8 w-40" />
        <Bone className="h-4 w-48" />
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <DashboardCardSkeleton key={i} />
        ))}
      </div>

      {/* Search bar */}
      <div className="mt-10 space-y-4">
        <Bone className="h-10 w-full rounded-xl" />
        <div className="flex items-center justify-between">
          <Bone className="h-5 w-28" />
          <div className="flex gap-2">
            <Bone className="h-7 w-24 rounded-lg" />
            <Bone className="h-7 w-24 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="mt-4 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <AdminProjectRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
