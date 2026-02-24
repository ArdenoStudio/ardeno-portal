-- Ardeno Studio Client Portal - Database Schema
-- Run this against your Neon Postgres database

-- ─── Users ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  profile_picture_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── Enums ──────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE project_stage AS ENUM (
    'Discovery & Strategy',
    'UX & Wireframing',
    'Visual Design',
    'Development & Launch'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM (
    'Active',
    'On Hold',
    'Completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Projects ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  industry TEXT,
  description TEXT,
  current_status project_status DEFAULT 'Active',
  current_stage project_stage DEFAULT 'Discovery & Strategy',
  goals TEXT,
  target_audience TEXT,
  deadline DATE,
  budget_range TEXT,
  additional_notes TEXT,
  estimated_completion_date DATE,
  next_update_date DATE,
  last_updated_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_created
  ON projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_stage
  ON projects(current_stage);

-- ─── Project Updates ────────────────────────────────────

CREATE TABLE IF NOT EXISTS project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  updated_stage project_stage,
  update_message TEXT,
  updated_by TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_updates_project_date
  ON project_updates(project_id, updated_at DESC);

-- ─── Rate Limiting ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW()
);

-- ─── Migration: 5-stage → 4-stage ──────────────────────
-- If you already have data with the old 5-stage enum, run this migration:
--
-- ALTER TYPE project_stage ADD VALUE IF NOT EXISTS 'Discovery & Strategy';
-- ALTER TYPE project_stage ADD VALUE IF NOT EXISTS 'UX & Wireframing';
-- ALTER TYPE project_stage ADD VALUE IF NOT EXISTS 'Visual Design';
-- ALTER TYPE project_stage ADD VALUE IF NOT EXISTS 'Development & Launch';
--
-- UPDATE projects SET current_stage = 'Discovery & Strategy' WHERE current_stage = 'Discovery';
-- UPDATE projects SET current_stage = 'UX & Wireframing' WHERE current_stage = 'Design';
-- UPDATE projects SET current_stage = 'Visual Design' WHERE current_stage = 'Development';
-- UPDATE projects SET current_stage = 'Development & Launch' WHERE current_stage IN ('Review', 'Launched');
--
-- UPDATE project_updates SET updated_stage = 'Discovery & Strategy' WHERE updated_stage = 'Discovery';
-- UPDATE project_updates SET updated_stage = 'UX & Wireframing' WHERE updated_stage = 'Design';
-- UPDATE project_updates SET updated_stage = 'Visual Design' WHERE updated_stage = 'Development';
-- UPDATE project_updates SET updated_stage = 'Development & Launch' WHERE updated_stage IN ('Review', 'Launched');
