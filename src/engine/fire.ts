import type { Account, FireResults, FireType, Persona } from "@/types";
import { DEFAULTS, FIRE_THRESHOLDS } from "@/data/constants";
import {
  calculateAfterTaxIncome,
  calculateTotalTax,
  calculateMarginalRate,
  calculateAfterTaxPortfolioValue,
} from "@/engine/tax";

export function calculatePortfolioTotal(accounts: Account[]): number {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
}

export function calculateAnnualExpenses(persona: Persona): number {
  return (persona.monthlySpending + persona.housing.monthlyAmount) * 12;
}

export function calculateFireNumber(
  annualExpenses: number,
  withdrawalRate: number = DEFAULTS.withdrawalRate,
): number {
  return annualExpenses / withdrawalRate;
}

export function calculateSavingsRate(
  annualIncome: number,
  annualExpenses: number,
): number | null {
  if (annualIncome === 0) return null;
  return ((annualIncome - annualExpenses) / annualIncome) * 100;
}

export function calculateYearsToFI(
  currentPortfolio: number,
  annualSavings: number,
  fireNumber: number,
  realReturnRate: number,
): number {
  if (currentPortfolio >= fireNumber) return 0;

  const r = realReturnRate;

  // Zero or near-zero return rate: linear projection
  if (Math.abs(r) < 1e-9) {
    if (annualSavings <= 0) return Infinity;
    return (fireNumber - currentPortfolio) / annualSavings;
  }

  // No savings, but portfolio exists: compound growth only
  if (annualSavings === 0 && currentPortfolio > 0) {
    const years = Math.log(fireNumber / currentPortfolio) / Math.log(1 + r);
    return years > 0 && Number.isFinite(years) ? years : Infinity;
  }

  // No savings and no portfolio
  if (annualSavings === 0 && currentPortfolio === 0) return Infinity;

  // Normal case: future value of growing annuity formula solved for n
  // FV = P*(1+r)^n + S*((1+r)^n - 1)/r = fireNumber
  // Rearranged: n = ln((fireNumber*r + S) / (P*r + S)) / ln(1 + r)
  const numerator = fireNumber * r + annualSavings;
  const denominator = currentPortfolio * r + annualSavings;

  if (denominator <= 0 || numerator <= 0) return Infinity;

  const years = Math.log(numerator / denominator) / Math.log(1 + r);

  if (!Number.isFinite(years) || years < 0) return Infinity;

  return years;
}

export function calculateFireDate(yearsToFI: number): Date | null {
  if (!Number.isFinite(yearsToFI)) return null;

  const now = new Date();
  const futureDate = new Date(now);
  const wholeYears = Math.floor(yearsToFI);
  const fractionalDays = (yearsToFI - wholeYears) * 365.25;
  futureDate.setFullYear(futureDate.getFullYear() + wholeYears);
  futureDate.setDate(futureDate.getDate() + Math.round(fractionalDays));
  return futureDate;
}

export function classifyFireType(
  annualSpending: number,
  portfolio: number,
  annualIncome: number,
  fireNumber: number,
): FireType {
  // Barista FIRE: still earning income, not yet FI, but income covers expenses
  if (
    annualIncome > 0 &&
    portfolio < fireNumber &&
    annualIncome >= annualSpending
  ) {
    return "Barista";
  }

  if (annualSpending < FIRE_THRESHOLDS.lean) return "Lean";
  if (annualSpending < FIRE_THRESHOLDS.traditional) return "Traditional";
  return "Fat";
}

export function calculateFireProgress(
  currentPortfolio: number,
  fireNumber: number,
): number {
  if (fireNumber === 0) return currentPortfolio > 0 ? 100 : 0;
  return (currentPortfolio / fireNumber) * 100;
}

export function calculateAllResults(
  persona: Persona,
  withdrawalRate: number = DEFAULTS.withdrawalRate,
): Omit<FireResults, "monteCarloResults"> {
  const portfolioTotal = calculatePortfolioTotal(persona.accounts);
  const annualExpenses = calculateAnnualExpenses(persona);
  const monthlyExpenses = annualExpenses / 12;
  const monthlyIncome = persona.annualIncome / 12;
  const annualIncome = persona.annualIncome;

  const fireNumber = calculateFireNumber(annualExpenses, withdrawalRate);
  const savingsRate = calculateSavingsRate(annualIncome, annualExpenses);
  const annualSavings = annualIncome - annualExpenses;

  const yearsToFI = calculateYearsToFI(
    portfolioTotal,
    annualSavings,
    fireNumber,
    DEFAULTS.realReturnMean,
  );

  const fireDateEstimate = calculateFireDate(yearsToFI);
  const fireProgress = calculateFireProgress(portfolioTotal, fireNumber);
  const fireType = classifyFireType(
    annualExpenses,
    portfolioTotal,
    annualIncome,
    fireNumber,
  );

  // After-tax calculations (Ontario/federal)
  const afterTaxIncome = calculateAfterTaxIncome(annualIncome);
  const totalTax = calculateTotalTax(annualIncome);
  const marginalRate = calculateMarginalRate(annualIncome);
  const afterTaxSavingsRate =
    afterTaxIncome > 0
      ? ((afterTaxIncome - annualExpenses) / afterTaxIncome) * 100
      : null;
  const afterTaxPortfolioValue = calculateAfterTaxPortfolioValue(persona.accounts);
  const afterTaxFireProgress = calculateFireProgress(afterTaxPortfolioValue, fireNumber);

  return {
    fireNumber,
    savingsRate,
    yearsToFI,
    fireDateEstimate,
    monthlyIncome,
    monthlyExpenses,
    annualExpenses,
    portfolioTotal,
    fireProgress,
    fireType,
    afterTaxIncome,
    afterTaxSavingsRate,
    totalTax,
    marginalRate,
    afterTaxPortfolioValue,
    afterTaxFireProgress,
  };
}
