# Ardeno Studio Client Portal — Launch Checklist

## 1. Production Environment Setup

### Supabase Dashboard
- [ ] **Redirect URLs**: Only your Netlify domain + `http://localhost:5173` are allowed
  - `https://ardenostudio.netlify.app/auth/callback`
  - `http://localhost:5173/auth/callback`
- [ ] **Session duration**: Set to your preference (default: 1 week)
- [ ] **Remove** any old/test redirect URLs

### Netlify Environment Variables
Confirm these exist in **Production** (not just Dev/Preview):

| Variable | Set? |
|----------|------|
| `DATABASE_URL` | [ ] |
| `SUPABASE_JWT_SECRET` | [ ] |
| `ADMIN_EMAILS` | [ ] |
| `VITE_SUPABASE_URL` | [ ] |
| `VITE_SUPABASE_ANON_KEY` | [ ] |
| `RESEND_API_KEY` (optional) | [ ] |

### Secret Rotation
- [ ] Rotate `SUPABASE_JWT_SECRET` if shared in any conversation/doc
- [ ] Rotate `DATABASE_URL` password if shared anywhere
- [ ] Update `.env.example` (no real values committed)

---

## 2. End-to-End QA

### Auth
- [ ] New user login → Google OAuth → callback → dashboard
- [ ] Session persists after page refresh
- [ ] Logout → redirected to `/login`
- [ ] New tab → still logged in (`onAuthStateChange` working)
- [ ] Non-admin visits `/admin` → redirected to `/dashboard`
- [ ] Refresh `/dashboard` → no 404 (SPA redirects working)
- [ ] Refresh `/auth/callback` mid-flow → handled gracefully

### Client Flow
- [ ] Create project → success toast → appears on dashboard
- [ ] Open project detail → timeline groups correct (This Week / Month / Earlier)
- [ ] Request update → toast + rate limit works (test 2nd request within 1hr)
- [ ] Error states show "Copy debug info" button
- [ ] "Report an issue" mailto includes project ID + user email

### Admin Flow
- [ ] Admin dashboard loads with pagination
- [ ] Edit modal saves `next_update_date`
- [ ] Stage change without message → frontend blocks + backend rejects
- [ ] Stage change with message → update record created in timeline
- [ ] Search + filter controls work correctly
- [ ] Total count in pagination matches

### Security
- [ ] CORS blocks requests from random origins (test with `curl -H "Origin: https://evil.com"`)
- [ ] All error responses follow `{ success: false, error: { code, message }, requestId }`
- [ ] `X-Request-Id` header present in all responses
- [ ] Rate limits trigger correctly (429 response)

---

## 3. Observability

- [ ] Error logs include `{ requestId, route, userEmail, projectId }` (already implemented)
- [ ] "Copy debug info" button works in error states (already implemented)
- [ ] **Internal process**: client reports issue → ask for requestId → search Netlify function logs

---

## 4. Seed Demo Data

Run after first login to populate the dashboard:
```bash
# Connect to your Neon DB and run:
psql $DATABASE_URL < netlify/functions/db/seed-demo.sql
```

- [ ] Dashboard shows 3 demo projects with realistic data
- [ ] Timeline shows grouped updates
- [ ] Portal looks "alive" for prospect demos

---

## 5. Launch Mode

| Mode | When | Details |
|------|------|---------|
| **Private Beta** ← recommended first | Now | 1–2 real clients, monitor logs daily |
| Soft Launch | After 1–2 weeks of beta | Public URL, no marketing |
| Full Launch | After stable soft launch | Marketing, client onboarding |

---

## 6. Future Upgrades (Post-Beta)

- Email notifications via Resend (next update date → client email)
- File uploads via Supabase Storage (contracts, assets)
- Activity feed on admin side (latest updates across all projects)
- Role-based access (multiple client users per project)
