---
title: "feat: Build FIRE Co-Pilot Phase 1 (Foundation) + Phase 2 (Core Engine)"
type: feat
status: active
date: 2026-03-29
origin: PLAN.md, TECH_STACK.md, PRODUCT.md, RESEARCH.md
deepened: 2026-03-29
---

# feat: Build FIRE Co-Pilot Phase 1 (Foundation) + Phase 2 (Core Engine)

## Overview

Build the foundation and core calculation engine for a fully client-side FIRE (Financial Independence, Retire Early) co-pilot. Phase 1 scaffolds the project and creates the persona-driven UI. Phase 2 implements the FIRE calculation engine including Monte Carlo simulation in a Web Worker.

## Problem Frame

Existing FIRE calculators are either too simple (give a number, close the tab) or too complex (require financial planning expertise). This product sits in the middle — opinionated, Canadian-tax-aware, and powered by editable sample personas so users can immediately see a FIRE path that looks like theirs.

V1 is fully client-side with no backend. Users pick a persona, tweak numbers, and see real-time FIRE calculations including Monte Carlo probability bands.

## Requirements Trace

- R1. Project scaffolded with Vite 6 + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui + Biome + pnpm
- R2. Complete TypeScript type system for financial data (accounts, income, expenses, tax, goals)
- R3. Zustand store with localStorage persistence for persona state
- R4. Four sample personas defined with all financial data (Early Career Saver, Mid-Career Couple, Almost There, Just FIREd)
- R5. Persona selector landing page with 4 clickable cards
- R6. Editable data panel where all persona fields can be modified via sliders and inputs
- R7. FIRE number calculator (Annual Expenses x 25, adjustable withdrawal rate multiplier)
- R8. Savings rate calculator from income and spending data
- R9. Time to FI projection based on savings rate, portfolio value, expected returns
- R10. Monte Carlo simulation (500-1000 runs) in Web Worker via Comlink, showing probability of success and percentile bands
- R11. FIRE type classifier (Lean / Traditional / Fat / Barista / Coast)

## Scope Boundaries

- No backend, auth, database, or Plaid integration (V2)
- No withdrawal phase planning, Yield Shield, or Cash Cushion modeling (V2)
- No scenario modeling or what-if toggles (V2)
- No recommendation engine (Phase 4)
- No time-series charts or Recharts visualizations (Phase 3) — this plan builds the engine, data panel, and metric card display, not the charting layer
- No Motion/Framer animations yet — add when there's UI to animate
- No Tremor components yet — add with Phase 3 dashboard

## Context & Research

### Origin Documents

The four planning docs serve as comprehensive requirements:
- **RESEARCH.md** — FIRE math, 4% rule, withdrawal strategies, Canadian tax optimization, competitive landscape
- **PRODUCT.md** — Product vision, competitive positioning, MVP scope, monetization
- **PLAN.md** — Build phases, persona definitions, feature order, design principles
- **TECH_STACK.md** — All tech decisions with rationale (Vite over Next.js, Zustand, Recharts, Web Worker, etc.)

### Key Formulas (from RESEARCH.md)

- FIRE Number = Annual Expenses / Withdrawal Rate (default 4% = x25 multiplier)
- Savings Rate = (Income - Expenses) / Income
- Years to FI = ln((FI_number * r + annual_savings) / (portfolio * r + annual_savings)) / ln(1 + r), where r = real return rate
- Monte Carlo: randomize annual returns from historical distribution, run 500-1000 paths, report percentiles
- FIRE Types: Lean (<$40K spending), Traditional ($40K-$100K), Fat ($100K+), Barista (partial income covers gap), Coast (stop saving, let compounding do the work)

### Project Structure (from TECH_STACK.md)

