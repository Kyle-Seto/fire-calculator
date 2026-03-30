# Tech Stack Decisions

## Guiding Constraints

- **Fully client-side** — no backend, no auth, no database for V1
- **Data lives in the browser** — modified personas persist via localStorage
- **Heavy computation** (Monte Carlo) must not block UI
- **Must look like a modern fintech product** — Wealthsimple-quality design
- **Extensible later** — can add backend, Plaid, auth without a rewrite

---

## Framework: Vite + React

**Not Next.js.** Here's why:

| Factor | Vite + React | Next.js |
|---|---|---|
| SSR/SEO needed? | No — it's a tool, not a content site | Overkill |
| Dev server speed | ~50ms HMR | Slower (Turbopack improving but still heavier) |
| Mental model | Simple SPA — one mode | SSR, RSC, client components, hydration — complexity we don't need |
| Build time | Sub-second with ESBuild | Slower |
| Migration path | Add Next.js later if we need SEO/SSR | — |
| Deploy | Static files → Vercel/Netlify/CloudFlare Pages | Requires Node runtime for SSR features |

Vite is the right tool for a client-side SPA dashboard. Next.js adds SSR, server components, and routing complexity that gives us nothing for a calculator tool. If we later need a marketing site with SEO, we can either add Next.js for that layer or just use Astro for the landing page.

**Version:** Vite 6.x, React 19.x, TypeScript 5.x (strict mode)

---

## UI Components: shadcn/ui

The default for new React projects in 2026. 75K+ GitHub stars.

**Why shadcn/ui:**
- **Copy-paste model** — components live in our repo, no runtime dependency. We own every line of code.
- **Built on Radix primitives** — accessible by default (keyboard nav, ARIA, screen readers). Critical for a financial tool.
- **Tailwind-native** — no CSS-in-JS, no styled-components. Just utility classes.
- **Customizable** — we can modify any component without fighting an abstraction layer.
- **Professional look** — clean, confident, lots of whitespace. Exactly the fintech aesthetic we want.

**Key components we'll use:**
- `Card` — persona cards, metric cards, recommendation cards
- `Slider` — income, expenses, savings rate adjustments
- `Input` — editable financial fields
- `Tabs` — dashboard sections
- `Dialog/Sheet` — scenario details, explanations
- `Tooltip` — FIRE concept explainers
- `Select` — FIRE type, persona picker
- `Progress` — FIRE progress bar

---

## Charts: Recharts v3 + Tremor

**Two-layer approach:**

### Recharts v3 (custom charts)
- 2.4M weekly downloads — dominant React charting library
- Full TypeScript rewrite in v3 (Dec 2024) — proper types, hooks API
- Composable JSX API — each chart element is a React component
- SVG-based — sharp at any resolution, good up to ~5K data points (plenty for us)

**Charts we'll build with Recharts:**
- **Portfolio projection fan chart** — Area chart with Monte Carlo percentile bands (10th/25th/50th/75th/90th)
- **Net worth over time** — Line chart with account-type breakdown
- **Savings rate impact** — Line chart showing years-to-FI at different savings rates
- **Withdrawal phase** — Stacked area showing drawdown from each account type
- **Sequence-of-returns stress test** — Multiple line chart comparing crash scenarios

### Tremor (dashboard components)
- Built on top of Recharts but pre-styled to match shadcn/ui aesthetic
- Ships with dark mode, Tailwind colors, responsive defaults — zero design work

**Dashboard components from Tremor:**
- `BarList` — spending breakdown (category → amount)
- Metric cards with trend indicators — FIRE number, savings rate, years to FI
- Sparklines — inline mini-charts in summary cards
- Donut chart — account type allocation (TFSA / RRSP / non-registered)
- Progress bar — FIRE progress percentage

**Why not Nivo:** We don't need 30+ chart types, Canvas rendering, or geographic maps. Recharts + Tremor covers everything with a smaller bundle and better Tailwind integration.

---

## State Management: Zustand

**The clear winner for client-side global state in 2026.** ~4M weekly downloads, ~1KB bundle.

