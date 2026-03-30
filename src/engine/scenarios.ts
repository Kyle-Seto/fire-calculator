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
    accounts: persona.accounts.map((a) => ({ ...a })),
    housing: { ...persona.housing },
    partner: persona.partner ? { ...persona.partner } : undefined,
  };
}

export const SCENARIOS: Scenario[] = [
  {
    id: "buy-house",
    name: "Buy a House",
    description:
      "Convert rent to mortgage with a $100K down payment. Housing costs rise ~30%.",
    icon: "\u{1F3E0}",
    apply: (persona) => {
      const p = clonePersona(persona);
      const currentHousing = p.housing.monthlyAmount;
      p.housing = {
        type: "own",
        monthlyAmount: Math.round(currentHousing * 1.3),
        mortgageRemaining: 500_000,
      };
      // Deduct down payment from non-registered savings first, then others
      let remaining = 100_000;
      for (const account of p.accounts) {
        if (remaining <= 0) break;
        if (account.type === "NonRegistered" || account.type === "Cash") {
          const deduction = Math.min(account.balance, remaining);
          account.balance -= deduction;
          remaining -= deduction;
        }
      }
      // If still remaining, pull from other accounts
      for (const account of p.accounts) {
        if (remaining <= 0) break;
        const deduction = Math.min(account.balance, remaining);
        account.balance -= deduction;
        remaining -= deduction;
      }
      return p;
    },
  },
  {
    id: "market-crash",
    name: "Market Crash Year 1",
    description: "A 40% market crash hits all account balances immediately.",
    icon: "\u{1F4C9}",
    apply: (persona) => {
      const p = clonePersona(persona);
      for (const account of p.accounts) {
        account.balance = Math.round(account.balance * 0.6);
      }
      return p;
    },
  },
  {
    id: "part-time",
    name: "Go Part-Time (Barista FIRE)",
    description: "Cut your income in half and coast toward FI.",
    icon: "\u2615",
    apply: (persona) => {
      const p = clonePersona(persona);
      p.annualIncome = Math.round(p.annualIncome * 0.5);
      if (p.partner) {
        p.partner = { ...p.partner };
      }
      return p;
    },
  },
  {
    id: "move-cheaper",
    name: "Move Somewhere Cheaper",
    description:
      "Relocate for 30% lower spending and 40% lower housing costs.",
    icon: "\u2708\uFE0F",
    apply: (persona) => {
      const p = clonePersona(persona);
      p.monthlySpending = Math.round(p.monthlySpending * 0.7);
      p.housing = {
        ...p.housing,
        monthlyAmount: Math.round(p.housing.monthlyAmount * 0.6),
      };
      return p;
    },
  },
  {
    id: "save-more",
    name: "Increase Savings by $500/mo",
    description: "Trim $500 from monthly spending toward investments.",
    icon: "\u{1F4B0}",
    apply: (persona) => {
      const p = clonePersona(persona);
      p.monthlySpending = Math.max(0, p.monthlySpending - 500);
      return p;
    },
  },
  {
    id: "high-inflation",
    name: "Inflation at 4%",
    description:
      "Persistent high inflation raises real costs by ~15%.",
    icon: "\u{1F4C8}",
    apply: (persona) => {
      const p = clonePersona(persona);
      p.monthlySpending = Math.round(p.monthlySpending * 1.15);
      return p;
    },
  },
];

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
