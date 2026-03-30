# Product Vision: FIRE Co-Pilot

## The Insight

Every FIRE calculator gives you a number. Nobody gives you a **plan that adapts**.

The market is split into two camps that both fail:
1. **Simple calculators** (FIRECalc, cFIREsim, Engaging Data) — you get a number, close the tab, and never come back. Useful for 5 minutes.
2. **Complex planning tools** (ProjectionLab at $109/yr, Boldin at $144/yr) — powerful but require you to already know your strategy. Manual data entry. Steep learning curve. The #1 complaint: "you need to have a strategy going into it — it's not hand-holding."

Meanwhile, the most common tool FIRE people actually use is **a spreadsheet they built themselves** — because nothing fits their specifics.

Reddit user quote that captures it perfectly:
> "I've used a handful of online retirement calculators. They've told me everything from 'I'm doing great' to 'I'm way behind'."

The trust problem is real. People bounce between 3-4 tools trying to triangulate the truth.

---

## The Product

**A FIRE co-pilot that connects to your real money, calculates your path automatically, and tells you what to do next — not just where you stand.**

It's the layer between "dumb calculator" and "DIY financial planning software." Opinionated like Kristy & Bryce's playbook. Automated like Wealthsimple. Adaptive like a good financial advisor.

### One-line pitch
**"Connect your accounts. See your FIRE date. Get your next move."**

---

## Why This Wins

### 1. Auto-populated from real data (Plaid / Wealthsimple API)

Every other FIRE tool requires manual input. Users guess at their savings rate, misremember account balances, forget about that old 401k. A fintech with account access solves this instantly:

- Current balances across TFSA, RRSP, non-registered, brokerage
- Actual spending (not guessed spending) from transaction history
- Real savings rate calculated automatically
- Contribution room remaining
- Portfolio allocation and actual returns

**This is the moat.** ProjectionLab deliberately doesn't connect to accounts (they see it as a privacy feature). That's an opening — most people would rather have accuracy than manually update numbers every month.

### 2. Opinionated strategy engine (not just math)

Current tools say: "Your FIRE number is $1.2M. Good luck."

This product says: "Your FIRE number is $1.2M. You're 62% there. At your current savings rate, you'll hit it in 8.3 years. **Here's what to do this month:**"

The "next move" engine draws from researched FIRE strategies:

| Situation | Recommendation |
|---|---|
| RRSP contribution room available, income > $60K | "Max your RRSP — you'll save $X in taxes this year and accelerate FI by Y months" |
| TFSA not maxed | "Your TFSA has $X room. Prioritize this — withdrawals are tax-free in retirement" |
| Non-registered gains > $X | "Consider tax-loss harvesting — you have $X in unrealized losses to offset" |
| Approaching FIRE (< 2 years out) | "Start building your Cash Cushion — target $X based on your Yield Shield gap" |
| Just FIREd, year 1-5 | "Sequence-of-returns danger zone. Here's your Yield Shield pivot plan" |
| Market down > 20% while retired | "Don't sell equities. Your Yield Shield covers $X. Draw from Cash Cushion" |

This is where Kristy & Bryce's strategies become product features — not blog posts you have to read and implement yourself.

### 3. Canadian tax intelligence as a first-class feature

The biggest gap in the market. Almost every tool is US-focused. Canadian FIRE has unique complexity:

**Pre-retirement optimization:**
- TFSA vs RRSP contribution ordering based on your marginal rate
- Optimal RRSP contribution amount (not always "max it")
- Tax-loss harvesting in non-registered accounts
- Capital gains inclusion rate optimization

**Post-retirement (the real magic):**
- RRSP Meltdown strategy — show the optimal conversion schedule year by year
- Bracket filling — "You have $X of room in the 14.5% federal bracket this year. Convert $X of RRSP to use it."
- TFSA withdrawal sequencing — when to draw from which account
- CPP/OAS optimization — when to start claiming, clawback thresholds
- GIS eligibility planning for lower-income retirees

No consumer tool does this well. Financial advisors charge $2-5K/yr for this advice. A product that automates it at $10-15/mo is a massive value unlock.

### 4. Living dashboard, not a one-time calculation

The #1 reason people abandon financial tools: there's no reason to come back.

This product gives you:

**Monthly check-in (2 minutes):**
- Balances auto-updated
- FIRE date recalculated
- Savings rate for the month
- "You're X months ahead/behind pace"
- One actionable recommendation

**Quarterly deep dive:**
- Tax optimization moves before deadlines
- Rebalancing suggestions
- FIRE date sensitivity analysis (what if market returns 2% less?)
- Progress visualization (the dopamine hit)

**Annual planning:**
- RRSP contribution deadline reminder with optimal amount
- TFSA room reset notification
- Tax-loss harvesting year-end sweep
- "Year in review" — how much closer you got

### 5. Scenario modeling that actually teaches you

ProjectionLab lets power users model anything. This product models the scenarios that matter and explains why:

