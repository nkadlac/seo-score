# Decisions

## 2025-08-30 — Dynamic 90‑Day Pipeline Forecast

- Change: `getForecast(score)` in `src/utils/scoring.ts` now computes the 90‑day pipeline as a function of explicit assumptions instead of returning a static band‑based dollar range.
- Why: The previous numbers felt artificially low and didn’t reflect job value or conversion assumptions. We keep 60‑day leads tied to score bands and compute a realistic 90‑day opportunity pipeline.
- Assumptions (tunable constants):
  - `avgTicket = $10,000`
  - `leadToOpportunity = 0.6`
  - `pipeline90Multiplier = 1.5` (scales 60‑day leads to a 90‑day opp pipeline)
- Output format remains: `"60-day: X–Y leads, 90-day: $Ak–$Bk pipeline"` to preserve UI parsing.
- Invariants preserved:
  - Scoring rules and Top 3 Moves logic unchanged.
  - Function signature and string format unchanged to avoid breaking consumers.
- UI copy: Results section now says “60‑Day Leads & 90‑Day Pipeline” and labels pipeline bullets as “90‑day pipeline” for clarity.

## 2025-08-30 — Per‑Market Average Ticket (by City)

- Change: `getForecast(score, avgTicketOverride?)` now accepts an optional average ticket. `calculateScore` passes the market‑specific value from `answers.city` via `getAvgTicketForCity` in `src/utils/cityData.ts`.
- Why: Different metros and suburbs have different average job sizes; this aligns pipeline estimates with local economics.
- Data source: `cityData.ts` includes optional `avgTicket` per market and a helper `getAvgTicketForCity(city)`; default is $10,000 when unknown.

## 2025-09-04 — Dynamic city in review example

- Change: The Top Moves copy for reviews now interpolates the user's city instead of a hardcoded example ("Mequon").
- Where: `src/utils/scoring.ts` `getTopMoves` — formats as e.g., "epoxy garage floor in <City>"; falls back to "your city" when unknown.
- Why: Personalization; improves relevance without affecting scoring thresholds or priorities.
- Invariants: Scoring math and band thresholds unchanged; only string formatting updated.
