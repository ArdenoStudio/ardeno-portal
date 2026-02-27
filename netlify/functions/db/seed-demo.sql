-- ─── Seed Demo Data ──────────────────────────────────────
-- Insert 3 beautiful demo projects for showcase purposes.
-- Run this AFTER the main schema.sql has been applied.
--
-- Replace the user_id with the actual UUID of your demo
-- account (created on first Google login).
--
-- To get your user ID after logging in:
--   SELECT id, email FROM users;
-- Then replace 'REPLACE_WITH_USER_ID' below.

DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  -- Use the first user in the system (your account)
  SELECT id INTO demo_user_id FROM users LIMIT 1;

  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Log in first, then re-run this seed.';
    RETURN;
  END IF;

  -- ── Project 1: Brand Identity (Active, UX stage) ────────
  INSERT INTO projects (
    user_id, project_name, industry, description,
    current_status, current_stage, goals, target_audience,
    deadline, budget_range, additional_notes,
    estimated_completion_date, next_update_date,
    last_updated_by, created_at, updated_at
  ) VALUES (
    demo_user_id,
    'Meridian Brand Identity',
    'Luxury Hospitality',
    'Complete brand identity system for a luxury boutique hotel chain. Includes visual language, digital touchpoints, collateral design, and comprehensive brand guidelines.',
    'Active',
    'UX & Wireframing',
    'Elevate brand perception to compete with top-tier luxury hospitality brands. Create cohesive visual identity across all customer touchpoints.',
    'High-net-worth travelers aged 30-55 seeking premium experiences',
    '2026-05-15',
    'LKR 150,000 – 500,000',
    'Client prefers muted earth tones with gold accents. Reference: Aman Resorts, Edition Hotels, Four Seasons.',
    '2026-05-01',
    '2026-03-10',
    'Ardeno Studio',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '2 days'
  );

  -- Add timeline updates for Project 1
  INSERT INTO project_updates (project_id, updated_stage, update_message, updated_by, updated_at)
  SELECT id, 'Discovery & Strategy',
    'Brand audit completed. Competitive landscape analysis delivered. Stakeholder interviews documented and synthesized into a strategic brief.',
    'Ardeno Studio', NOW() - INTERVAL '30 days'
  FROM projects WHERE project_name = 'Meridian Brand Identity';

  INSERT INTO project_updates (project_id, updated_stage, update_message, updated_by, updated_at)
  SELECT id, 'UX & Wireframing',
    'Moodboards and initial wireframe concepts approved. Moving into high-fidelity mockups for the core brand identity system. Typography and color palette refined.',
    'Ardeno Studio', NOW() - INTERVAL '2 days'
  FROM projects WHERE project_name = 'Meridian Brand Identity';

  -- ── Project 2: SaaS Dashboard (Active, Visual Design) ───
  INSERT INTO projects (
    user_id, project_name, industry, description,
    current_status, current_stage, goals, target_audience,
    deadline, budget_range, additional_notes,
    estimated_completion_date, next_update_date,
    last_updated_by, created_at, updated_at
  ) VALUES (
    demo_user_id,
    'Apex Analytics Platform',
    'FinTech',
    'High-performance web application for a next-generation financial analytics platform. Real-time data visualization, institutional-grade UX, and Bloomberg API integration.',
    'Active',
    'Visual Design',
    'Launch a production-ready analytics dashboard handling 10K concurrent users with sub-200ms response times.',
    'Institutional investors, hedge fund analysts, and portfolio managers',
    '2026-06-30',
    'LKR 1,000,000+',
    'Must comply with SOC 2 requirements. Dark mode first. Integration with Bloomberg Terminal API.',
    '2026-06-15',
    NULL,
    'Ardeno Studio',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '5 days'
  );

  INSERT INTO project_updates (project_id, updated_stage, update_message, updated_by, updated_at)
  SELECT id, 'Discovery & Strategy',
    'Technical requirements gathered. API specifications documented. Infrastructure architecture approved. Security compliance review completed.',
    'Ardeno Studio', NOW() - INTERVAL '75 days'
  FROM projects WHERE project_name = 'Apex Analytics Platform';

  INSERT INTO project_updates (project_id, updated_stage, update_message, updated_by, updated_at)
  SELECT id, 'UX & Wireframing',
    'User flows and wireframes finalized. Information architecture approved. Design system foundations established with component inventory.',
    'Ardeno Studio', NOW() - INTERVAL '40 days'
  FROM projects WHERE project_name = 'Apex Analytics Platform';

  INSERT INTO project_updates (project_id, updated_stage, update_message, updated_by, updated_at)
  SELECT id, 'Visual Design',
    'Core visual design system finalized. Component library built in Figma with dark mode tokens. Design handoff ready for development sprint.',
    'Ardeno Studio', NOW() - INTERVAL '5 days'
  FROM projects WHERE project_name = 'Apex Analytics Platform';

  -- ── Project 3: E-Commerce (Completed) ───────────────────
  INSERT INTO projects (
    user_id, project_name, industry, description,
    current_status, current_stage, goals, target_audience,
    deadline, budget_range, additional_notes,
    estimated_completion_date, next_update_date,
    last_updated_by, created_at, updated_at
  ) VALUES (
    demo_user_id,
    'Nova E-Commerce Experience',
    'Fashion & Retail',
    'Bespoke e-commerce experience for a direct-to-consumer fashion label. Editorial-style product pages, immersive lookbook integration, and seamless checkout flow.',
    'Completed',
    'Development & Launch',
    'Achieve 3%+ conversion rate with a visually immersive shopping experience that reflects the brand ethos.',
    'Fashion-forward consumers aged 22-40',
    '2026-02-20',
    'LKR 50,000 – 150,000',
    NULL,
    NULL,
    NULL,
    'Ardeno Studio',
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '10 days'
  );

  INSERT INTO project_updates (project_id, updated_stage, update_message, updated_by, updated_at)
  SELECT id, 'Development & Launch',
    'Site launched successfully. Lighthouse performance score: 98/100. All product pages live. Client handover and training completed.',
    'Ardeno Studio', NOW() - INTERVAL '10 days'
  FROM projects WHERE project_name = 'Nova E-Commerce Experience';

  RAISE NOTICE 'Demo data seeded successfully!';
END $$;
