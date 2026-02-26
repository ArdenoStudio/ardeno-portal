-- Migration script for Phase 5C - Client Trust Features
-- Adds next_update_date column to existing projects table

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS next_update_date DATE;
