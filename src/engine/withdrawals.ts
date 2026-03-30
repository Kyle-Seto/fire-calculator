import type { Persona } from "@/types";
import { DEFAULTS } from "@/data/constants";
import { calculateTaxOnWithdrawal } from "@/engine/tax";
import { calculatePortfolioTotal, calculateAnnualExpenses } from "@/engine/fire";
import { resolveFinancialsAtYear } from "@/engine/lifeEvents";

// ── Types ──

export type WithdrawalPlan = {
  year: number;
  age: number;
  tfsaWithdrawal: number;
  rrspWithdrawal: number;
  nonRegWithdrawal: number;
  fhsaWithdrawal: number;
  totalWithdrawal: number;
  taxOwed: number;
  afterTaxIncome: number;
  tfsaBalance: number;
  rrspBalance: number;
  nonRegBalance: number;
  fhsaBalance: number;
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

function getAssetBalance(persona: Persona, type: string): number {
  return persona.assets.find((a) => a.type === type)?.value ?? 0;
}

// ── Core Functions ──

/**
 * Generate a year-by-year withdrawal plan for a retired persona.
 *
 * Withdrawal order (tax-optimized):
 *   1. Non-registered first — only capital gains portion is taxed
 *   2. RRSP meltdown — fill lowest tax brackets
 *   3. TFSA — completely tax-free, no forced withdrawals
 *   4. FHSA last — special-purpose, preserve for home purchase or RRSP transfer
 *
 * Each year: withdraw needed amount, apply growth to remaining balances,
 * calculate tax on withdrawals.
 */
export function generateWithdrawalPlan(
  persona: Persona,
  years: number = 30,
): WithdrawalPlan[] {
  const baseExpenses = calculateAnnualExpenses(persona);
  const hasEvents = (persona.lifeEvents ?? []).length > 0;
  const growthRate = DEFAULTS.realReturnMean;

  let tfsaBal = getAssetBalance(persona, "TFSA");
  let rrspBal = getAssetBalance(persona, "RRSP");
  let nonRegBal = getAssetBalance(persona, "NonRegistered");
  let fhsaBal = getAssetBalance(persona, "FHSA");

  const plan: WithdrawalPlan[] = [];

  for (let i = 0; i < years; i++) {
    const year = new Date().getFullYear() + i;
    const age = persona.age + i;

    // Net withdrawal need: expenses minus life-event income only.
    // Base annualIncome (working income) is excluded — this models retirement.
    let remaining: number;
    if (hasEvents) {
      const { annualIncome, annualExpenses } = resolveFinancialsAtYear(persona, i);
      // Subtract base working income to get only life-event income
      const retirementIncome = annualIncome - persona.annualIncome;
      remaining = Math.max(0, annualExpenses - retirementIncome);
    } else {
      remaining = baseExpenses;
    }

    let nonRegW = 0;
    let rrspW = 0;
    let tfsaW = 0;
    let fhsaW = 0;

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

    // Step 4: FHSA (special-purpose, withdraw last)
    if (remaining > 0 && fhsaBal > 0) {
      fhsaW = Math.min(remaining, fhsaBal);
      fhsaBal -= fhsaW;
      remaining -= fhsaW;
    }

    const totalWithdrawal = nonRegW + rrspW + tfsaW + fhsaW;

    // Calculate tax: RRSP is taxable income, non-reg has partial gains tax
    let taxOwed = 0;
    taxOwed += calculateTaxOnWithdrawal(rrspW, "RRSP", 0);
    taxOwed += calculateTaxOnWithdrawal(nonRegW, "NonRegistered", rrspW);
    // TFSA and FHSA: $0 tax

    const afterTaxIncome = totalWithdrawal - taxOwed;

    // Apply growth to remaining balances
    tfsaBal *= 1 + growthRate;
    rrspBal *= 1 + growthRate;
    nonRegBal *= 1 + growthRate;
    fhsaBal *= 1 + growthRate;

    plan.push({
      year,
      age,
      tfsaWithdrawal: tfsaW,
      rrspWithdrawal: rrspW,
      nonRegWithdrawal: nonRegW,
      fhsaWithdrawal: fhsaW,
      totalWithdrawal,
      taxOwed,
      afterTaxIncome,
      tfsaBalance: tfsaBal,
      rrspBalance: rrspBal,
      nonRegBalance: nonRegBal,
      fhsaBalance: fhsaBal,
      totalBalance: tfsaBal + rrspBal + nonRegBal + fhsaBal,
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

  const portfolioTotal = calculatePortfolioTotal(persona.assets);
  const annualExpenses = calculateAnnualExpenses(persona);
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

