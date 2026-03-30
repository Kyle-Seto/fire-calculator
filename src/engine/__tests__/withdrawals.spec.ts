import { describe, expect, it } from "vitest";
import { calculateYieldShield, generateWithdrawalPlan } from "@/engine/withdrawals";
import type { Persona } from "@/types";

const retiredPersona: Persona = {
	id: "test-retired",
	name: "Retired",
	description: "Test retired persona",
	whyInteresting: "Testing",
	age: 38,
	annualIncome: 0,
	monthlySpending: 3_400,
	assets: [
		{ id: "1", label: "TFSA", type: "TFSA", value: 69_500 },
		{ id: "2", label: "RRSP", type: "RRSP", value: 450_000 },
		{ id: "3", label: "Non-Reg", type: "NonRegistered", value: 580_500 },
	],
	liabilities: [],
	housing: { type: "rent", monthlyAmount: 1_200 },
	retirementStatus: "retired",
	cashCushion: 25_000,
	portfolioYield: 0.032,
};

const accumulatingPersona: Persona = {
	id: "test-accumulating",
	name: "Accumulating",
	description: "Test accumulating persona",
	whyInteresting: "Testing",
	age: 30,
	annualIncome: 80_000,
	monthlySpending: 2_000,
	assets: [
		{ id: "1", label: "TFSA", type: "TFSA", value: 50_000 },
		{ id: "2", label: "RRSP", type: "RRSP", value: 100_000 },
	],
	liabilities: [],
	housing: { type: "rent", monthlyAmount: 1_500 },
	retirementStatus: "accumulating",
};

describe("generateWithdrawalPlan", () => {
	it("returns the requested number of years", () => {
		const plan = generateWithdrawalPlan(retiredPersona, 10);
		expect(plan).toHaveLength(10);
	});

	it("defaults to 30 years", () => {
		const plan = generateWithdrawalPlan(retiredPersona);
		expect(plan).toHaveLength(30);
	});

	it("ages the persona correctly each year", () => {
		const plan = generateWithdrawalPlan(retiredPersona, 5);
		expect(plan[0].age).toBe(38);
		expect(plan[4].age).toBe(42);
	});

	it("fills RRSP meltdown first, then non-reg for remainder", () => {
		const plan = generateWithdrawalPlan(retiredPersona, 1);
		// Annual expenses = (3400 + 1200) * 12 = 55200
		// Bracket ceiling = min(57375, 52886) = 52886
		// RRSP meltdown fills bracket: RRSP withdrawal covers 52886 of expenses
		// Remaining expenses: 55200 - 52886 = 2314 from non-reg
		expect(plan[0].rrspWithdrawal).toBe(52_886);
		expect(plan[0].nonRegWithdrawal).toBe(55_200 - 52_886);
		expect(plan[0].tfsaWithdrawal).toBe(0);
		expect(plan[0].fhsaWithdrawal).toBe(0);
	});

	it("falls through to non-reg then TFSA when RRSP is small", () => {
		const smallRrsp: Persona = {
			...retiredPersona,
			assets: [
				{ id: "1", label: "TFSA", type: "TFSA", value: 69_500 },
				{ id: "2", label: "RRSP", type: "RRSP", value: 10_000 },
				{ id: "3", label: "Non-Reg", type: "NonRegistered", value: 10_000 },
			],
		};
		const plan = generateWithdrawalPlan(smallRrsp, 1);
		// RRSP meltdown: min(52886, 10000) = 10000 for expenses
		// Remaining: 55200 - 10000 = 45200 from non-reg (only 10000 available)
		// Then TFSA for remainder: 45200 - 10000 = 35200
		expect(plan[0].rrspWithdrawal).toBe(10_000);
		expect(plan[0].nonRegWithdrawal).toBe(10_000);
		expect(plan[0].tfsaWithdrawal).toBe(55_200 - 10_000 - 10_000);
	});

	it("uses TFSA as third resort", () => {
		const tfsaOnly: Persona = {
			...retiredPersona,
			assets: [
				{ id: "1", label: "TFSA", type: "TFSA", value: 200_000 },
				{ id: "2", label: "RRSP", type: "RRSP", value: 0 },
				{ id: "3", label: "Non-Reg", type: "NonRegistered", value: 0 },
			],
		};
		const plan = generateWithdrawalPlan(tfsaOnly, 1);
		expect(plan[0].tfsaWithdrawal).toBe(55_200);
		expect(plan[0].rrspWithdrawal).toBe(0);
		expect(plan[0].nonRegWithdrawal).toBe(0);
	});

	it("FHSA is withdrawn after TFSA (last resort)", () => {
		const fhsaOnly: Persona = {
			...retiredPersona,
			assets: [
				{ id: "1", label: "TFSA", type: "TFSA", value: 0 },
				{ id: "2", label: "RRSP", type: "RRSP", value: 0 },
				{ id: "3", label: "Non-Reg", type: "NonRegistered", value: 0 },
				{ id: "4", label: "FHSA", type: "FHSA", value: 100_000 },
			],
		};
		const plan = generateWithdrawalPlan(fhsaOnly, 1);
		expect(plan[0].fhsaWithdrawal).toBe(55_200);
		expect(plan[0].tfsaWithdrawal).toBe(0);
		expect(plan[0].rrspWithdrawal).toBe(0);
		expect(plan[0].nonRegWithdrawal).toBe(0);
	});

	it("FHSA withdrawals incur zero tax", () => {
		const fhsaOnly: Persona = {
			...retiredPersona,
			assets: [
				{ id: "1", label: "TFSA", type: "TFSA", value: 0 },
				{ id: "2", label: "RRSP", type: "RRSP", value: 0 },
				{ id: "3", label: "Non-Reg", type: "NonRegistered", value: 0 },
				{ id: "4", label: "FHSA", type: "FHSA", value: 200_000 },
			],
		};
		const plan = generateWithdrawalPlan(fhsaOnly, 3);
		for (const row of plan) {
			expect(row.taxOwed).toBe(0);
		}
	});

	it("total withdrawal equals the sum of individual account withdrawals", () => {
		const withFHSA: Persona = {
			...retiredPersona,
			assets: [...retiredPersona.assets, { id: "4", label: "FHSA", type: "FHSA", value: 30_000 }],
		};
		const plan = generateWithdrawalPlan(withFHSA, 5);
		for (const row of plan) {
			expect(row.totalWithdrawal).toBe(
				row.tfsaWithdrawal + row.rrspWithdrawal + row.nonRegWithdrawal + row.fhsaWithdrawal,
			);
		}
	});

	it("after-tax income is withdrawal minus tax", () => {
		const plan = generateWithdrawalPlan(retiredPersona, 5);
		for (const row of plan) {
			expect(row.afterTaxIncome).toBeCloseTo(row.totalWithdrawal - row.taxOwed, 2);
		}
	});

	it("TFSA withdrawals incur zero tax", () => {
		const tfsaOnly: Persona = {
			...retiredPersona,
			assets: [
				{ id: "1", label: "TFSA", type: "TFSA", value: 500_000 },
				{ id: "2", label: "RRSP", type: "RRSP", value: 0 },
				{ id: "3", label: "Non-Reg", type: "NonRegistered", value: 0 },
			],
		};
		const plan = generateWithdrawalPlan(tfsaOnly, 3);
		for (const row of plan) {
			expect(row.taxOwed).toBe(0);
		}
	});

	it("balances grow by the real return rate after withdrawals", () => {
		const plan = generateWithdrawalPlan(retiredPersona, 2);
		// Year 1: RRSP was 450000, withdrew 52886 for expenses + 0 meltdown
		// Remainder = 450000 - 52886 = 397114, after growth: 397114 * 1.07
		expect(plan[0].rrspBalance).toBeCloseTo(397_114 * 1.07, 0);
		// NonReg was 580500, withdrew 2314 (remaining expenses)
		// Remainder = 580500 - 2314 = 578186, after growth: 578186 * 1.07
		expect(plan[0].nonRegBalance).toBeCloseTo(578_186 * 1.07, 0);
	});

	it("totalBalance equals sum of individual balances including FHSA", () => {
		const withFHSA: Persona = {
			...retiredPersona,
			assets: [...retiredPersona.assets, { id: "4", label: "FHSA", type: "FHSA", value: 30_000 }],
		};
		const plan = generateWithdrawalPlan(withFHSA, 5);
		for (const row of plan) {
			expect(row.totalBalance).toBeCloseTo(
				row.tfsaBalance + row.rrspBalance + row.nonRegBalance + row.fhsaBalance,
				2,
			);
		}
	});
});

