import type { Persona } from "@/types";
import { DEFAULTS } from "@/data/constants";
import {
  FEDERAL_BRACKETS,
  ONTARIO_BRACKETS,
} from "@/data/taxBrackets";
import { calculateTaxOnWithdrawal } from "@/engine/tax";

// ── Types ──

export type WithdrawalPlan = {
  year: number;
  age: number;
  tfsaWithdrawal: number;
  rrspWithdrawal: number;
  nonRegWithdrawal: number;
  totalWithdrawal: number;
  taxOwed: number;
  afterTaxIncome: number;
  tfsaBalance: number;
  rrspBalance: number;
  nonRegBalance: number;
  totalBalance: number;
};

export type YieldShieldStatus = {
  portfolioYield: number;
  annualYieldIncome: number;
  annualExpenses: number;
  gapAmount: number;
  cashCushionYears: number;
  isFullyCovered: boolean;
};

// ── Helpers ──

function getAccountBalance(persona: Persona, type: string): number {
  return persona.accounts.find((a) => a.type === type)?.balance ?? 0;
}

/**
 * The room available in the lowest combined federal + provincial brackets
 * above the personal amounts. Used for RRSP meltdown optimization.
 */
function lowestBracketCeiling(): number {
  // Federal lowest bracket ceiling
  const fedCeiling = FEDERAL_BRACKETS[0].max;
  // Ontario lowest bracket ceiling
  const ontCeiling = ONTARIO_BRACKETS[0].max;
  // Use the smaller of the two so we stay in the lowest bracket for both
  return Math.min(fedCeiling, ontCeiling);
}

// ── Core Functions ──

/**
 * Generate a year-by-year withdrawal plan for a retired persona.
 *
 * Withdrawal order (tax-optimized):
 *   1. Non-registered first — only capital gains portion is taxed
 *   2. RRSP meltdown — fill lowest tax brackets
 *   3. TFSA last — completely tax-free, no forced withdrawals
 *
 * Each year: withdraw needed amount, apply growth to remaining balances,
 * calculate tax on withdrawals.
 */
export function generateWithdrawalPlan(
  persona: Persona,
  years: number = 30,
): WithdrawalPlan[] {
  const annualExpenses =
    (persona.monthlySpending + persona.housing.monthlyAmount) * 12;
  const growthRate = DEFAULTS.realReturnMean;

  let tfsaBal = getAccountBalance(persona, "TFSA");
  let rrspBal = getAccountBalance(persona, "RRSP");
  let nonRegBal = getAccountBalance(persona, "NonRegistered");

  const plan: WithdrawalPlan[] = [];

  for (let i = 0; i < years; i++) {
    const year = new Date().getFullYear() + i;
    const age = persona.age + i;
    let remaining = annualExpenses;

    let nonRegW = 0;
    let rrspW = 0;
    let tfsaW = 0;

    // Step 1: Non-registered (only gains taxed at 50% inclusion)
    if (remaining > 0 && nonRegBal > 0) {
      nonRegW = Math.min(remaining, nonRegBal);
      nonRegBal -= nonRegW;
      remaining -= nonRegW;
    }

    // Step 2: RRSP meltdown (fill low brackets)
    if (remaining > 0 && rrspBal > 0) {
      rrspW = Math.min(remaining, rrspBal);
      rrspBal -= rrspW;
      remaining -= rrspW;
    }

    // Step 3: TFSA (tax-free)
    if (remaining > 0 && tfsaBal > 0) {
      tfsaW = Math.min(remaining, tfsaBal);
      tfsaBal -= tfsaW;
      remaining -= tfsaW;
    }

    const totalWithdrawal = nonRegW + rrspW + tfsaW;

    // Calculate tax: RRSP is taxable income, non-reg has partial gains tax
    let taxOwed = 0;
    // Tax on RRSP withdrawal (treated as income)
    taxOwed += calculateTaxOnWithdrawal(rrspW, "RRSP", 0);
    // Tax on non-reg withdrawal (only gains portion taxed, on top of RRSP income)
    taxOwed += calculateTaxOnWithdrawal(nonRegW, "NonRegistered", rrspW);
    // TFSA: $0 tax

    const afterTaxIncome = totalWithdrawal - taxOwed;

    // Apply growth to remaining balances
    tfsaBal *= 1 + growthRate;
    rrspBal *= 1 + growthRate;
    nonRegBal *= 1 + growthRate;

    plan.push({
      year,
      age,
      tfsaWithdrawal: tfsaW,
      rrspWithdrawal: rrspW,
      nonRegWithdrawal: nonRegW,
      totalWithdrawal,
      taxOwed,
      afterTaxIncome,
      tfsaBalance: tfsaBal,
      rrspBalance: rrspBal,
      nonRegBalance: nonRegBal,
      totalBalance: tfsaBal + rrspBal + nonRegBal,
    });
  }

  return plan;
}