```
fire-calculator/
├── src/
│   ├── app/                    # App shell
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── persona/            # Persona selector, editor panel
│   │   └── dashboard/          # Dashboard layout + metric cards (Phase 2); charts (Phase 3)
│   ├── engine/
│   │   ├── fire.ts             # Core FIRE calculations (pure functions)
│   │   ├── monteCarlo.ts       # Monte Carlo simulation logic
│   │   ├── tax.ts              # Canadian tax (future)
│   │   └── worker.ts           # Web Worker entry point
│   ├── data/
│   │   ├── personas.ts         # Sample persona definitions
│   │   └── constants.ts        # FIRE constants (historical returns, inflation)
│   ├── store/
│   │   └── useFireStore.ts     # Zustand store
│   ├── types/
│   │   └── index.ts            # All TypeScript types
│   └── lib/
│       └── utils.ts            # Shared utilities, formatters
├── index.html
├── vite.config.ts
├── tsconfig.json
├── biome.json
└── package.json
```

## Key Technical Decisions

- **Vite + React SPA over Next.js**: No SSR/SEO needed for a calculator tool. Simpler mental model, faster dev server, deploys as static files. (see origin: TECH_STACK.md)
- **Zustand with persist middleware**: Single store for persona + calculation results + UI state. `persist` middleware auto-saves to localStorage. No Provider wrapper needed. (see origin: TECH_STACK.md)
- **Web Worker + Comlink for Monte Carlo**: 1000 runs x 50 years = 50K iterations. ~100-300ms in JS — fast but enough to cause UI jank on main thread. Comlink makes worker calls feel like async functions. (see origin: TECH_STACK.md)
- **Engine is pure TypeScript, zero React imports**: All calculation logic in `engine/` is independently testable. This is the most important code — it must be correct.
- **shadcn/ui copy-paste model**: Components live in our repo, no runtime dependency. Built on Radix primitives for accessibility. Tailwind-native.
- **Debounced recalculation**: Persona edits trigger recalculation on 300ms idle so slider interactions feel smooth.

## Open Questions

### Resolved During Planning

- **Monte Carlo return distribution**: Use log-normal distribution with historical US stock market parameters (mean ~7% real, std ~15%). This matches the FIRE community standard and the research doc's assumptions.
- **How to handle the "Mid-Career Couple" persona**: Store as a single persona with combined income/expenses and joint accounts. The type system should support optional `partner` fields. Couples planning is V3 but the data model should not block it.
- **FIRE type classification thresholds**: Lean (<$40K annual spending), Traditional ($40K-$100K), Fat ($100K+). Note: RESEARCH.md shows Traditional at $40-80K with a gap to Fat at $100K+; we close this gap by extending Traditional to $100K. Barista and Coast are based on portfolio state, not spending level.
- **Framework override**: PLAN.md specifies Next.js 14 but TECH_STACK.md (written later) explicitly overrides to Vite + React SPA. Rationale: no SSR/SEO needed for a calculator tool. TECH_STACK.md is authoritative for tech decisions.

### Deferred to Implementation

- **Exact debounce timing**: 300ms is the starting point from TECH_STACK.md. May need tuning based on actual slider interaction feel.
- **shadcn/ui component variants**: Which specific variants (Card, Slider, Input, etc.) work best will be determined when building the UI.
- **Currency formatting locale**: Start with CAD formatting. May need to support USD later.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
User Flow:
  Landing Page → Pick Persona Card → Dashboard View
                                        ├── Editable Sidebar (inputs/sliders)
                                        │     └── onChange → Zustand store update
                                        │                    └── debounce 300ms
                                        │                         └── postMessage to Worker
                                        └── Results Display (FIRE number, savings rate,
                                              years to FI, Monte Carlo results, FIRE type)
                                              └── reads from Zustand store

Web Worker Data Flow:
  Main Thread                          Worker Thread
  ─────────────                        ─────────────
  Persona data  ──── Comlink ────→     Receives persona
                                       Runs FIRE calculations (pure functions)
                                       Runs Monte Carlo (500-1000 paths)
                                       Calculates percentiles
  Store update  ←─── Comlink ────      Returns FireResults
