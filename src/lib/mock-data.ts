import type { Project, ProjectUpdate, JwtPayload } from '@/types';

// ─── Mock Users ───────────────────────────────────────

export const MOCK_CLIENT = {
  sub: 'c1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
  email: 'alex@meridiangroup.com',
  name: 'Alex Rivera',
  avatar: null,
  isAdmin: false,
  exp: Math.floor(Date.now() / 1000) + 86400,
  iat: Math.floor(Date.now() / 1000),
} satisfies JwtPayload & Record<string, unknown>;

export const MOCK_ADMIN = {
  sub: 'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6',
  email: 'studio@ardeno.studio',
  name: 'Ardeno Studio',
  avatar: null,
  isAdmin: true,
  exp: Math.floor(Date.now() / 1000) + 86400,
  iat: Math.floor(Date.now() / 1000),
} satisfies JwtPayload & Record<string, unknown>;

// ─── Mock Projects ────────────────────────────────────

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1a2b3c4-0001-0001-0001-000000000001',
    user_id: MOCK_CLIENT.sub,
    project_name: 'Meridian Brand Refresh',
    industry: 'Luxury Hospitality',
    description:
      'Complete brand identity overhaul for a luxury boutique hotel chain. Includes visual language, digital touchpoints, and brand guidelines for a refined, modern aesthetic.',
    current_status: 'Active',
    current_stage: 'UX & Wireframing',
    goals: 'Elevate brand perception to compete with top-tier luxury hospitality brands. Create cohesive visual identity across all digital and physical touchpoints.',
    target_audience: 'High-net-worth travelers aged 30-55 seeking premium experiences',
    deadline: '2026-04-15',
    budget_range: 'LKR 150,000 – 500,000',
    additional_notes: 'Client prefers muted earth tones with gold accents. Reference: Aman Resorts, Edition Hotels.',
    estimated_completion_date: '2026-04-01',
    next_update_date: '2026-03-02',
    last_updated_by: 'Ardeno Studio',
    created_at: '2026-01-10T09:00:00Z',
    updated_at: '2026-02-20T14:30:00Z',
    client_name: 'Alex Rivera',
    client_email: 'alex@meridiangroup.com',
  },
  {
    id: 'p1a2b3c4-0002-0002-0002-000000000002',
    user_id: MOCK_CLIENT.sub,
    project_name: 'Apex Digital Platform',
    industry: 'FinTech',
    description:
      'High-performance web application for a next-generation financial analytics platform. Focus on real-time data visualization and institutional-grade UX.',
    current_status: 'Active',
    current_stage: 'Visual Design',
    goals: 'Launch a production-ready analytics dashboard that handles 10K concurrent users with sub-200ms response times.',
    target_audience: 'Institutional investors, hedge fund analysts, and portfolio managers',
    deadline: '2026-05-30',
    budget_range: 'LKR 1,000,000+',
    additional_notes: 'Must comply with SOC 2 requirements. Dark mode first. Integration with Bloomberg API.',
    estimated_completion_date: '2026-05-15',
    next_update_date: null,
    last_updated_by: 'Ardeno Studio',
    created_at: '2025-12-01T10:00:00Z',
    updated_at: '2026-02-22T11:00:00Z',
    client_name: 'Alex Rivera',
    client_email: 'alex@meridiangroup.com',
  },
  {
    id: 'p1a2b3c4-0003-0003-0003-000000000003',
    user_id: MOCK_CLIENT.sub,
    project_name: 'Nova E-Commerce',
    industry: 'Fashion & Retail',
    description:
      'Bespoke e-commerce experience for a direct-to-consumer fashion label. Editorial-style product pages with seamless checkout flow.',
    current_status: 'Active',
    current_stage: 'Development & Launch',
    goals: 'Achieve 3%+ conversion rate with a visually immersive shopping experience that reflects the brand ethos.',
    target_audience: 'Fashion-forward consumers aged 22-40',
    deadline: '2026-03-20',
    budget_range: 'LKR 50,000 – 150,000',
    additional_notes: 'Shopify Plus backend. Need custom Liquid templates. Lookbook integration.',
    estimated_completion_date: '2026-03-15',
    next_update_date: null,
    last_updated_by: 'Ardeno Studio',
    created_at: '2025-11-15T08:00:00Z',
    updated_at: '2026-02-18T16:45:00Z',
    client_name: 'Alex Rivera',
    client_email: 'alex@meridiangroup.com',
  },
  {
    id: 'p1a2b3c4-0004-0004-0004-000000000004',
    user_id: MOCK_CLIENT.sub,
    project_name: 'Zenith Portfolio',
    industry: 'Architecture',
    description:
      'Minimalist portfolio website for an award-winning architecture firm. WebGL transitions, case study presentations, and immersive project galleries.',
    current_status: 'Completed',
    current_stage: 'Development & Launch',
    goals: 'Showcase the firm\'s portfolio in a way that matches the caliber of their physical work.',
    target_audience: 'Property developers, luxury residential clients, and design publications',
    deadline: '2026-01-30',
    budget_range: 'Under LKR 50,000',
    additional_notes: null,
    estimated_completion_date: null,
    next_update_date: null,
    last_updated_by: 'Ardeno Studio',
    created_at: '2025-09-20T12:00:00Z',
    updated_at: '2026-01-28T10:00:00Z',
    client_name: 'Alex Rivera',
    client_email: 'alex@meridiangroup.com',
  },
  // Admin-only: other clients
  {
    id: 'p1a2b3c4-0005-0005-0005-000000000005',
    user_id: 'u-other-001',
    project_name: 'Prism Analytics Dashboard',
    industry: 'SaaS',
    description: 'Internal analytics dashboard for a data intelligence startup.',
    current_status: 'Active',
    current_stage: 'Discovery & Strategy',
    goals: 'Build an intuitive analytics interface for non-technical stakeholders.',
    target_audience: 'C-suite executives and marketing teams',
    deadline: '2026-06-30',
    budget_range: 'LKR 150,000 – 500,000',
    additional_notes: null,
    estimated_completion_date: null,
    next_update_date: null,
    last_updated_by: null,
    created_at: '2026-02-15T09:00:00Z',
    updated_at: '2026-02-15T09:00:00Z',
    client_name: 'Jordan Kim',
    client_email: 'jordan@prismai.co',
  },
  {
    id: 'p1a2b3c4-0006-0006-0006-000000000006',
    user_id: 'u-other-002',
    project_name: 'Vertex SaaS Platform',
    industry: 'Enterprise Software',
    description: 'Complete redesign of an enterprise resource management platform.',
    current_status: 'On Hold',
    current_stage: 'Visual Design',
    goals: 'Modernize the legacy UI while maintaining feature parity.',
    target_audience: 'Enterprise IT teams and operations managers',
    deadline: '2026-07-15',
    budget_range: 'Let\'s discuss',
    additional_notes: 'Paused pending client budget approval for Q2.',
    estimated_completion_date: null,
    next_update_date: null,
    last_updated_by: 'Ardeno Studio',
    created_at: '2025-12-20T14:00:00Z',
    updated_at: '2026-02-10T09:30:00Z',
    client_name: 'Morgan Wells',
    client_email: 'morgan@vertexhq.io',
  },
];

