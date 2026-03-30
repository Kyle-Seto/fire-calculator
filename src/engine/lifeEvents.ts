import { calculateAnnualExpenses } from "@/engine/fire";
import type { Persona } from "@/types";

/** Convert "YYYY-MM" to a comparable number (year * 12 + month). */
function toMonths(ym: string): number {
	const [y, m] = ym.split("-").map(Number);
	return y * 12 + (m - 1);
}

/** Get "YYYY-MM" for a given simulation year offset from now. */
function simYearToYM(yearOffset: number): number {
	const now = new Date();
	const y = now.getFullYear() + yearOffset;
	const m = now.getMonth(); // 0-indexed
	return y * 12 + m;
}

/**
 * Resolve effective annual income and expenses for a given simulation year,
 * incorporating active life events on top of base persona values.
 *
 * @param yearOffset - 0 = current year, 1 = next year, etc.
 */
export function resolveFinancialsAtYear(
	persona: Persona,
	yearOffset: number,
): { annualIncome: number; annualExpenses: number } {
	const baseExpenses = calculateAnnualExpenses(persona);
	let annualIncome = persona.annualIncome;
	let annualExpenses = baseExpenses;

	const currentMonth = simYearToYM(yearOffset);

	for (const event of persona.lifeEvents ?? []) {
		const start = toMonths(event.startDate);
		if (currentMonth < start) continue;
		if (event.endDate !== undefined && currentMonth >= toMonths(event.endDate)) continue;

		const annual = event.monthlyAmount * 12;
		if (event.type === "income") {
			annualIncome += annual;
		} else {
			annualExpenses += annual;
		}
	}

	return { annualIncome, annualExpenses };
}

/**
 * Simulate debt balances forward by one year: accrue interest, apply payments.
 * Mutates the array in place, removing fully paid debts.
 * Returns total payments made this year.
 */
function simulateDebtYear(debts: { balance: number; rate: number; payment: number }[]): number {
	let totalPayments = 0;
	let i = debts.length;
	while (i--) {
		const d = debts[i];
		if (d.balance <= 0) {
			debts.splice(i, 1);
			continue;
		}
		d.balance *= 1 + d.rate;
		const yearlyPayment = Math.min(d.payment * 12, d.balance);
		d.balance -= yearlyPayment;
		totalPayments += yearlyPayment;
		if (d.balance < 0.01) debts.splice(i, 1);
	}
	return totalPayments;
}

/**
 * Build per-year contribution schedule (income - expenses - debt payments) for N years
 * starting from now. Debt balances are modeled forward year by year.
 */
export function buildContributionSchedule(persona: Persona, years: number): number[] {
	const debts = persona.liabilities
		.filter((l) => l.balance > 0)
		.map((l) => ({
			balance: l.balance,
			rate: l.interestRate ?? 0,
			payment: l.minimumPayment ?? 0,
		}));

	const schedule: number[] = [];
	for (let i = 0; i < years; i++) {
		const { annualIncome, annualExpenses } = resolveFinancialsAtYear(persona, i);
		const debtPayments = simulateDebtYear(debts);
		schedule.push(annualIncome - annualExpenses - debtPayments);
	}
	return schedule;
}
