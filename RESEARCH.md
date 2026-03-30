# FIRE Calculator Research

## The Inspiration: Kristy Shen & Bryce Leung

Both computer engineers from the **University of Waterloo**, based in Toronto.

- **Retired at 31** with ~$1M portfolio by saving aggressively and NOT buying a house
- Blog: [millennial-revolution.com](https://www.millennial-revolution.com)
- Book: "Quit Like a Millionaire" (Penguin Random House, 2019) — bestseller
- New book (March 2026): "Parent Like a Millionaire (Without Being One)"
- Full-time nomads since 2015, spending roughly the same travelling as living in Toronto
- Key insight: "It's not how much you earn, it's how much you save"
- Recommended resources: JL Collins "The Simple Path to Wealth", ChooseFI podcast

---

## Core FIRE Math

### The Basic Formula

```
FIRE Number = Annual Expenses x 25
```

This is the inverse of the **4% Rule** (Trinity Study, 1998): withdraw 4% in year one, adjust for inflation annually. 95% historical success over 30 years (50/50 stock/bond portfolio, 1926-1995 data).

### Savings Rate to Financial Independence

| Savings Rate | Years to FI |
|---|---|
| 10% | 51 |
| 25% | 32 |
| 50% | 17 |
| 65% | 10.5 |
| 75% | 7 |

Assumes starting from zero, 5% real (inflation-adjusted) return.

### FIRE Variants

| Type | Annual Spending | Approx FIRE Number | Key Tradeoff |
|---|---|---|---|
| Lean FIRE | Under $40K | Under $1M | Less margin for error |
| Traditional FIRE | $40K-$80K | $1M-$2M | Balanced approach |
| Fat FIRE | $100K+ | $2.5M+ | Longer accumulation phase |
| Barista FIRE | Varies | 60-80% of full FIRE number | Requires some earned income |
| Coast FI | Varies | Milestone, not final target | Relies on time and compounding |

---

## The 4% Rule — Deep Dive

### Origin

- William Bengen's 1994 research found safe withdrawal rate of ~4.15%, rounded to 4%
- Trinity Study (1998) confirmed: 4% initial withdrawal, inflation-adjusted annually, survived 95% of 30-year historical periods
- Key misconception: it's NOT "withdraw 4% of current portfolio each year" — it's "withdraw 4% in year one, then adjust that dollar amount for inflation"

### 2026 Updates

- **Bengen** raised his number to **4.7%** with diversified multi-asset portfolios (7 asset classes)
- **Morningstar** says the safe rate is **3.9%** using forward-looking Monte Carlo simulation
- Shiller CAPE ratio near 40 (matched only by dot-com bubble) suggests lower future returns
- For **FIRE (40-60 year horizons)**: recommended **3.25-3.5%** with dynamic adjustments

### Historical Success Rates by Time Horizon

| Withdrawal Rate | 30 Years | 40 Years | 50 Years | 60 Years |
|---|---|---|---|---|
| 3.0% | ~100% | ~99% | ~98% | ~96% |
| 3.5% | ~100% | ~97% | ~95% | ~92% |
| 4.0% | ~96% | ~93% | ~90% | ~85% |
| 4.5% | ~89% | ~82% | ~77% | ~72% |

Based on 75% stock / 25% bond allocation.

### Taxes Reduce Your Real Withdrawal Rate

| Account Type | $40K Withdrawal | Tax Owed | After-Tax Spending | Effective Rate |
|---|---|---|---|---|
| Roth IRA/401(k) | $40,000 | $0 | $40,000 | 4.0% |
| Traditional IRA (12%) | $40,000 | ~$4,800 | $35,200 | 3.5% |
| Traditional IRA (22%) | $40,000 | ~$8,800 | $31,200 | 3.1% |
| Taxable brokerage (LTCG) | $40,000 | ~$3,000-6,000 | $34,000-37,000 | 3.4-3.7% |

---

## Sequence-of-Returns Risk

The single biggest threat to early retirees. A crash in years 1-5 is catastrophically worse than the same crash in years 15-20, even with identical average returns.

### Example (same average 6.7% return, reversed order):

| Year | Retiree A (early crash) | Balance | Retiree B (late crash) | Balance |
|---|---|---|---|---|
| Start | — | $1,000,000 | — | $1,000,000 |
| 1 | -25% | $710,000 | +30% | $1,260,000 |
| 2 | -5% | $633,300 | +20% | $1,470,800 |
| 6 | +30% | $943,733 | -25% | $1,122,367 |

After 6 years, Retiree A has **$178K less** despite identical average returns.

---

## Kristy & Bryce's Strategies

### 1. Yield Shield (First 3-5 Years of Retirement Only)

A temporary portfolio pivot to combat sequence-of-returns risk:

**Asset Swaps:**
- Bonds → Preferred shares, Corporate bonds (higher yield, still fixed-income-like)
- Domestic equities → Dividend stocks, REITs (higher yield, still equity)
- International equities → Leave alone (foreign exchange risk)

**Effect:** Raises portfolio yield from ~2.3% to ~3.0-3.5%

**Important:** NOT a permanent strategy. Over the long term, yield-focused portfolios underperform pure index. Return to pure indexing after the 3-5 year sequence-of-returns danger zone.

### 2. Cash Cushion

```
Cash Cushion = (Annual Expenses - Portfolio x Yield%) x Years of Cushion
```

**Examples:**
- Without Yield Shield (2.5% yield on $1M, $40K expenses): Gap = $15K/yr → 5yr cushion = $75K
- With Yield Shield (3.4% yield on $1M, $40K expenses): Gap = $6K/yr → 5yr cushion = $30K

Refill the cash cushion from capital gains during bull markets.

### 3. Combined Effect

2008 GFC backtesting showed the Yield Shield + Cash Cushion **outperformed** a traditional 60/40 portfolio because:
- You never sell assets at a loss
- Yield stays relatively steady even during crashes (~$33-35K on $1M)
- Cash cushion covers the gap
- Portfolio recovers with all units intact for the rebound

---

## Modern Withdrawal Strategies (Beyond Fixed 4%)

### 1. Guardrails Method (Guyton-Klinger)

- Set base rate (e.g. 4.5%)
- **Upper guardrail:** If effective rate drops below 3.5% (portfolio surged), raise spending 10%
- **Lower guardrail:** If effective rate rises above 5.5% (portfolio crashed), cut spending 10%
- Morningstar research: dynamic strategies support starting rates near 6%

### 2. Bucket Strategy

| Bucket | Time Horizon | Assets | Purpose |
|---|---|---|---|
| 1 - Cash | 1-2 years | HYSAs, money market | Immediate spending |
| 2 - Bonds | 3-7 years | BND, TIPS, I-bonds | Medium-term stability |
| 3 - Stocks | 8+ years | VOO, VTI, SCHD | Long-term growth |

Never sell stocks in a downturn — spend from cash/bonds while equities recover.

### 3. CAPE-Based Dynamic Withdrawal

| Shiller CAPE | Market Signal | Suggested Rate |
|---|---|---|
| Under 15 | Cheap | 5.0-5.5% |
| 15-25 | Fair | 4.0-4.5% |
| Above 30 | Expensive | 3.0-3.5% |

### 4. Variable Percentage Withdrawal

Adjust withdrawal % based on age and remaining portfolio. Younger retirees withdraw less (3-3.5%); percentage increases as time horizon shortens.

---

## Canadian Tax Optimization (Wealthsimple Angle)

### Account Types

| Account | Contribution | Growth | Withdrawal |
|---|---|---|---|
| TFSA | After-tax | Tax-free | Tax-free |
| RRSP/RRIF | Pre-tax (deductible) | Tax-deferred | Taxed as income |
| Non-registered | After-tax | Taxable (dividends, cap gains) | Only gains taxed |

### Key Strategies

**RRSP Meltdown Strategy:**
Convert RRSP → RRIF in low-income early retirement years. Pay low tax rate on conversions before mandatory withdrawals begin at 71.

**Bracket Filling:**
Intentionally realize income to "fill" the lowest federal bracket (~$57,375 @ 14.5%). Unused low-bracket room is lost forever. Basic Personal Amount makes first ~$16K tax-free.

**Combined Marginal Rates (2025):**
| Jurisdiction | Federal | Provincial | Combined |
|---|---|---|---|
| Ontario | 14.50% | 5.05% | 19.55% |
| British Columbia | 14.50% | 5.06% | 19.56% |

**Tax-Loss Harvesting:**
Wealthsimple already offers automated TLH on managed accounts. Sell losing positions to offset capital gains, immediately reinvest in similar (not identical) assets.

**Optimal Withdrawal Order (Early Retirement):**
1. Draw from non-registered accounts first (only gains taxed, at favorable capital gains rates)
2. Simultaneously do RRSP→RRIF conversions to fill low tax brackets
3. Leave TFSA for last (grows tax-free, no forced withdrawals)

---

## Competitive Landscape — Existing Calculators

| Calculator | Strengths | Weaknesses |
|---|---|---|
| Mustachecalc.com | Simple, beginner-friendly | No tax modeling |
| Mad FIentist FI Lab | Great visualizations, savings rate tracker | US-focused |
| Financial Mentor | Most robust — taxes, asset sales, income changes | Complex UI, not modern |
| FireNum.com | Monte Carlo + historical backtesting | No tax integration |
| QuantFlowLab | Stress test calculator, CAPE-aware | US-only, no account types |
| Boldin | Full retirement planning | Paid, not FIRE-specific |
| Wealthsimple (current) | Clean UI, basic retirement calc | Very basic, no FIRE concepts |

---

## Calculator Feature Ideas (Fintech-Grade)

### Must-Have (Differentiators)

| Feature | Why It Matters |
|---|---|
| **Auto-populate from accounts** | Wealthsimple knows balances, TFSA/RRSP split, contribution room |
| **Tax-aware withdrawal sequencing** | TFSA vs RRSP vs non-reg ordering — biggest gap in market |
| **Monte Carlo simulation** | Show probability of success, not just a single number |
| **Sequence-of-returns stress test** | Show vulnerability in first 5 years |
| **FIRE variant selector** | Lean/Traditional/Fat/Barista/Coast modes |
| **CPP/OAS integration** | Model guaranteed income kicking in at 60/65/70 |
| **Bracket-filling optimizer** | Show optimal RRSP conversion schedule |

### Nice-to-Have

| Feature | Why It Matters |
|---|---|
| Yield Shield modeling | Unique — nobody else has this |
| Guardrails visualization | Interactive "what-if" spending adjustments |
| Coast FI milestone | "You can stop saving aggressively at X" |
| Geographic arbitrage calculator | Model different cost-of-living scenarios (Kristy & Bryce's approach) |
| Savings rate → years to FI chart | The most motivating FIRE visual |
| Tax-loss harvesting impact | Show value of Wealthsimple's existing TLH feature |
| Inflation sensitivity | Toggle inflation assumptions |

### Killer Advantage for Wealthsimple

They already have the user's **actual financial data**: account balances, TFSA/RRSP split, contribution room, portfolio allocation, historical contributions, and tax bracket. No other FIRE calculator can auto-populate all of that. The UX story is: "Connect your accounts → see your FIRE number instantly → optimize."

---

## Sources

- [Millennial Revolution](https://www.millennial-revolution.com) — Kristy & Bryce's blog
- [Quit Like a Millionaire](https://www.quitlikeamillionaire.com) — Their book
- [ChooseFI — FIRE Number](https://www.choosefi.com/financial-independence/fire-number-meaning)
- [ChooseFI — 4% Rule](https://www.choosefi.com/retirement-withdrawal-strategies/four-percent-rule)
- [QuantFlowLab — 4% Rule in 2026](https://quantflowlab.com/4-rule/)
- [Schwab — Beyond the 4% Rule](https://www.schwab.com/learn/story/beyond-4-rule-how-much-can-you-spend-retirement)
- [Vanguard — FIRE & 4% Rule](https://investor.vanguard.com/investor-resources-education/retirement/early-retirement)
- [Oboe — Canadian FIRE Withdrawal Strategies](https://oboe.com/learn/advanced-canadian-fire-withdrawal-strategies-pn3ow6)
- [Million Dollar Journey — RRSP/TFSA Withdrawals](https://milliondollarjourney.com/withdrawing-from-your-rrsp-tfsa-and-non-registered-accounts-for-retired-canadians.htm)
- [Freedom Is Everything — Kristy & Bryce Interview](https://www.freedomiseverything.com/how-to-retire-in-your-early-30s-and-wander-the-world-kristy-shen-bryce-leungs-story/)
