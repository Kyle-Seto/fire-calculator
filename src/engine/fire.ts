import { INVESTABLE_TYPES, type Asset, type FireResults, type FireType, type Persona } from "@/types";
import { DEFAULTS, FIRE_THRESHOLDS } from "@/data/constants";
import {
  calculateAfterTaxIncome,
  calculateTotalTax,
  calculateMarginalRate,
  calculateAfterTaxPortfolioValue,
} from "@/engine/tax";
import { resolveFinancialsAtYear } from "@/engine/lifeEvents";

/** Sum of investable asset balances only. */
export function calculatePortfolioTotal(assets: Asset[]): number {
  return assets
    .filter((a) => (INVESTABLE_TYPES as readonly string[]).includes(a.type))
    .reduce((sum, a) => sum + a.value, 0);
}

/** Sum of ALL asset values. */
export function calculateTotalAssets(assets: Asset[]): number {
  return assets.reduce((sum, a) => sum + a.value, 0);
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

  if (Math.abs(r) < 1e-9) {
    if (annualSavings <= 0) return Infinity;
    return (fireNumber - currentPortfolio) / annualSavings;
  }

  if (annualSavings === 0 && currentPortfolio > 0) {
    const years = Math.log(fireNumber / currentPortfolio) / Math.log(1 + r);
    return years > 0 && Number.isFinite(years) ? years : Infinity;
  }

  if (annualSavings === 0 && currentPortfolio === 0) return Infinity;

  const numerator = fireNumber * r + annualSavings;
  const denominator = currentPortfolio * r + annualSavings;

  if (denominator <= 0 || numerator <= 0) return Infinity;

  const years = Math.log(numerator / denominator) / Math.log(1 + r);

  if (!Number.isFinite(years) || years < 0) return Infinity;

  return years;
}

export function calculateYearsToFIWithEvents(
  currentPortfolio: number,
  persona: Persona,
  fireNumber: number,
  realReturnRate: number,
  maxYears: number = 80,
): number {
  if (currentPortfolio >= fireNumber) return 0;

  let portfolio = currentPortfolio;
  const r = realReturnRate;

  for (let year = 0; year < maxYears; year++) {
    const { annualIncome, annualExpenses } = resolveFinancialsAtYear(persona, year);
    const annualSavings = annualIncome - annualExpenses;

    portfolio = portfolio * (1 + r) + annualSavings;

    if (portfolio >= fireNumber) {
      const prevPortfolio = (portfolio - annualSavings) / (1 + r);
      const needed = fireNumber - prevPortfolio;
      const gained = portfolio - prevPortfolio;
      const fraction = gained > 0 ? needed / gained : 1;
      return year + fraction;
    }
  }

  return Infinity;
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
  const portfolioTotal = calculatePortfolioTotal(persona.assets);
  const totalAssets = calculateTotalAssets(persona.assets);
  const totalLiabilities = persona.liabilities.reduce((sum, l) => sum + l.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  const annualExpenses = calculateAnnualExpenses(persona);
  const monthlyExpenses = annualExpenses / 12;
  const monthlyIncome = persona.annualIncome / 12;
  const annualIncome = persona.annualIncome;

  const fireNumber = calculateFireNumber(annualExpenses, withdrawalRate);
  const savingsRate = calculateSavingsRate(annualIncome, annualExpenses);
  const annualSavings = annualIncome - annualExpenses;

  const hasEvents = (persona.lifeEvents ?? []).length > 0;
  const yearsToFI = hasEvents
    ? calculateYearsToFIWithEvents(portfolioTotal, persona, fireNumber, DEFAULTS.realReturnMean)
    : calculateYearsToFI(portfolioTotal, annualSavings, fireNumber, DEFAULTS.realReturnMean);

  const fireDateEstimate = calculateFireDate(yearsToFI);
  const fireProgress = calculateFireProgress(portfolioTotal, fireNumber);
  const fireType = classifyFireType(
    annualExpenses,
    portfolioTotal,
    annualIncome,
    fireNumber,
  );

  const afterTaxIncome = calculateAfterTaxIncome(annualIncome);
  const totalTax = calculateTotalTax(annualIncome);
  const marginalRate = calculateMarginalRate(annualIncome);
  const afterTaxSavingsRate =
    afterTaxIncome > 0
      ? ((afterTaxIncome - annualExpenses) / afterTaxIncome) * 100
      : null;
  const afterTaxPortfolioValue = calculateAfterTaxPortfolioValue(persona.assets);
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
    netWorth,
    totalAssets,
    totalLiabilities,
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
