# Build Plan: FIRE Co-Pilot V1 (Sample Data Mode)

## Approach

Skip account connection, auth, and backend entirely. Ship a fully client-side FIRE co-pilot powered by editable sample personas. Users land on a persona that looks like them, tweak the numbers, and immediately see their FIRE path + recommendations.

This validates the core product experience (calculations, visualizations, recommendation engine) before investing in data plumbing.

---

## Sample Personas (Editable)

### 1. "Early Career Saver"
- **Age:** 27
- **Income:** $75,000 salary
- **Savings:** $40,000 ($18K TFSA, $12K RRSP, $10K non-registered)
- **Monthly spending:** $3,200
- **Savings rate:** ~49%
- **Housing:** Renting in Toronto ($1,800/mo)
- **Debt:** None
- **FIRE type:** Traditional FIRE
- **Why interesting:** Classic FIRE starter. Shows the power of savings rate + compounding. Demonstrates TFSA vs RRSP contribution ordering at this income level.

### 2. "Mid-Career Couple"
- **Ages:** 35 & 33
- **Combined income:** $160,000 ($95K + $65K)
- **Savings:** $320,000 ($80K TFSA x2, $100K RRSP combined, $60K non-registered)
- **Monthly spending:** $5,800
- **Savings rate:** ~35%
- **Housing:** Mortgage ($420K remaining, $2,200/mo)
- **Kids:** 1 (age 3)
- **FIRE type:** Traditional FIRE
- **Why interesting:** The messy middle. Tax optimization matters most. Shows mortgage payoff vs invest tradeoff, RESP considerations, income splitting, spousal RRSP strategy.

### 3. "Almost There"
- **Age:** 42
- **Income:** $110,000
- **Savings:** $850,000 ($69.5K TFSA, $380K RRSP, $400.5K non-registered)
- **Monthly spending:** $3,500
- **Savings rate:** ~55%
- **Housing:** Renting ($1,400/mo, moved to smaller city)
- **Debt:** None
- **FIRE type:** Lean FIRE
- **Why interesting:** 1-2 years from FI. Yield Shield + Cash Cushion planning becomes relevant. Shows pre-retirement moves: building cash cushion, tax-loss harvesting, Yield Shield pivot planning.

### 4. "Just FIREd"
- **Age:** 38
- **Income:** $0 (retired)
- **Portfolio:** $1,100,000 ($69.5K TFSA, $450K RRSP, $580.5K non-registered)
- **Monthly spending:** $3,400
- **Withdrawal strategy:** Yield Shield + Cash Cushion
- **Cash cushion:** $25,000
- **Portfolio yield:** 3.2%
- **FIRE type:** Traditional FIRE (post-retirement)
- **Why interesting:** Withdrawal phase. Sequence-of-returns risk visualization. Shows RRSP meltdown strategy, bracket filling, when to draw from which account, CPP/OAS timing.

---

## Features (Build Order)

### Phase 1: Foundation
1. **Project scaffold** — Next.js 14 (App Router) + Tailwind CSS + TypeScript
2. **Sample persona data model** — TypeScript types for all financial data (accounts, income, expenses, tax situation, goals)
3. **Persona selector** — Landing page with 4 persona cards, click to explore
4. **Editable data panel** — Sidebar/panel where all persona fields are editable with sliders and inputs

### Phase 2: Core Engine
5. **FIRE number calculator** — Annual expenses x 25 (adjustable multiplier for withdrawal rate)
6. **Savings rate calculator** — From income and spending data
7. **Time to FI projection** — Based on current savings rate, portfolio value, expected returns
8. **Monte Carlo simulation** — 500-1000 runs, show probability of success, percentile bands (runs in browser via Web Worker)
9. **FIRE type classifier** — Lean / Traditional / Fat / Barista / Coast based on spending level and portfolio

### Phase 3: Dashboard & Visualization
10. **Progress dashboard** — FIRE % complete, net worth over time chart, FIRE date countdown
11. **Savings rate → years to FI chart** — The most motivating FIRE visual
12. **Portfolio projection chart** — Fan chart showing Monte Carlo percentile bands (10th/25th/50th/75th/90th)
13. **Account breakdown** — TFSA / RRSP / non-registered split visualization
14. **Spending breakdown** — Categorized spending with "what if I cut X" interactivity

