import { DEFAULTS, FIRE_THRESHOLDS } from "@/data/constants";
import { resolveFinancialsAtYear } from "@/engine/lifeEvents";
import {
	calculateAfterTaxIncome,
	calculateAfterTaxPortfolioValue,
	calculateMarginalRate,
	calculateTotalTax,
} from "@/engine/tax";
import {
	type Asset,
	type FireResults,
	type FireType,
	INVESTABLE_TYPES,
	type Liability,
	type Persona,
} from "@/types";

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

export function calculateSavingsRate(annualIncome: number, annualExpenses: number): number | null {
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

/** Calculate total annual debt service (minimum payments) across all liabilities. */
export function calculateAnnualDebtService(liabilities: Liability[]): number {
	return liabilities.reduce((sum, l) => sum + (l.minimumPayment ?? 0) * 12, 0);
}

/**
 * Simulate one year of debt: accrue interest, apply payments, return remaining balances
 * and total payments made this year. Debts that reach 0 are removed.
 */
function simulateDebtYear(debts: { balance: number; rate: number; payment: number }[]): {
	debts: { balance: number; rate: number; payment: number }[];
	totalPayments: number;
} {
	let totalPayments = 0;
	const remaining: { balance: number; rate: number; payment: number }[] = [];

	for (const d of debts) {
		if (d.balance <= 0) continue;
		// Accrue interest
		let balance = d.balance * (1 + d.rate);
		// Apply 12 months of payments
		const yearlyPayment = Math.min(d.payment * 12, balance);
		balance -= yearlyPayment;
		totalPayments += yearlyPayment;
		if (balance > 0.01) {
			remaining.push({ ...d, balance });
		}
	}

	return { debts: remaining, totalPayments };
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

	// Initialize debt tracking
	let debts = persona.liabilities
		.filter((l) => l.balance > 0)
		.map((l) => ({
			balance: l.balance,
			rate: l.interestRate ?? 0,
			payment: l.minimumPayment ?? 0,
		}));

	for (let year = 0; year < maxYears; year++) {
		const { annualIncome, annualExpenses } = resolveFinancialsAtYear(persona, year);

		// Simulate debt for this year
		const debtResult = simulateDebtYear(debts);
		debts = debtResult.debts;

		// Debt payments come out of income on top of living expenses
		const annualSavings = annualIncome - annualExpenses - debtResult.totalPayments;

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
	if (annualIncome > 0 && portfolio < fireNumber && annualIncome >= annualSpending) {
		return "Barista";
	}

	if (annualSpending < FIRE_THRESHOLDS.lean) return "Lean";
	if (annualSpending < FIRE_THRESHOLDS.traditional) return "Traditional";
	return "Fat";
}

export function calculateFireProgress(currentPortfolio: number, fireNumber: number): number {
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

	const hasDebt = persona.liabilities.some((l) => l.balance > 0 && (l.minimumPayment ?? 0) > 0);
	const hasEvents = (persona.lifeEvents ?? []).length > 0;
	// Use the year-by-year simulation when there are life events or debt to model paydown
	const yearsToFI =
		hasEvents || hasDebt
			? calculateYearsToFIWithEvents(portfolioTotal, persona, fireNumber, DEFAULTS.realReturnMean)
			: calculateYearsToFI(portfolioTotal, annualSavings, fireNumber, DEFAULTS.realReturnMean);

	const fireDateEstimate = calculateFireDate(yearsToFI);
	const fireProgress = calculateFireProgress(portfolioTotal, fireNumber);
	const fireType = classifyFireType(annualExpenses, portfolioTotal, annualIncome, fireNumber);

	const afterTaxIncome = calculateAfterTaxIncome(annualIncome);
	const totalTax = calculateTotalTax(annualIncome);
	const marginalRate = calculateMarginalRate(annualIncome);
	const afterTaxSavingsRate =
		afterTaxIncome > 0 ? ((afterTaxIncome - annualExpenses) / afterTaxIncome) * 100 : null;
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