```

## Implementation Units

- [ ] **Unit 1: Project Scaffold**

  **Goal:** Initialize a working Vite + React + TypeScript project with all tooling configured.

  **Requirements:** R1

  **Dependencies:** None

  **Files:**
  - Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `biome.json`, `index.html`, `src/app/main.tsx`, `src/app/App.tsx`, `src/lib/utils.ts`, `src/app/globals.css`
  - Create: `components.json` (shadcn/ui config)

  **Approach:**
  - Use `pnpm create vite` with React + TypeScript template, then configure
  - Install core deps: react 19, react-dom 19, tailwindcss v4, zustand, comlink, react-currency-input-field
  - Install dev deps: typescript 5.x strict, @types/react, @types/react-dom, biome, vitest
  - Initialize shadcn/ui with `pnpx shadcn@latest init` — add Card, Slider, Input, Button, Select, Tabs, Badge, Label components
  - Configure Biome for lint + format (replaces ESLint + Prettier)
  - Configure TypeScript strict mode (no `any`, no implicit `undefined`)
  - Set up Tailwind v4 with custom design tokens for financial status colors and account type colors
  - Set up path aliases (`@/` → `src/`)
  - Verify: `pnpm dev` starts, `pnpm build` succeeds, `pnpm check` (Biome) passes

  **Patterns to follow:**
  - TECH_STACK.md project structure exactly
  - Tailwind v4 CSS-first configuration

  **Test scenarios:**
  - Happy path: App renders without errors after scaffold
  - Happy path: Build produces valid static output

  **Verification:**
  - `pnpm dev` serves the app at localhost
  - `pnpm build` completes without errors
  - TypeScript strict mode is enforced (test by adding an `any` and seeing it fail)

- [ ] **Unit 2: Type System**

  **Goal:** Define the complete TypeScript type system for all financial data used across the app.

  **Requirements:** R2

  **Dependencies:** Unit 1

  **Files:**
  - Create: `src/types/index.ts`

  **Approach:**
  - Define `Account` type with `type` enum (TFSA, RRSP, NonRegistered, Cash), `balance`, `contributionRoom` (optional)
  - Define `Persona` type: `name`, `age`, `income`, `monthlySpending`, `accounts` array, `housing` (rent/own + amount), `debt`, `fireType`, `retirementStatus` (accumulating/retired), optional `partner` fields for couples
  - Define `PersonaTemplate` as the immutable original data for reset
  - Define `FireResults`: `fireNumber`, `savingsRate`, `yearsToFI`, `fireDateEstimate` (Date — today + yearsToFI), `monthlyIncome`, `monthlyExpenses`, `annualExpenses`, `portfolioTotal`, `fireProgress` (percentage), `fireType`, `monteCarloResults`
  - Define `MonteCarloResults`: `runs`, `successRate`, `percentiles` (p10, p25, p50, p75, p90 as year-by-year portfolio values), `medianYearsToFI`
  - Define `FireType` enum: Lean, Traditional, Fat, Barista, Coast
  - Define `AccountType` enum: TFSA, RRSP, NonRegistered, Cash
  - Use branded types or clear naming to distinguish annual vs monthly amounts

  **Patterns to follow:**
  - TECH_STACK.md type structure
  - PLAN.md persona field definitions

  **Test scenarios:**
  - Happy path: Persona type correctly represents all 4 sample personas (type check, not runtime)
  - Edge case: MonteCarloResults percentile arrays have consistent length equal to simulation years
  - Happy path: FireResults covers all calculation outputs needed by UI

  **Verification:**
  - All 4 persona data objects (Unit 4) satisfy the `Persona` type without type errors
  - `FireResults` type covers every calculation output referenced in Phase 2

- [ ] **Unit 3: Zustand Store**

  **Goal:** Create the central Zustand store with localStorage persistence for persona state.

  **Requirements:** R3

  **Dependencies:** Unit 2

  **Files:**
  - Create: `src/store/useFireStore.ts`
  - Test: `src/store/__tests__/useFireStore.spec.ts`

  **Approach:**
  - Store shape: `persona` (active, editable), `results` (FireResults | null), `isCalculating` (boolean), `error` (string | null), `activePersonaId` (string)
  - Actions: `setPersona(persona)`, `updatePersona(partial)`, `resetPersona(templateId)`, `setResults(results)`, `setCalculating(boolean)`, `setError(string | null)`
  - Use `persist` middleware with `partialize` to only save persona data and activePersonaId (not results, isCalculating, or error)
  - Configure persist `version: 1` with a `migrate` function that handles unknown/old versions by resetting to default persona
  - Storage key: `fire-copilot-store`
  - On persona change, set `isCalculating: true` and trigger recalculation (the actual worker call is wired in Unit 9)

  **Patterns to follow:**
  - TECH_STACK.md Zustand store structure
  - Zustand `persist` middleware with `partialize`

  **Test scenarios:**
  - Happy path: Store initializes with default persona
  - Happy path: `updatePersona` merges partial updates correctly
  - Happy path: `resetPersona` restores original template data
  - Edge case: `partialize` excludes `results`, `isCalculating`, and `error` from persistence
  - Happy path: Schema version is persisted; stale/missing version triggers migration to defaults
  - Happy path: Store persists persona data across simulated page reloads

  **Verification:**
  - Store actions work correctly in unit tests
  - Only persona data is persisted (not computed results)

- [ ] **Unit 4: Persona Data**

  **Goal:** Define the 4 sample personas with all financial data as specified in PLAN.md.

  **Requirements:** R4

  **Dependencies:** Unit 2

  **Files:**
  - Create: `src/data/personas.ts`
  - Create: `src/data/constants.ts`

  **Approach:**
  - Define each persona as a `PersonaTemplate` object with all fields from PLAN.md:
    1. Early Career Saver: age 27, $75K income, $40K savings (TFSA/RRSP/non-reg split), $3,200/mo spending, renting
    2. Mid-Career Couple: ages 35 & 33, $160K combined, $320K savings, $5,800/mo spending, mortgage
    3. Almost There: age 42, $110K income, $850K savings, $3,500/mo spending, renting
    4. Just FIREd: age 38, $0 income (retired), $1.1M portfolio, $3,400/mo spending, yield shield + cash cushion
  - Constants: default withdrawal rate (4%), historical real return (7%), standard deviation (15%), inflation rate (2%), default Monte Carlo runs (1000), simulation years (50)
  - Each persona includes a short description and "why interesting" summary for the card UI

  **Patterns to follow:**
  - PLAN.md persona definitions (exact numbers)
  - RESEARCH.md for financial constants

  **Test scenarios:**
  - Happy path: Each persona satisfies the Persona/PersonaTemplate type
  - Edge case: "Just FIREd" persona has $0 income and retirementStatus = retired
  - Edge case: "Mid-Career Couple" persona has partner fields populated

  **Verification:**
  - All 4 personas type-check correctly
  - Constants are sourced from RESEARCH.md values

- [ ] **Unit 5: Persona Selector Page**

  **Goal:** Build the landing page with 4 persona cards that users click to explore.

  **Requirements:** R5

  **Dependencies:** Units 1, 3, 4

  **Files:**
  - Create: `src/components/persona/PersonaSelector.tsx`
  - Create: `src/components/persona/PersonaCard.tsx`
  - Modify: `src/app/App.tsx`

  **Approach:**
  - Landing page shows a header ("FIRE Co-Pilot" + tagline) and a grid of 4 persona cards
  - Each card shows: persona name, age, key stats (income, savings, savings rate, FIRE type), short description
  - Clicking a card sets the active persona in the store and transitions to the dashboard view
  - Use shadcn/ui Card component with hover effects
  - App.tsx manages view state: 'selector' | 'dashboard' (simple state, no router needed for V1)
  - Design principle: "Show the answer first" — cards preview key FIRE stats
  - Clean, confident, fintech aesthetic with lots of whitespace

  **Patterns to follow:**
  - shadcn/ui Card component
  - PLAN.md design principles (show answer first, beautiful defaults)

  **Test scenarios:**
  - Happy path: All 4 persona cards render with correct names and key stats
  - Happy path: Clicking a card updates the store's active persona
  - Happy path: Clicking a card transitions to dashboard view

  **Verification:**
  - Landing page renders 4 cards with correct persona data
  - Clicking a card loads that persona into the store and shows the dashboard

- [ ] **Unit 6: Editable Data Panel**

  **Goal:** Build the sidebar panel where all persona financial fields are editable via sliders and inputs.

  **Requirements:** R6

  **Dependencies:** Units 1, 3, 5

  **Files:**
  - Create: `src/components/persona/PersonaEditor.tsx`
  - Create: `src/components/persona/FieldGroup.tsx`
  - Create: `src/components/dashboard/DashboardLayout.tsx`

  **Approach:**
  - DashboardLayout: two-column layout — editor sidebar (left/collapsible) + main content area (right)
  - PersonaEditor: grouped sections — Personal (age), Income, Spending, Accounts (TFSA/RRSP/non-reg/cash balances), Housing
  - Input types per TECH_STACK.md:
    - Currency amounts: `react-currency-input-field` with CAD formatting
    - Percentages: shadcn Slider + Input combo
    - Age/years: shadcn Input with type="number" and min/max
    - Toggles: shadcn Switch (owns home, has partner)
    - Dropdowns: shadcn Select (province, FIRE type)
  - All changes flow through `updatePersona()` in the store
  - "Reset to default" button calls `resetPersona(templateId)`
  - "Back to personas" button returns to selector view
  - Every number is editable — design principle from PLAN.md

  **Patterns to follow:**
  - shadcn/ui Slider, Input, Switch, Select, Label components
  - TECH_STACK.md forms guidance (no React Hook Form, direct Zustand updates)
  - PLAN.md design principle: "Every number is editable"

  **Test scenarios:**
  - Happy path: All persona fields render with correct initial values
  - Happy path: Changing an input updates the store
  - Happy path: Currency inputs format correctly (e.g., $75,000)
  - Happy path: Slider changes update the corresponding input and store value
  - Happy path: Reset button restores original persona values
  - Edge case: Input min/max boundaries are enforced (age > 0, income >= 0)

  **Verification:**
  - All persona fields are editable and update the store in real-time
  - Reset restores the persona to its original template values
  - Currency formatting works correctly

- [ ] **Unit 7: Core FIRE Calculations (Pure Functions)**

  **Goal:** Implement FIRE number, savings rate, time-to-FI, and FIRE type classification as pure, testable functions.

  **Requirements:** R7, R8, R9, R11

  **Dependencies:** Unit 2

  **Files:**
  - Create: `src/engine/fire.ts`
  - Test: `src/engine/__tests__/fire.spec.ts`

  **Approach:**
  - `calculateFireNumber(annualExpenses, withdrawalRate)` → FIRE number (expenses / rate)
  - `calculateSavingsRate(annualIncome, annualExpenses)` → percentage (0-100)
  - `calculateYearsToFI(currentPortfolio, annualSavings, fireNumber, realReturnRate)` → years (float). Use the compound growth formula: ln((FI * r + savings) / (portfolio * r + savings)) / ln(1 + r)
  - `classifyFireType(annualSpending, portfolio, annualIncome)` → FireType enum. Lean (<$40K), Traditional ($40K-$100K), Fat ($100K+), Barista (has some income + portfolio < full FIRE number), Coast (portfolio will reach FIRE number with zero additional savings by target age)
  - `calculateFireDate(yearsToFI)` → Date (today + yearsToFI, or null if already FIREd)
  - `calculateFireProgress(currentPortfolio, fireNumber)` → percentage (0-100+)
  - `calculatePortfolioTotal(accounts)` → sum of all account balances
  - All functions are pure — no side effects, no React, no store access
  - Handle edge cases: $0 income (retired persona), $0 expenses (degenerate), negative savings rate

  **Patterns to follow:**
  - RESEARCH.md formulas and thresholds
  - TECH_STACK.md: engine/ is pure TypeScript, zero React imports

  **Test scenarios:**
  - Happy path: FIRE number at 4% withdrawal = expenses x 25 ($40K → $1M)
  - Happy path: FIRE number at 3.5% withdrawal = expenses x ~28.57
  - Happy path: Savings rate for $75K income, $38.4K expenses = 48.8%
  - Happy path: Years to FI matches expected result for Early Career Saver persona
  - Happy path: Classify $35K spending as Lean FIRE
  - Happy path: Classify $60K spending as Traditional FIRE
  - Happy path: Classify $120K spending as Fat FIRE
  - Edge case: $0 income returns 0% savings rate (retired persona, not NaN or error)
  - Edge case: Portfolio already exceeds FIRE number returns 0 years to FI
  - Edge case: $0 annual savings with nonzero portfolio below FIRE number returns finite years (compound growth only)
  - Edge case: $0 annual savings AND $0 portfolio returns Infinity or appropriate sentinel
  - Edge case: 0% real return rate is handled without division by zero (fallback to linear projection)
  - Integration: Just FIREd persona ($0 income, retired) — savings rate returns 0 (not NaN), years to FI returns 0, FIRE type classifies correctly
  - Edge case: FIRE progress can exceed 100% (already past FIRE number)
  - Integration: Running all calculations for each of the 4 personas produces valid, reasonable results

  **Verification:**
  - All pure functions pass unit tests with known inputs/outputs
  - Each of the 4 personas produces reasonable FIRE numbers when passed through the engine

- [ ] **Unit 8: Monte Carlo Simulation**

  **Goal:** Implement Monte Carlo simulation that runs 500-1000 portfolio projection paths and returns probability/percentile data.

  **Requirements:** R10

  **Dependencies:** Unit 7

  **Files:**
  - Create: `src/engine/monteCarlo.ts`
  - Test: `src/engine/__tests__/monteCarlo.spec.ts`

  **Approach:**
  - `runMonteCarloSimulation(params)` → MonteCarloResults
  - Parameters: starting portfolio, annual contribution (or withdrawal if retired), years to simulate, number of runs (default 1000), mean real return (default 7%), return std dev (default 15%)
  - Each run: simulate year-by-year portfolio with randomized annual returns drawn from log-normal distribution
  - For accumulating personas: add annual savings each year, check if portfolio reaches FIRE number
  - For retired personas: subtract annual expenses each year, check if portfolio hits zero (failure)
  - Collect all paths, compute: success rate, percentile bands (p10, p25, p50, p75, p90) at each year, median years to FI
  - Use seeded random for reproducible tests (accept optional seed parameter)
  - This is pure TypeScript — the Web Worker wrapper is Unit 9

  **Patterns to follow:**
  - RESEARCH.md historical success rates for validation
  - TECH_STACK.md: pure computation, no React

  **Test scenarios:**
  - Happy path: 1000 runs with known seed produce deterministic results
  - Happy path: Success rate for 4% withdrawal on $1M over 30 years is approximately 95% (within reasonable variance)
  - Happy path: Percentile bands are ordered (p10 < p25 < p50 < p75 < p90 at each year)
  - Happy path: Accumulating persona with high savings rate shows high success probability
  - Edge case: 0 starting portfolio with positive savings still projects growth
  - Edge case: Retired persona with very high withdrawal rate shows low success rate
  - Edge case: Single run (runs=1) returns valid results
  - Integration: Monte Carlo results for "Almost There" persona show reasonable 1-3 year FI timeline at p50

  **Verification:**
  - Monte Carlo produces statistically reasonable results matching RESEARCH.md historical ranges
  - Percentile bands are monotonically ordered
  - Deterministic with seeded random

- [ ] **Unit 9: Web Worker + Comlink Integration**

  **Goal:** Wrap the FIRE engine and Monte Carlo simulation in a Web Worker so calculations don't block the UI.

  **Requirements:** R10

  **Dependencies:** Units 7, 8

  **Files:**
  - Create: `src/engine/worker.ts`
  - Create: `src/engine/useFireEngine.ts` (React hook that manages worker lifecycle)
  - Modify: `vite.config.ts` (worker config if needed)

  **Approach:**
  - `worker.ts`: Import fire.ts and monteCarlo.ts functions, expose via Comlink
  - Expose a single `calculate(persona: Persona)` function that runs all calculations and returns `FireResults`
  - `useFireEngine` hook: creates worker on mount, destroys on unmount, exposes `calculate` function
  - Hook watches persona changes in Zustand store, debounces (300ms), then calls worker
  - Track a monotonically increasing request ID; on result, check ID matches latest before applying to store via `setResults()` and `setCalculating(false)`. Discard stale results.
  - Handle worker errors gracefully — set `error` in store via `setError()`, set `isCalculating: false`

  **Patterns to follow:**
  - TECH_STACK.md Comlink usage pattern
  - TECH_STACK.md debounce approach

  **Test scenarios:**
  - Happy path: Worker receives persona data and returns valid FireResults
  - Happy path: Debounce prevents rapid recalculation — rapid slider changes (<100ms apart) trigger only one calculation after 300ms idle
  - Happy path: Stale results are discarded — if a new calculation starts before the previous one returns, only the latest result is applied to the store (use monotonic request ID)
  - Edge case: Worker handles invalid persona data without crashing — sets error state in store
  - Integration: Changing persona in store triggers worker calculation and store update

  **Verification:**
  - Calculations run off main thread (UI stays responsive during Monte Carlo)
  - Store updates with results after worker completes
  - Debouncing works — rapid changes don't flood the worker

- [ ] **Unit 10: Results Display + Wiring**

  **Goal:** Wire everything together — display calculation results in the dashboard alongside the editor panel.

  **Requirements:** R7, R8, R9, R10, R11

  **Dependencies:** Units 6, 9

  **Files:**
  - Create: `src/components/dashboard/ResultsPanel.tsx`
  - Create: `src/components/dashboard/MetricCard.tsx`
  - Modify: `src/components/dashboard/DashboardLayout.tsx`
  - Modify: `src/app/App.tsx`

  **Approach:**
  - ResultsPanel: displays key metrics from `FireResults` in the store
  - MetricCard: reusable card showing label, value, optional subtitle (e.g., "FIRE Number" / "$1,042,000" / "Based on 4% withdrawal rate")
  - Key metrics to display: FIRE Date (hero-sized, the primary answer), FIRE Number, Years to FI, Monte Carlo Success Rate (%), Savings Rate (%), FIRE Progress (%), FIRE Type badge, Portfolio Total
  - Monte Carlo percentile summary: "Your portfolio has a X% chance of lasting Y years"
  - Show loading state while worker is calculating (`isCalculating` from store)
  - Wire `useFireEngine` hook in App.tsx or DashboardLayout so it runs on mount and persona changes
  - Format currencies as CAD, percentages with 1 decimal, years with 1 decimal

  **Patterns to follow:**
  - shadcn/ui Card, Badge components
  - PLAN.md design principles: show the answer first, clean fintech aesthetic

  **Test scenarios:**
  - Happy path: All metric cards render with correct formatted values for default persona
  - Happy path: Changing persona updates all displayed metrics
  - Happy path: Loading state shows while worker is calculating
  - Edge case: "Just FIREd" persona shows relevant post-retirement metrics (withdrawal rate instead of savings rate)
  - Integration: Full flow — select persona → editor loads → results calculate → metrics display

  **Verification:**
  - Dashboard shows correct FIRE calculations for each of the 4 personas
  - Editing a field in the sidebar causes results to recalculate and display updates
  - Loading state appears during calculation

## System-Wide Impact

- **Interaction graph:** Persona edits → Zustand store → debounce → Web Worker → Zustand store → React re-render. This is the core data flow for the entire app.
- **Error propagation:** Worker errors caught in `useFireEngine` and surfaced via `error` field in store. UI distinguishes loading, error, and no-data states.
- **State lifecycle risks:** localStorage persistence uses Zustand persist `version` field with `migrate` function. Stale/incompatible schema versions reset to defaults.
- **Unchanged invariants:** The 4 planning docs (RESEARCH.md, PRODUCT.md, PLAN.md, TECH_STACK.md) are read-only references — this implementation does not modify them.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Tailwind v4 breaking changes from v3 patterns | Use CSS-first config (v4 default), check docs for any syntax changes |
| shadcn/ui + Tailwind v4 compatibility | shadcn/ui supports Tailwind v4 as of early 2026; use latest shadcn CLI |
| Monte Carlo perf on low-end devices | Web Worker ensures UI stays responsive; 1000 runs is conservative |
| Recharts v3 is relatively new | Install in Phase 3 when charts are actually built; not included in Phase 1/2 deps |

## Sources & References

- **Origin documents:** PLAN.md, TECH_STACK.md, PRODUCT.md, RESEARCH.md (all in project root)
- FIRE math formulas: RESEARCH.md "Core FIRE Math" and "The 4% Rule — Deep Dive" sections
- Persona definitions: PLAN.md "Sample Personas" section
- Tech decisions: TECH_STACK.md (full rationale for each choice)
- Trinity Study (1998): 4% withdrawal rule historical success rates
- Bengen (1994): Original safe withdrawal rate research