/**
 * Calculate yield shield status for a retired persona.
 * Returns null if the persona doesn't have portfolioYield set.
 */
export function calculateYieldShield(
  persona: Persona,
): YieldShieldStatus | null {
  if (
    persona.retirementStatus !== "retired" ||
    persona.portfolioYield == null
  ) {
    return null;
  }

  const portfolioTotal = persona.accounts.reduce(
    (sum, a) => sum + a.balance,
    0,
  );
  const annualExpenses =
    (persona.monthlySpending + persona.housing.monthlyAmount) * 12;
  const annualYieldIncome = portfolioTotal * (persona.portfolioYield / 100);
  const gapAmount = Math.max(0, annualExpenses - annualYieldIncome);
  const cashCushion = persona.cashCushion ?? 0;
  const cashCushionYears = gapAmount > 0 ? cashCushion / gapAmount : Infinity;
  const isFullyCovered = annualYieldIncome >= annualExpenses;

  return {
    portfolioYield: persona.portfolioYield,
    annualYieldIncome,
    annualExpenses,
    gapAmount,
    cashCushionYears: Number.isFinite(cashCushionYears)
      ? cashCushionYears
      : Infinity,
    isFullyCovered,
  };
}

/**
 * Calculate how much RRSP to convert to fill the lowest tax bracket.
 * Useful for RRSP meltdown strategy in early retirement.
 */
export function calculateBracketFilling(
  rrspBalance: number,
  currentIncome: number,
): {
  optimalConversion: number;
  taxOnConversion: number;
  bracketRoom: number;
} {
  const ceiling = lowestBracketCeiling();
  // Room in the lowest bracket above current income
  const bracketRoom = Math.max(0, ceiling - currentIncome);
  // Don't convert more than available
  const optimalConversion = Math.min(bracketRoom, rrspBalance);
  // Tax on this conversion (on top of current income)
  const taxOnConversion = calculateTaxOnWithdrawal(
    optimalConversion,
    "RRSP",
    currentIncome,
  );

  return { optimalConversion, taxOnConversion, bracketRoom };
}

/**
 * Simulate a specific crash scenario to test sequence-of-returns risk.
 * Shows portfolio balance year by year over the simulation period.
 */
export function simulateSequenceOfReturns(
  persona: Persona,
  crashYear: number = 1,
  crashMagnitude: number = -0.4,
): {
  yearByYear: { year: number; balance: number }[];
  survived: boolean;
} {
  const portfolioTotal = persona.accounts.reduce(
    (sum, a) => sum + a.balance,
    0,
  );
  const annualExpenses =
    (persona.monthlySpending + persona.housing.monthlyAmount) * 12;
  const normalReturn = DEFAULTS.realReturnMean;
  const simYears = 30;

  let balance = portfolioTotal;
  const yearByYear: { year: number; balance: number }[] = [];
  let survived = true;

  for (let i = 1; i <= simYears; i++) {
    // Withdraw expenses at the start of the year
    balance -= annualExpenses;

    if (balance <= 0) {
      yearByYear.push({ year: i, balance: 0 });
      survived = false;
      // Fill remaining years with 0
      for (let j = i + 1; j <= simYears; j++) {
        yearByYear.push({ year: j, balance: 0 });
      }
      break;
    }

    // Apply return for the year
    const returnRate = i === crashYear ? crashMagnitude : normalReturn;
    balance *= 1 + returnRate;
    balance = Math.max(0, balance);

    yearByYear.push({ year: i, balance });
  }

  return { yearByYear, survived };
}