**Why Zustand:**
- Minimal boilerplate — define a store in 20 lines, use it anywhere
- No Provider required — import and use, no wrapping the app
- Built-in `persist` middleware — saves to localStorage automatically. This is how modified personas survive page reloads.
- Selector pattern — components only re-render when their specific data changes. Critical for a dashboard with many live-updating numbers.
- `devtools` middleware — time-travel debugging in React DevTools
- Computed/derived values via `subscribeWithSelector` or simple selectors

**Store structure:**

```typescript
// Conceptual — not final code
interface FireStore {
  // Active persona (editable copy)
  persona: Persona
  updatePersona: (updates: Partial<Persona>) => void
  resetPersona: (template: PersonaTemplate) => void

  // Calculation results (derived, recalculated on persona change)
  results: FireResults | null
  isCalculating: boolean

  // UI state
  activeTab: string
  selectedScenario: string | null

  // Scenario overrides
  scenarios: Record<string, ScenarioOverride>
}
```

**Why not Jotai:** Jotai's atomic model is elegant for derived state (and FIRE calculations are very derived), but Zustand is simpler for our shape — a single persona object with computed results. If we find ourselves wanting lots of fine-grained derived atoms later, Jotai is an easy migration.

**Why not Redux:** Overkill. No server state, no complex middleware chains, no team of 20 developers. Zustand does everything we need at 1/15th the complexity.

---

## Data Persistence: Zustand persist → localStorage

**For V1, localStorage is perfect:**
- We're storing one persona object (~2-5KB) — well within localStorage's ~5MB limit
- Zustand's `persist` middleware makes this free — just add `persist()` wrapper
- `partialize` option lets us choose exactly what to save (persona data, not UI state)

**Later (V2+):** If we need to store multiple saved scenarios, historical tracking, or larger datasets, we upgrade to **IndexedDB via Dexie.js** — the best IndexedDB wrapper (table-based API, TypeScript-first, `useLiveQuery` hook for React). This is a swap inside the Zustand persist storage adapter — no app code changes.

---

## Computation: Web Worker for Monte Carlo

Monte Carlo with 1000 runs × 50 years = 50,000 iterations of portfolio math. This takes ~100-300ms in JavaScript — fast, but enough to cause a visible UI jank if run on the main thread.

**Solution: Web Worker**

```
Main Thread (React UI)          Web Worker
─────────────────────           ──────────────
User edits persona    ──msg──→  Receives persona data
                                Runs 1000 Monte Carlo sims
                                Calculates percentiles
UI stays responsive   ←─msg──   Returns results
Dashboard updates
```

**Implementation:**
- TypeScript worker file with shared types
- **Comlink** library (~1KB) for ergonomic worker API — call worker functions like normal async functions instead of dealing with `postMessage`/`onmessage`
- Worker runs Monte Carlo + all derived calculations (FIRE number, years to FI, success probability, percentile bands)
- Debounce inputs → recalculate on 300ms idle (so sliding a slider feels smooth)

**Why not WebAssembly:** JS is fast enough for our scale. WASM (Rust/C++) would be overkill — the complexity of the toolchain isn't worth the ~2-3x speedup when we're already under 300ms. If we later add 10,000+ run simulations or historical backtesting across 150 years, we can compile the engine to WASM without changing the Worker API.

---

## Animation: Motion (Framer Motion)

6M weekly downloads. The default React animation library.

**Where we use it:**
- **Number transitions** — FIRE date, savings rate, portfolio value animate smoothly when inputs change
- **Chart transitions** — smooth data updates as personas are edited
- **Panel/tab transitions** — content slides in/out
- **Recommendation cards** — stagger-animate into view
- **Layout animations** — `layoutId` for shared element transitions between persona cards and dashboard

**Bundle:** ~30KB gzipped. Worth it for the polish it adds to a financial dashboard where numbers are constantly recalculating.

---

## Forms & Inputs

**For editable persona fields:**

| Input Type | Solution |
|---|---|
| Currency amounts | `react-currency-input-field` — handles formatting ($75,000), decimal precision, locale |
| Percentages | shadcn `Slider` + `Input` combo — drag or type |
| Age, years | shadcn `Input` with type="number" and min/max |
| Toggles | shadcn `Switch` — "Do you own a home?", "Do you have kids?" |
| Dropdowns | shadcn `Select` — FIRE type, province, withdrawal strategy |

**No form library (React Hook Form) for V1.** We're not submitting forms — we're editing a live data object. Direct Zustand updates on `onChange` are simpler and more responsive. If we add a multi-step onboarding flow later, we bring in React Hook Form then.