**Pre-built scenarios:**
- "What if I get laid off for 6 months?"
- "What if the market crashes 40% in year 1 of retirement?" (sequence-of-returns)
- "What if I move to Portugal?" (geographic arbitrage, a la Kristy & Bryce)
- "What if I go Barista FIRE and earn $20K/yr part-time?"
- "What if I buy a house vs keep renting?" (the Millennial Revolution question)
- "What if I delay CPP to 70?"
- "What if inflation averages 4% instead of 2%?"

Each scenario shows the delta in FIRE date and total lifetime wealth, with a plain-English explanation of *why*.

---

## Competitive Positioning

```
                        Manual Data          Connected Accounts
                            |                       |
                            |                       |
  Simple         FIRECalc   |   Wealthsimple       |
  (one number)   cFIREsim   |   (basic retirement   |
                 firenum    |    calc)              |
                            |                       |
                            |          ** THIS **   |
                            |          ** PRODUCT ** |
                            |                       |
  Complex        Projection |   Boldin (US only)    |
  (full plan)    Lab        |   Empower             |
                 Pralana    |                       |
                            |                       |
```

We sit in the **connected + mid-complexity** quadrant that nobody occupies. Simple enough that you don't need to be a financial planner. Smart enough that it replaces one.

---

## Key Metrics

| Metric | Target | Why |
|---|---|---|
| Time to first FIRE date | < 3 minutes | Connect accounts → see number instantly |
| Monthly active rate | > 60% | Monthly check-in loop |
| Recommendations acted on | > 30% | Proves the "next move" engine works |
| NPS | > 50 | FIRE community is vocal — word of mouth is everything |

---

## Monetization

**Freemium model:**

| Tier | Price | Features |
|---|---|---|
| Free | $0 | Basic FIRE number, savings rate, single scenario |
| Pro | $12/mo ($99/yr) | All scenarios, tax optimization, recommendations engine, withdrawal planning |
| Couples | $18/mo ($149/yr) | Joint planning, spousal RRSP, income splitting optimization |

Undercuts financial advisors ($2-5K/yr) and competes with ProjectionLab ($109/yr) while offering account connectivity and opinionated guidance they don't.

**Expansion revenue:** Partner referrals (Wealthsimple Trade, Questrade) for recommended account actions. User says "open TFSA" → we route to partner. This aligns incentives — we only recommend what's good for the user's FIRE plan.

---

## MVP Scope (V1)

Build the smallest thing that delivers the core insight: **"Here's your FIRE date, calculated from your real data, with one thing to do next."**

### V1 Features:
1. **Account connection** (Plaid) — pull balances + transactions for TFSA, RRSP, non-registered
2. **Automatic FIRE number** — calculate from actual spending (last 12 months of transactions)
3. **Automatic savings rate** — income vs spending, calculated monthly
4. **FIRE date projection** — based on current savings rate + portfolio growth (Monte Carlo, 500 runs)
5. **FIRE type classification** — "You're on a Lean FIRE path" / "This is Fat FIRE territory"
6. **One recommendation** — the single highest-impact action (max TFSA, increase savings rate, etc.)
7. **Progress dashboard** — net worth over time, FIRE % complete, months to go

### V1 Does NOT Include:
- Withdrawal phase planning (V2)
- Yield Shield / Cash Cushion modeling (V2)
- Full tax optimization engine (V2)
- Scenario modeling (V2)
- Couples planning (V3)
- CPP/OAS integration (V3)

### Tech Stack (suggested):
- **Frontend:** Next.js + Tailwind (fast, modern, good for dashboards)
- **Backend:** Node/TypeScript API
- **Data:** Plaid for account aggregation, PostgreSQL for user data
- **Computation:** Monte Carlo engine in TypeScript (runs client-side for speed, server-side for persistence)
- **Auth:** Clerk or Auth0
- **Hosting:** Vercel + Railway/Supabase

---

## Why Now

1. **FIRE is mainstream** — no longer a niche Reddit community. Kristy & Bryce have a second book out. ChooseFI has millions of listeners. The 2025-2026 market volatility is making people think harder about financial independence.

2. **Canadian fintech gap** — Wealthsimple proved Canadians will adopt fintech. But their retirement calculator is embarrassingly basic. Nobody is building FIRE-specific tooling for the Canadian market with proper TFSA/RRSP intelligence.

3. **ProjectionLab proved the market** — solo founder, $109/yr, endorsed by Mr. Money Mustache and Mad Fientist. People will pay for good FIRE planning tools. But PL is deliberately account-disconnected and has a power-user learning curve.

4. **AI makes "next move" recommendations viable** — the opinionated guidance engine would have required a team of financial planners to build in 2020. Now you can encode FIRE strategies + Canadian tax rules and generate personalized recommendations programmatically.

5. **Trust through transparency** — every recommendation shows its math. "We suggest maxing your TFSA because at your marginal rate of 29.65%, the tax-free growth saves you $X over Y years vs non-registered." Users learn FIRE principles by using the product.

---

## Summary

Don't build another calculator. Build the **autopilot for the FIRE journey** — one that knows your real numbers, tells you what to do, and adapts as your life changes. The playbook is already written (Kristy & Bryce, ChooseFI, Big ERN). Nobody has turned it into software that works for real people with real Canadian accounts.

The wedge is: **connect accounts + Canadian tax intelligence + opinionated next-move recommendations.** Everything else is a fast-follow.