describe("calculateYieldShield", () => {
	it("returns null for accumulating persona", () => {
		expect(calculateYieldShield(accumulatingPersona)).toBeNull();
	});

	it("returns null for retired persona without portfolioYield", () => {
		const noYield: Persona = {
			...retiredPersona,
			portfolioYield: undefined,
		};
		expect(calculateYieldShield(noYield)).toBeNull();
	});

	it("computes correct values for retired persona with yield", () => {
		const shield = calculateYieldShield(retiredPersona);
		expect(shield).not.toBeNull();

		// Portfolio: 69500 + 450000 + 580500 = 1100000
		expect(shield!.portfolioYield).toBe(0.032);
		expect(shield!.annualExpenses).toBe(55_200);
		expect(shield!.annualYieldIncome).toBeCloseTo(1_100_000 * (0.032 / 100), 2);
		expect(shield!.isFullyCovered).toBe(false);
		expect(shield!.gapAmount).toBeGreaterThan(0);
	});

	it("marks as fully covered when yield exceeds expenses", () => {
		const highYield: Persona = {
			...retiredPersona,
			portfolioYield: 10,
		};
		const shield = calculateYieldShield(highYield);
		expect(shield).not.toBeNull();
		expect(shield!.isFullyCovered).toBe(true);
		expect(shield!.gapAmount).toBe(0);
	});

	it("computes cash cushion years from gap and cashCushion", () => {
		const shield = calculateYieldShield(retiredPersona);
		expect(shield).not.toBeNull();
		if (shield!.gapAmount > 0) {
			expect(shield!.cashCushionYears).toBeCloseTo(25_000 / shield!.gapAmount, 2);
		}
	});

	it("returns Infinity cash cushion years when fully covered", () => {
		const highYield: Persona = {
			...retiredPersona,
			portfolioYield: 10,
		};
		const shield = calculateYieldShield(highYield);
		expect(shield!.cashCushionYears).toBe(Infinity);
	});
});