### Phase 4: Recommendation Engine
15. **"Next Move" engine** — Rule-based recommendations based on persona state:
    - TFSA room available → "Max your TFSA"
    - RRSP contribution optimal → "Contribute $X to RRSP for $Y tax savings"
    - High non-reg gains → "Consider tax-loss harvesting"
    - Close to FI → "Start building Cash Cushion"
    - Post-FI year 1-5 → "Yield Shield active — here's your pivot plan"
    - Market crash while retired → "Draw from Cash Cushion, don't sell equities"
16. **Recommendation explanations** — Each recommendation shows the math and links to the concept (4% rule, Yield Shield, bracket filling, etc.)

### Phase 5: Scenario Modeling
17. **What-if toggles:**
    - "What if I buy a house?" (add mortgage, remove rent)
    - "What if the market drops 40% in year 1?"
    - "What if I go part-time?" (Barista FIRE)
    - "What if I move somewhere cheaper?" (geographic arbitrage)
    - "What if I delay CPP to 70?"
    - "What if inflation is 4% instead of 2%?"
18. **Scenario comparison** — Side-by-side FIRE date and lifetime wealth delta

### Phase 6: Post-FIRE Tools (for "Just FIREd" persona)
19. **Withdrawal strategy visualizer** — Show account drawdown order (non-reg → RRSP meltdown → TFSA last)
20. **Bracket filling optimizer** — "You have $X of room in the 14.5% bracket. Convert $X of RRSP."
21. **Yield Shield dashboard** — Current yield vs expenses gap, cash cushion status, when to unwind
22. **Sequence-of-returns stress test** — "If 2008 happened in your first year, here's what happens"
23. **Guardrails visualization** — Current effective withdrawal rate vs upper/lower guardrails

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | Fast, modern, great for dashboards |
| Styling | Tailwind CSS | Rapid UI development, responsive |
| Language | TypeScript | Type safety for financial calculations |
| Charts | Recharts or Tremor | Clean, composable, React-native |
| State | Zustand or React Context | Lightweight, no backend needed |
| Monte Carlo | Web Worker | Non-blocking computation in browser |
| Hosting | Vercel | Zero-config deploy, free tier |
| Backend | None (V1) | All client-side, localStorage for persistence |
| Data persistence | localStorage | Save modified personas between sessions |

---

## Design Principles

1. **Show the answer first, let them explore.** Don't make users fill out a form before seeing value. Show the persona's FIRE path immediately. Let curiosity drive exploration.

2. **Every number is editable.** Click any number on the dashboard to change it. Watch everything recalculate in real time. This is the "spreadsheet feel" that power users love, wrapped in a beautiful UI.

3. **Recommendations over raw data.** The dashboard isn't just charts — it's an opinionated co-pilot. "Here's what you should do next" is more valuable than "here's 12 charts."

4. **Teach as you go.** First mention of "Yield Shield"? Tooltip explains it. First time seeing Monte Carlo? Brief explainer. The product makes FIRE concepts accessible without requiring the user to have read 10 blog posts first.

5. **Canadian-first, not Canadian-only.** TFSA/RRSP/CPP/OAS are first-class. But the core engine (FIRE number, savings rate, Monte Carlo) works universally. International expansion is a toggle, not a rewrite.

6. **Beautiful defaults, ugly is opt-in.** The dashboard should look like something Wealthsimple would ship. Clean, confident, lots of whitespace. Power-user complexity is progressive disclosure — it's there if you want it.

---

## What Success Looks Like

- Someone lands on the page, picks a persona, and within 30 seconds says "oh wow, that's basically me"
- They tweak 3-4 numbers and watch their FIRE date shift in real time
- They read a recommendation and think "I didn't know that — I should actually do this"
- They share it with a friend: "check out this FIRE calculator, pick the persona that matches you"
- Power users spend 20+ minutes exploring scenarios and come back monthly
