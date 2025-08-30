# AGENTS — Pipeline 100 Readiness Check™

Purpose: give human and AI contributors clear, enforceable guardrails to keep work aligned with business goals and technical constraints. Pair this with `cursorrules` for day‑to‑day decisions.

## Mission & Scope
- Generate qualified leads for Floorplay’s $4k/mo service via a professional quiz → results → capture flow.
- Prioritize UX clarity, reliability, and performance over breadth. Ship small, safe iterations.
- Out of scope: CMS migrations, multi‑tenant dashboards, homeowner flows.

## Architecture Snapshot
- Frontend: React 18 + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui
- Forms: React Hook Form (+ Zod if/when needed)
- Serverless: Vercel functions in `api/*` (Close, Kit, SEO)
- Analytics: Fathom
- Types: `src/types/quiz.ts` is the single source of truth

Key paths
- Components: `src/components/*`, shadcn primitives in `src/components/ui/*`
- Business logic: `src/utils/*` (scoring, seoKeywords, googlePlaces, analytics)
- Client API helpers: `src/api/*`
- Serverless endpoints: `api/*`

## Non‑Negotiables (Invariants)
- Scoring rules, thresholds, and forecasts must match `src/utils/scoring.ts` unless an approved change is documented.
- Always return exactly 3 “Top Moves” ordered by impact × speed.
- Keep analytics events intact: quiz_start, quiz_complete, result_view, pro_score_request, calendar_*.
- Accessibility for interactive widgets (e.g., autocomplete listbox/option roles, focus management).
- Never leak server secrets to the client. Client env must use `VITE_` prefix.
- Server auth uses Node base64: `Buffer.from(...).toString('base64')` (never `btoa`).

## Environment
Server (Vercel)
- CLOSE_API_KEY
- KIT_API_KEY
- DATAFORSEO_LOGIN
- DATAFORSEO_PASSWORD

Client (Vite)
- VITE_GOOGLE_PLACES_API_KEY
- VITE_FATHOM_SITE_ID

## Runbook
- Install: `npm install`
- Dev (frontend only): `npm run dev`
- Full stack dev (frontend + api): `vercel dev` (recommended to exercise `/api/*`)
- Build: `npm run build`
- Type check: `npm run type-check`
- Lint: `npm run lint`

## Definition of Done
- Feature meets acceptance criteria and preserves scoring/analytics/a11y invariants.
- TypeScript passes (strict) and linter is clean.
- Mobile Safari/Chrome checked; no console errors; graceful API failure paths.
- Docs updated if behavior/config changed (README, cursorrules, ADR/DECISIONS if applicable).

## Agent Workflow (Cursor/Codex)
- Read `cursorrules` before editing. Keep edits small and scoped.
- Touch only relevant files; avoid wide refactors and formatting churn.
- For server integrations, implement in `api/*`; call from client via `/api/...`.
- For new UI, use shadcn/ui components first; Tailwind utilities for layout.
- If changing scoring or move logic, stop and request explicit approval. Add a brief record to `DECISIONS.md` (or create it) with rationale.

## Quality Gates
- Accessibility: keyboard focus and ARIA semantics on custom widgets.
- SEO: `index.html` has meta description, canonical, OG/Twitter, theme‑color; `public/robots.txt` and `public/sitemap.xml` exist.
- Performance: avoid large client deps for server‑only tasks; add timeouts/fallbacks on network calls.

## Hand‑Off Notes
- Key files: `src/utils/scoring.ts`, `src/types/quiz.ts`, `api/close-webhook.ts`, `api/kit-webhook.ts`, `api/seo-rankings.ts`.
- Copy tone: professional B2B; concise, benefit‑led; no hype.
- Future improvements should land behind small PRs with screenshots and brief impact notes.

