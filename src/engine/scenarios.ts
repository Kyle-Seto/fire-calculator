import type { Persona } from "@/types";
import { calculateAllResults } from "@/engine/fire";
import { DEFAULTS } from "@/data/constants";

// ── Types ──

export type Scenario = {
  id: string;
  name: string;
  description: string;
  icon: string;
  apply: (persona: Persona) => Persona;
};

export type ScenarioResult = {
  scenario: Scenario;
  originalFireDate: Date | null;
  newFireDate: Date | null;
  originalYearsToFI: number;
  newYearsToFI: number;
  deltaMonths: number; // positive = later, negative = earlier
};

// ── Scenario Definitions ──

function clonePersona(persona: Persona): Persona {
  return {
    ...persona,
    assets: persona.assets.map((a) => ({ ...a })),
    liabilities: persona.liabilities.map((l) => ({ ...l })),
    housing: { ...persona.housing },
    partner: persona.partner ? { ...persona.partner } : undefined,
    lifeEvents: persona.lifeEvents?.map((e) => ({ ...e })),
  };
}

export const SCENARIOS: Scenario[] = [
  {
    id: "have-a-kid",
    name: "Have a kid",
    description:
      "Add ~$1,500/mo in child costs. Offset by $560/mo Canada Child Benefit.",
    icon: "\u{1F476}",
    apply: (persona) => {
      const p = clonePersona(persona);
      p.monthlySpending += 1_500;
      // CCB partially offsets
      p.annualIncome += 6_720;
      return p;
    },
  },
  {
    id: "buy-rental-property",
    name: "Buy a rental property",
    description:
      "Put $80K down on a $400K rental. $2,500/mo rent, $1,800/mo costs.",
    icon: "\u{1F3E2}",
    apply: (persona) => {
      const p = clonePersona(persona);
      // Down payment from portfolio
      deductFromPortfolio(p, 80_000);
      // New asset + liability
      p.assets.push({ id: "sc-rental", label: "Rental property", type: "Property", value: 400_000 });
      p.liabilities.push({ id: "sc-rental-mortgage", label: "Rental mortgage", balance: 320_000 });
      // Net rental income ($2,500 rent - $1,800 mortgage/tax/insurance)
      p.annualIncome += 8_400;
      return p;
    },
  },
  {
    id: "quit-for-lower-stress",
    name: "Take a lower-paying job you like",
    description:
      "Drop to 65% of current income for less stress and more time.",
    icon: "\u{1F333}",
    apply: (persona) => {
      const p = clonePersona(persona);
      p.annualIncome = Math.round(p.annualIncome * 0.65);
      return p;
    },
  },
  {
    id: "pay-off-debt",
    name: "Pay off all debt now",
    description:
      "Liquidate portfolio to eliminate all liabilities. No more interest payments.",
    icon: "\u{1F4A8}",
    apply: (persona) => {
      const p = clonePersona(persona);
      const totalDebt = p.liabilities.reduce((s, l) => s + l.balance, 0);
      if (totalDebt > 0) {
        deductFromPortfolio(p, totalDebt);
        p.liabilities = [];
      }
      return p;
    },
  },
  {
    id: "sell-home-rent",
    name: "Sell the house and rent",
    description:
      "Cash out home equity into portfolio. Rent for ~$2,000/mo instead.",
    icon: "\u{1F3E0}",
    apply: (persona) => {
      const p = clonePersona(persona);
      // Find home asset and mortgage liability
      const homeAsset = p.assets.find((a) => a.type === "Property");
      const homeValue = homeAsset?.value ?? 0;
      const mortgageIdx = p.liabilities.findIndex((l) =>
        l.label.toLowerCase().includes("mortgage") || l.label.toLowerCase().includes("heloc"),
      );
      const mortgageBalance = mortgageIdx >= 0 ? p.liabilities[mortgageIdx].balance : 0;
      const equity = homeValue - mortgageBalance;
      // Remove home and mortgage
      p.assets = p.assets.filter((a) => a !== homeAsset);
      if (mortgageIdx >= 0) p.liabilities.splice(mortgageIdx, 1);
      // Add equity to portfolio
      if (equity > 0) {
        addToPortfolio(p, equity);
      }
      // Switch to renting
      p.housing = { type: "rent", monthlyAmount: 2_000 };
      return p;
    },
  },
  {
    id: "move-abroad",
    name: "Move to a cheaper country",
    description:
      "Geo-arbitrage: cut living costs to $2,500/mo all-in (housing + spending).",
    icon: "\u{1F30D}",
    apply: (persona) => {
      const p = clonePersona(persona);
      p.monthlySpending = 1_200;
      p.housing = { ...p.housing, monthlyAmount: 1_300 };
      return p;
    },
  },
  {
    id: "go-back-to-school",
    name: "Go back to school for 2 years",
    description:
      "Spend $30K on tuition, earn $0 for 2 years, then earn 30% more.",
    icon: "\u{1F393}",
    apply: (persona) => {
      const p = clonePersona(persona);
      deductFromPortfolio(p, 30_000);
      // Model as immediate income boost (simplified — the 2 years of $0 hurt more)
      p.annualIncome = Math.round(p.annualIncome * 1.3);
      return p;
    },
  },
  {
    id: "start-side-hustle",
    name: "Start a side business",
    description:
      "Invest $10K upfront. Adds $1,000/mo in net income after year 1.",
    icon: "\u{1F680}",
    apply: (persona) => {
      const p = clonePersona(persona);
      deductFromPortfolio(p, 10_000);
      p.annualIncome += 12_000;
      return p;
    },
  },
];