// ─── Mock Updates ─────────────────────────────────────

export const MOCK_UPDATES: Record<string, ProjectUpdate[]> = {
  'p1a2b3c4-0001-0001-0001-000000000001': [
    {
      id: 'u-001',
      project_id: 'p1a2b3c4-0001-0001-0001-000000000001',
      updated_stage: 'UX & Wireframing',
      update_message: 'Moodboards and initial wireframe concepts approved. Moving into high-fidelity mockups for the core brand identity system.',
      updated_by: 'Ardeno Studio',
      updated_at: '2026-02-20T14:30:00Z',
    },
    {
      id: 'u-002',
      project_id: 'p1a2b3c4-0001-0001-0001-000000000001',
      updated_stage: 'Discovery & Strategy',
      update_message: 'Brand audit completed. Competitive landscape analysis delivered. Stakeholder interviews documented.',
      updated_by: 'Ardeno Studio',
      updated_at: '2026-01-25T10:00:00Z',
    },
  ],
  'p1a2b3c4-0002-0002-0002-000000000002': [
    {
      id: 'u-003',
      project_id: 'p1a2b3c4-0002-0002-0002-000000000002',
      updated_stage: 'Visual Design',
      update_message: 'Core visual design system finalized. Component library built. Design handoff ready for development.',
      updated_by: 'Ardeno Studio',
      updated_at: '2026-02-22T11:00:00Z',
    },
    {
      id: 'u-004',
      project_id: 'p1a2b3c4-0002-0002-0002-000000000002',
      updated_stage: 'UX & Wireframing',
      update_message: 'User flows and wireframes finalized. Information architecture approved. Design handoff completed with full Figma specs.',
      updated_by: 'Ardeno Studio',
      updated_at: '2026-02-05T16:00:00Z',
    },
    {
      id: 'u-005',
      project_id: 'p1a2b3c4-0002-0002-0002-000000000002',
      updated_stage: 'Discovery & Strategy',
      update_message: 'Technical requirements gathered. API specifications documented. Infrastructure architecture approved.',
      updated_by: 'Ardeno Studio',
      updated_at: '2025-12-15T09:00:00Z',
    },
  ],
  'p1a2b3c4-0003-0003-0003-000000000003': [
    {
      id: 'u-006',
      project_id: 'p1a2b3c4-0003-0003-0003-000000000003',
      updated_stage: 'Development & Launch',
      update_message: 'Full e-commerce build deployed to staging. QA testing in progress. Client review session scheduled.',
      updated_by: 'Ardeno Studio',
      updated_at: '2026-02-18T16:45:00Z',
    },
  ],
  'p1a2b3c4-0004-0004-0004-000000000004': [
    {
      id: 'u-007',
      project_id: 'p1a2b3c4-0004-0004-0004-000000000004',
      updated_stage: 'Development & Launch',
      update_message: 'Site launched successfully. Performance score: 98/100. All case studies live. Client handover complete.',
      updated_by: 'Ardeno Studio',
      updated_at: '2026-01-28T10:00:00Z',
    },
  ],
};

// ─── Mock Auth Helper ─────────────────────────────────

export function createMockToken(user: JwtPayload): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      ...user,
      exp: Math.floor(Date.now() / 1000) + 86400,
      iat: Math.floor(Date.now() / 1000),
    })
  );
  return `${header}.${payload}.mock-signature`;
}