---

## Styling: Tailwind CSS v4

- Pairs with shadcn/ui and Tremor natively
- Utility-first — fast iteration, no naming things
- Dark mode via `class` strategy — toggle-ready from day one
- Custom theme tokens for brand colors, spacing

**Design tokens we'll define:**
```css
/* Financial status colors */
--color-fire-green: /* on track */
--color-fire-yellow: /* slightly behind */
--color-fire-red: /* significantly behind */
--color-fire-blue: /* informational */

/* Account type colors (consistent across all charts) */
--color-tfsa: /* Tax-free */
--color-rrsp: /* Registered */
--color-nonreg: /* Non-registered */
--color-cash: /* Cash cushion */
```

---

## Tooling

| Tool | Purpose | Why this one |
|---|---|---|
| **pnpm** | Package manager | Fast installs, disk-efficient, strict dependency resolution |
| **Biome** | Lint + format | Single tool replaces ESLint + Prettier. ~100x faster. Opinionated defaults. |
| **Vitest** | Testing | Vite-native, same config, fast. Jest-compatible API. |
| **TypeScript strict mode** | Type safety | Financial calculations demand it. No `any`, no implicit `undefined`. |

---

## Project Structure

```
fire-calculator/
├── public/
├── src/
│   ├── app/                    # Top-level app shell, routing (if needed)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components (copy-pasted)
│   │   ├── dashboard/          # Dashboard layout, tabs, panels
│   │   ├── charts/             # Chart components (portfolio, spending, etc.)
│   │   ├── persona/            # Persona selector, editor panel
│   │   └── recommendations/    # Recommendation cards, explainers
│   ├── engine/
│   │   ├── fire.ts             # Core FIRE calculations (pure functions)
│   │   ├── monteCarlo.ts       # Monte Carlo simulation logic
│   │   ├── tax.ts              # Canadian tax calculations
│   │   ├── withdrawals.ts      # Withdrawal strategy logic
│   │   ├── recommendations.ts  # "Next move" rule engine
│   │   └── worker.ts           # Web Worker entry point
│   ├── data/
│   │   ├── personas.ts         # Sample persona definitions
│   │   ├── taxBrackets.ts      # Canadian federal/provincial brackets
│   │   └── constants.ts        # FIRE constants (historical returns, inflation, etc.)
│   ├── store/
│   │   └── useFireStore.ts     # Zustand store
│   ├── types/
│   │   └── index.ts            # All TypeScript types
│   └── lib/
│       └── utils.ts            # Shared utilities, formatters
├── RESEARCH.md
├── PRODUCT.md
├── PLAN.md
├── TECH_STACK.md
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── biome.json
└── package.json
```

**Key principle:** `engine/` is pure TypeScript with zero React imports. All calculation logic is testable without rendering anything. This is the most important code in the app — it must be correct.

---

## Dependency Summary

| Package | Size (gzip) | Purpose |
|---|---|---|
| react + react-dom | ~45KB | UI framework |
| recharts | ~50KB | Custom charts |
| @tremor/react | ~70KB | Dashboard components (metric cards, sparklines) |
| zustand | ~1KB | State management + persistence |
| motion (framer-motion) | ~30KB | Animations |
| comlink | ~1KB | Web Worker ergonomics |
| react-currency-input-field | ~5KB | Currency formatting inputs |
| tailwindcss | 0KB runtime | Utility CSS (build-time only) |
| **Total runtime** | **~200KB gzip** | Competitive with any SPA dashboard |

Dev-only: vite, typescript, biome, vitest

---

## Decisions Deferred (Not for V1)

| Decision | When | Notes |
|---|---|---|
| Router (React Router / TanStack Router) | V2 | V1 is single-page. Add routing when we have multiple views. |
| Backend / API | V2 | When we add Plaid, auth, saved plans |
| Database (Supabase / PlanetScale) | V2 | When we need server-side persistence |
| Auth (Clerk / Auth0) | V2 | When we need user accounts |
| React Hook Form | V2 | When we add multi-step onboarding |
| i18n | V3 | When we go beyond English |
| WASM Monte Carlo | Never (probably) | JS is fast enough. Only if we add massive backtesting. |