// ── Helpers for scenario apply functions ──

function deductFromPortfolio(p: Persona, amount: number) {
  const investable = ["NonRegistered", "Cash", "FHSA"];
  let remaining = amount;
  // Non-reg and cash first
  for (const asset of p.assets) {
    if (remaining <= 0) break;
    if (investable.includes(asset.type)) {
      const deduction = Math.min(asset.value, remaining);
      asset.value -= deduction;
      remaining -= deduction;
    }
  }
  // Then anything else
  for (const asset of p.assets) {
    if (remaining <= 0) break;
    const deduction = Math.min(asset.value, remaining);
    asset.value -= deduction;
    remaining -= deduction;
  }
}

function addToPortfolio(p: Persona, amount: number) {
  const nonReg = p.assets.find((a) => a.type === "NonRegistered");
  if (nonReg) {
    nonReg.value += amount;
  } else {
    const cash = p.assets.find((a) => a.type === "Cash");
    if (cash) {
      cash.value += amount;
    } else {
      p.assets.push({ id: "sc-cash", label: "Cash", type: "Cash", value: amount });
    }
  }
}

// ── Custom Decision Builder ──

export type CustomDecision = {
  name: string;
  incomeChange: number;       // $/yr — positive = more income
  spendingChange: number;     // $/mo — positive = more spending
  portfolioChange: number;    // $ — positive = add to portfolio, negative = withdraw
  liabilityChange: number;    // $ — positive = add debt, negative = pay off
};

export function buildCustomScenario(decision: CustomDecision): Scenario {
  return {
    id: `custom-${Date.now()}`,
    name: decision.name || "Custom decision",
    description: "",
    icon: "\u{1F9EA}",
    apply: (persona) => {
      const p = clonePersona(persona);

      p.annualIncome += decision.incomeChange;
      p.monthlySpending += decision.spendingChange;

      // Apply one-time portfolio change to first investable account (or create Cash)
      if (decision.portfolioChange !== 0) {
        const investable = p.assets.find((a) =>
          ["TFSA", "RRSP", "NonRegistered", "Cash"].includes(a.type),
        );
        if (investable) {
          investable.value += decision.portfolioChange;
          if (investable.value < 0) investable.value = 0;
        } else if (decision.portfolioChange > 0) {
          p.assets.push({
            id: "custom-cash",
            label: "Cash",
            type: "Cash",
            value: decision.portfolioChange,
          });
        }
      }

      // Apply liability change
      if (decision.liabilityChange > 0) {
        p.liabilities.push({
          id: `custom-debt-${Date.now()}`,
          label: "New debt",
          balance: decision.liabilityChange,
        });
      } else if (decision.liabilityChange < 0 && p.liabilities.length > 0) {
        let remaining = Math.abs(decision.liabilityChange);
        for (const l of p.liabilities) {
          if (remaining <= 0) break;
          const reduction = Math.min(l.balance, remaining);
          l.balance -= reduction;
          remaining -= reduction;
        }
        p.liabilities = p.liabilities.filter((l) => l.balance > 0);
      }

      return p;
    },
  };
}

// ── Evaluation ──

export function evaluateScenario(
  scenario: Scenario,
  persona: Persona,
  withdrawalRate: number = DEFAULTS.withdrawalRate,
  precomputedBase?: Omit<import("@/types").FireResults, "monteCarloResults">,
): ScenarioResult {
  const original = precomputedBase ?? calculateAllResults(persona, withdrawalRate);
  const modified = scenario.apply(persona);
  const newResults = calculateAllResults(modified, withdrawalRate);

  const originalYears = original.yearsToFI;
  const newYears = newResults.yearsToFI;

  let deltaMonths: number;
  if (!Number.isFinite(newYears) && !Number.isFinite(originalYears)) {
    deltaMonths = 0;
  } else if (!Number.isFinite(newYears)) {
    deltaMonths = Infinity;
  } else if (!Number.isFinite(originalYears)) {
    deltaMonths = -Infinity;
  } else {
    deltaMonths = (newYears - originalYears) * 12;
  }

  return {
    scenario,
    originalFireDate: original.fireDateEstimate,
    newFireDate: newResults.fireDateEstimate,
    originalYearsToFI: originalYears,
    newYearsToFI: newYears,
    deltaMonths,
  };
}

export function evaluateAllScenarios(
  persona: Persona,
  withdrawalRate: number = DEFAULTS.withdrawalRate,
): ScenarioResult[] {
  const base = calculateAllResults(persona, withdrawalRate);
  return SCENARIOS.map((scenario) =>
    evaluateScenario(scenario, persona, withdrawalRate, base),
  ).sort((a, b) => a.deltaMonths - b.deltaMonths);
}
