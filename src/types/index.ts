// ─── Enums ──────────────────────────────────────────────

export type ProjectStage =
  | 'Discovery & Strategy'
  | 'UX & Wireframing'
  | 'Visual Design'
  | 'Development & Launch';

export type ProjectStatus = 'Active' | 'On Hold' | 'Completed';

// ─── Database Models ────────────────────────────────────

export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  project_name: string;
  industry: string | null;
  description: string | null;
  current_status: ProjectStatus;
  current_stage: ProjectStage;
  goals: string | null;
  target_audience: string | null;
  deadline: string | null;
  budget_range: string | null;
  additional_notes: string | null;
  estimated_completion_date: string | null;
  next_update_date: string | null;
  last_updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  client_name?: string;
  client_email?: string;
  client_avatar?: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  updated_stage: ProjectStage | null;
  update_message: string | null;
  updated_by: string | null;
  updated_at: string;
}

// ─── Portal User ────────────────────────────────────────
// Shape returned by GET /api/auth/me and stored in AuthContext.

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  avatar: string | null;
  isAdmin: boolean;
}

// ─── API Types ──────────────────────────────────────────

/** @deprecated Supabase auth handles login. Kept for backward compat. */
export interface AuthResponse {
  token: string;
  user: User;
  isAdmin: boolean;
}

export interface CreateProjectPayload {
  project_name: string;
  industry?: string;
  description?: string;
  goals?: string;
  target_audience?: string;
  deadline?: string;
  budget_range?: string;
  additional_notes?: string;
}

export interface UpdateStagePayload {
  new_stage: ProjectStage;
  new_status?: ProjectStatus;
  update_message?: string;
  estimated_completion_date?: string;
  next_update_date?: string;
}

export interface RequestUpdatePayload {
  projectId: string;
  message: string;
}

// ─── Component Props ────────────────────────────────────

export const PROJECT_STAGES: ProjectStage[] = [
  'Discovery & Strategy',
  'UX & Wireframing',
  'Visual Design',
  'Development & Launch',
];

export const STAGE_INDEX: Record<ProjectStage, number> = {
  'Discovery & Strategy': 0,
  'UX & Wireframing': 1,
  'Visual Design': 2,
  'Development & Launch': 3,
};
