## Summary
Describe the problem and the outcome (what/why, not step-by-step how).

## Scope
- Feature / Fix / Refactor / Chore
- Affected areas:

## Screenshots / Demos
Attach before/after or a short clip for any UI change.

## Testing
- Manual steps taken
- `npm run type-check` output
- `npm run lint` output
- Local API tested via `vercel dev` (if applicable)

## Risk & Rollback
- Potential impact areas
- Rollback plan

## Checklist
- [ ] Scoring: logic/thresholds unchanged OR approved changes documented (see `src/utils/scoring.ts`).
- [ ] Top 3 Moves: still returns exactly 3 in priority order.
- [ ] Analytics: events wired (quiz_start, quiz_complete, result_view, pro_score_request, calendar_*).
- [ ] Accessibility: keyboard + ARIA for interactive widgets (e.g., autocomplete listbox/option).
- [ ] Env safety: no server secrets in client; client env uses `VITE_` prefix.
- [ ] Server auth uses `Buffer.from(...).toString('base64')` (no `btoa`).
- [ ] SEO: meta description/canonical/OG/Twitter intact (for layout-level changes).
- [ ] Mobile: Safari/Chrome sanity check; no console errors.
- [ ] Docs updated (README / `cursorrules` / AGENTS / ADR if behavior changed).

