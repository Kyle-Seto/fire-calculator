import { describe, it, expect } from "vitest";
import {
  generateWithdrawalPlan,
  calculateYieldShield,
} from "@/engine/withdrawals";
import type { Persona } from "@/types";

const retiredPersona: Persona = {
  id: "test-retired",
  name: "Retired",
  description: "Test retired persona",
  whyInteresting: "Testing",
  age: 38,
  annualIncome: 0,
  monthlySpending: 3_400,
  accounts: [
    { type: "TFSA", balance: 69_500 },
    { type: "RRSP", balance: 450_000 },
    { type: "NonRegistered", balance: 580_500 },
  ],
  housing: { type: "rent", monthlyAmount: 1_200 },
  debt: 0,
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
  accounts: [
    { type: "TFSA", balance: 50_000 },
    { type: "RRSP", balance: 100_000 },
  ],
  housing: { type: "rent", monthlyAmount: 1_500 },
  debt: 0,
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

  it("withdraws from non-registered first", () => {
    const plan = generateWithdrawalPlan(retiredPersona, 1);
    // Annual expenses = (3400 + 1200) * 12 = 55200
    // NonReg balance is 580500, which covers 55200 fully
    expect(plan[0].nonRegWithdrawal).toBe(55_200);
    expect(plan[0].rrspWithdrawal).toBe(0);
    expect(plan[0].tfsaWithdrawal).toBe(0);
  });

  it("falls through to RRSP when non-registered is depleted", () => {
    const smallNonReg: Persona = {
      ...retiredPersona,
      accounts: [
        { type: "TFSA", balance: 69_500 },
        { type: "RRSP", balance: 450_000 },
        { type: "NonRegistered", balance: 10_000 },
      ],
    };
    const plan = generateWithdrawalPlan(smallNonReg, 1);
    expect(plan[0].nonRegWithdrawal).toBe(10_000);
    expect(plan[0].rrspWithdrawal).toBe(55_200 - 10_000);
    expect(plan[0].tfsaWithdrawal).toBe(0);
  });

  it("uses TFSA as last resort", () => {
    const tfsaOnly: Persona = {
      ...retiredPersona,
      accounts: [
        { type: "TFSA", balance: 200_000 },
        { type: "RRSP", balance: 0 },
        { type: "NonRegistered", balance: 0 },
      ],
    };
    const plan = generateWithdrawalPlan(tfsaOnly, 1);
    expect(plan[0].tfsaWithdrawal).toBe(55_200);
    expect(plan[0].rrspWithdrawal).toBe(0);
    expect(plan[0].nonRegWithdrawal).toBe(0);
  });

  it("total withdrawal equals the sum of individual account withdrawals", () => {
    const plan = generateWithdrawalPlan(retiredPersona, 5);
    for (const row of plan) {
      expect(row.totalWithdrawal).toBe(
        row.tfsaWithdrawal + row.rrspWithdrawal + row.nonRegWithdrawal,
      );
    }
  });

  it("after-tax income is withdrawal minus tax", () => {
    const plan = generateWithdrawalPlan(retiredPersona, 5);
    for (const row of plan) {
      expect(row.afterTaxIncome).toBeCloseTo(
        row.totalWithdrawal - row.taxOwed,
        2,
      );
    }
  });

  it("TFSA withdrawals incur zero tax", () => {
    const tfsaOnly: Persona = {
      ...retiredPersona,
      accounts: [
        { type: "TFSA", balance: 500_000 },
        { type: "RRSP", balance: 0 },
        { type: "NonRegistered", balance: 0 },
      ],
    };
    const plan = generateWithdrawalPlan(tfsaOnly, 3);
    for (const row of plan) {
      expect(row.taxOwed).toBe(0);
    }
  });

  it("balances grow by the real return rate after withdrawals", () => {
    const plan = generateWithdrawalPlan(retiredPersona, 2);
    // After year 1: nonReg was 580500, withdrew 55200, remainder = 525300
    // After growth: 525300 * 1.07 = 562071
    expect(plan[0].nonRegBalance).toBeCloseTo(525_300 * 1.07, 0);
  });

  it("totalBalance equals sum of individual balances", () => {
    const plan = generateWithdrawalPlan(retiredPersona, 5);
    for (const row of plan) {
      expect(row.totalBalance).toBeCloseTo(
        row.tfsaBalance + row.rrspBalance + row.nonRegBalance,
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
    // Yield income: 1100000 * (0.032 / 100) = 352
    // Annual expenses: (3400 + 1200) * 12 = 55200
    expect(shield!.portfolioYield).toBe(0.032);
    expect(shield!.annualExpenses).toBe(55_200);
    expect(shield!.annualYieldIncome).toBeCloseTo(1_100_000 * (0.032 / 100), 2);
    expect(shield!.isFullyCovered).toBe(false);
    expect(shield!.gapAmount).toBeGreaterThan(0);
  });

  it("marks as fully covered when yield exceeds expenses", () => {
    const highYield: Persona = {
      ...retiredPersona,
      portfolioYield: 10, // 10% yield = $110K/yr on $1.1M
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
      expect(shield!.cashCushionYears).toBeCloseTo(
        25_000 / shield!.gapAmount,
        2,
      );
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
