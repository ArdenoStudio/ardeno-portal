// ─── Skeleton Loaders ─────────────────────────────────
// Premium shimmer skeletons for loading states.
// Matches the dark glassmorphism design system.

import { cn } from '@/lib/utils';

// ─── Base Skeleton Pulse ─────────────────────────────

function Bone({ className, style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-white/[0.04] border border-white/[0.05]',
        className
      )}
      style={style}
    />
  );
}

// ─── Dashboard Card Skeleton ─────────────────────────

export function DashboardCardSkeleton() {
  return (
    <div className="relative overflow-hidden bg-white/[0.01] border border-white/[0.05] p-8 h-full">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Bone className="h-1.5 w-1.5 bg-zinc-800" />
          <Bone className="h-2 w-20" />
        </div>
        <Bone className="h-12 w-16" />
        <div className="mt-8 flex items-center justify-between">
          <Bone className="h-10 w-10 border border-white/[0.05]" />
          <Bone className="h-2 w-24 opacity-30" />
        </div>
      </div>
    </div>
  );
}

// ─── Project Card Skeleton ───────────────────────────

export function ProjectCardSkeleton() {
  return (
    <div className="relative overflow-hidden bg-[#050505] border border-white/[0.05] p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <Bone className="h-2 w-2 bg-accent/20" />
            <Bone className="h-6 w-48" />
          </div>
          <div className="flex items-center gap-4 ml-5">
            <Bone className="h-2 w-24 opacity-50" />
            <div className="h-1 w-1 bg-zinc-800" />
            <Bone className="h-2 w-16 opacity-30" />
          </div>
        </div>
        <Bone className="h-10 w-10 border border-white/[0.05]" />
      </div>

      {/* Pipeline mock */}
      <div className="mt-10 flex items-center gap-1 h-1 bg-white/[0.03]">
        <div className="h-full bg-accent/20 w-1/3" />
      </div>

      {/* Bottom row */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Bone className="h-6 w-28" />
          <Bone className="h-6 w-20" />
        </div>
        <Bone className="h-2 w-24 opacity-30" />
      </div>
    </div>
  );
}

// ─── Dashboard Page Skeleton ─────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-8 py-16 lg:py-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Bone className="h-px w-8" />
            <Bone className="h-2 w-32" />
          </div>
          <Bone className="h-16 w-96" />
          <Bone className="h-4 w-full max-w-lg" />
        </div>
        <Bone className="h-14 w-48" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-white/[0.05] border border-white/[0.05] mb-20">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="md:col-span-3 h-48 bg-[#050505]">
            <DashboardCardSkeleton />
          </div>
        ))}
      </div>

      {/* Projects header */}
      <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/[0.03]">
        <Bone className="h-3 w-40" />
        <Bone className="h-2 w-24" />
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 gap-1 bg-white/[0.05] border border-white/[0.05]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#050505]">
            <ProjectCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Project Detail Skeleton ─────────────────────────

export function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-8 py-16 lg:py-24">
      {/* Back button */}
      <Bone className="h-10 w-48 mb-16" />

      {/* Header */}
      <div className="space-y-6 mb-20">
        <div className="flex items-center gap-3">
          <Bone className="h-px w-10" />
          <Bone className="h-2 w-28" />
        </div>
        <Bone className="h-20 w-full max-w-3xl" />
        <Bone className="h-4 w-full max-w-xl opacity-60" />
      </div>

      {/* Pipeline */}
      <div className="mb-20 border border-white/[0.05] bg-white/[0.01] p-12 relative overflow-hidden">
        <Bone className="h-3 w-40 mb-12" />
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-4" style={{ width: '25%' }}>
              <Bone className="h-14 w-14 border border-white/[0.05]" />
              <Bone className="h-2 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-px bg-white/[0.05] border border-white/[0.05] mb-20">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#050505] p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Bone className="h-3 w-3" />
              <Bone className="h-2 w-24" />
            </div>
            <Bone className="h-4 w-full opacity-60" />
          </div>
        ))}
      </div>

      {/* History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-8 space-y-12">
          <Bone className="h-4 w-48 mb-10" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="pl-12 border-l border-white/10 space-y-6 relative">
              <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 bg-zinc-800" />
              <div className="flex items-center justify-between">
                <Bone className="h-2 w-32" />
                <Bone className="h-6 w-24" />
              </div>
              <Bone className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Table Skeleton ────────────────────────────

export function AdminProjectRowSkeleton() {
  return (
    <div className="bg-[#050505] px-8 py-8 border-b border-white/[0.05]">
      <div className="flex flex-col lg:flex-row lg:items-center gap-8">
        <div className="hidden xl:block min-w-[100px] space-y-2">
          <Bone className="h-2 w-10 opacity-30" />
          <Bone className="h-2 w-16 opacity-50" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <Bone className="h-2 w-2 bg-accent/20" />
            <Bone className="h-8 w-64" />
          </div>
          <div className="flex items-center gap-4 ml-6">
            <Bone className="h-2 w-32 opacity-40" />
            <Bone className="h-2 w-20 opacity-20" />
          </div>
        </div>
        <div className="flex items-center gap-4 justify-end">
          <Bone className="h-6 w-32" />
          <Bone className="h-6 w-28" />
          <div className="flex gap-2">
            <Bone className="h-10 w-10" />
            <Bone className="h-10 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-8 py-16 lg:py-24">
      {/* Header */}
      <div className="mb-16 space-y-6">
        <Bone className="h-2 w-48" />
        <Bone className="h-16 w-96" />
        <Bone className="h-4 w-full max-w-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-white/[0.05] border border-white/[0.05] mb-16">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="md:col-span-3 h-48 bg-[#050505]">
            <DashboardCardSkeleton />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="space-y-8">
        <Bone className="h-14 w-full" />
        <div className="flex items-center justify-between border-t border-white/[0.03] pt-6">
          <Bone className="h-3 w-40" />
          <div className="flex gap-8">
            <Bone className="h-3 w-24" />
            <Bone className="h-3 w-24" />
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="mt-8 border border-white/[0.05]">
        {[1, 2, 3, 4, 5].map((i) => (
          <AdminProjectRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
