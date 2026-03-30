import type { Persona } from "@/types";
import { DEFAULTS } from "@/data/constants";
import { calculateTaxOnWithdrawal } from "@/engine/tax";
import { calculatePortfolioTotal, calculateAnnualExpenses } from "@/engine/fire";
import { resolveFinancialsAtYear } from "@/engine/lifeEvents";
import { FEDERAL_BRACKETS, ONTARIO_BRACKETS } from "@/data/taxBrackets";

// ── Types ──

export type WithdrawalPlan = {
  year: number;
  age: number;
  tfsaWithdrawal: number;
  rrspWithdrawal: number;
  nonRegWithdrawal: number;
  fhsaWithdrawal: number;
  rrspMeltdown: number; // extra RRSP withdrawn beyond expenses for bracket filling
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
 * The lowest ceiling where both federal and provincial rates stay in the
 * first bracket. RRSP meltdown should fill up to this amount.
 */
function lowestBracketCeiling(): number {
  return Math.min(FEDERAL_BRACKETS[0].max, ONTARIO_BRACKETS[0].max);
}

/**
 * Generate a tax-minimized year-by-year withdrawal plan.
 *
 * Strategy (RRSP meltdown with bracket filling):
 *
 *   1. Calculate retirement income for the year (life event income only,
 *      no working income — we're modeling "if you quit").
 *   2. RRSP meltdown: withdraw RRSP to fill the lowest tax bracket.
 *      In low-income years (before CPP/OAS), this is a large amount.
 *      In high-income years (after CPP/OAS), bracket room shrinks.
 *      Excess beyond expenses is conceptually moved to TFSA.
 *   3. Cover remaining expenses from non-reg (lightly taxed), then TFSA,
 *      then FHSA last.
 *   4. Apply growth to all remaining balances.
 */
export function generateWithdrawalPlan(
  persona: Persona,
  years: number = 30,
): WithdrawalPlan[] {
  const baseExpenses = calculateAnnualExpenses(persona);
  const hasEvents = (persona.lifeEvents ?? []).length > 0;
  const growthRate = DEFAULTS.realReturnMean;
  const bracketCeiling = lowestBracketCeiling();

  let tfsaBal = getAssetBalance(persona, "TFSA");
  let rrspBal = getAssetBalance(persona, "RRSP");
  let nonRegBal = getAssetBalance(persona, "NonRegistered");
  let fhsaBal = getAssetBalance(persona, "FHSA");

  const plan: WithdrawalPlan[] = [];

  for (let i = 0; i < years; i++) {
    const year = new Date().getFullYear() + i;
    const age = persona.age + i;

    // Retirement income = life event income only (CPP, OAS, pension, rental)
    let retirementIncome = 0;
    let expenseNeed: number;
    if (hasEvents) {
      const { annualIncome, annualExpenses } = resolveFinancialsAtYear(persona, i);
      retirementIncome = annualIncome - persona.annualIncome;
      expenseNeed = Math.max(0, annualExpenses - retirementIncome);
    } else {
      expenseNeed = baseExpenses;
    }

    let nonRegW = 0;
    let rrspW = 0;
    let tfsaW = 0;
    let fhsaW = 0;
    let rrspMeltdown = 0;

    // Step 1: RRSP meltdown — fill lowest bracket
    // Room = bracket ceiling minus other taxable income this year
    const bracketRoom = Math.max(0, bracketCeiling - retirementIncome);
    const optimalRrsp = Math.min(bracketRoom, rrspBal);

    if (optimalRrsp > 0) {
      rrspW = Math.min(optimalRrsp, expenseNeed);
      rrspBal -= rrspW;
      expenseNeed -= rrspW;

      // Meltdown: withdraw beyond expenses to fill bracket, move excess to TFSA
      rrspMeltdown = optimalRrsp - rrspW;
      if (rrspMeltdown > 0) {
        rrspBal -= rrspMeltdown;
        tfsaBal += rrspMeltdown; // conceptual RRSP→TFSA conversion
      }
    }

    // Step 2: Non-registered (only gains taxed at 50% inclusion)
    if (expenseNeed > 0 && nonRegBal > 0) {
      nonRegW = Math.min(expenseNeed, nonRegBal);
      nonRegBal -= nonRegW;
      expenseNeed -= nonRegW;
    }

    // Step 3: TFSA (tax-free, preserve as long as possible)
    if (expenseNeed > 0 && tfsaBal > 0) {
      tfsaW = Math.min(expenseNeed, tfsaBal);
      tfsaBal -= tfsaW;
      expenseNeed -= tfsaW;
    }

    // Step 4: FHSA last
    if (expenseNeed > 0 && fhsaBal > 0) {
      fhsaW = Math.min(expenseNeed, fhsaBal);
      fhsaBal -= fhsaW;
      expenseNeed -= fhsaW;
    }

    const totalWithdrawal = nonRegW + rrspW + tfsaW + fhsaW;
    const totalRrspTaxable = rrspW + rrspMeltdown;

    // Tax: RRSP withdrawal (incl meltdown) is taxable on top of retirement income
    let taxOwed = 0;
    taxOwed += calculateTaxOnWithdrawal(totalRrspTaxable, "RRSP", retirementIncome);
    taxOwed += calculateTaxOnWithdrawal(nonRegW, "NonRegistered", retirementIncome + totalRrspTaxable);

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
      rrspMeltdown,
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

