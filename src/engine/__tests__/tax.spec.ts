import { describe, it, expect } from "vitest";
import {
  calculateIncomeTax,
  calculateTotalTax,
  calculateAfterTaxIncome,
  calculateMarginalRate,
  calculateTaxOnWithdrawal,
  calculateAfterTaxPortfolioValue,
  calculateOptimalRRSPContribution,
} from "@/engine/tax";
import {
  FEDERAL_BRACKETS,
  BASIC_PERSONAL_AMOUNT,
} from "@/data/taxBrackets";
import type { Account } from "@/types";

describe("calculateIncomeTax", () => {
  it("returns $0 for $0 income", () => {
    expect(
      calculateIncomeTax(0, FEDERAL_BRACKETS, BASIC_PERSONAL_AMOUNT),
    ).toBe(0);
  });

  it("returns $0 for negative income", () => {
    expect(
      calculateIncomeTax(-10_000, FEDERAL_BRACKETS, BASIC_PERSONAL_AMOUNT),
    ).toBe(0);
  });

  it("returns $0 when income is below the personal amount", () => {
    // $10K income: 10000 * 0.15 = 1500, credit = 16129 * 0.15 = 2419.35 => 0
    expect(
      calculateIncomeTax(10_000, FEDERAL_BRACKETS, BASIC_PERSONAL_AMOUNT),
    ).toBe(0);
  });
});

describe("calculateTotalTax", () => {
  it("returns $0 for $0 income", () => {
    expect(calculateTotalTax(0)).toBe(0);
  });

  it("calculates ~$7,006 total tax on $50K income", () => {
    const tax = calculateTotalTax(50_000);
    // Federal: 50000*0.15 - 16129*0.15 = 7500 - 2419.35 = 5080.65
    // Ontario: 50000*0.0505 - 11865*0.0505 = 2525 - 599.18 = 1925.82
    // Total ≈ 7006.47
    expect(tax).toBeCloseTo(7006.47, 0);
  });

  it("calculates ~$21,308 total tax on $100K income", () => {
    const tax = calculateTotalTax(100_000);
    // Federal: 57375*0.15 + 42625*0.205 - 2419.35 = 14925.03
    // Ontario: 52886*0.0505 + 47114*0.0915 - 599.18 = 6382.49
    // Total ≈ 21307.52
    expect(tax).toBeCloseTo(21_308, -1);
  });
});

describe("calculateAfterTaxIncome", () => {
  it("returns $0 for $0 gross income", () => {
    expect(calculateAfterTaxIncome(0)).toBe(0);
  });

  it("returns gross minus tax for $100K", () => {
    const afterTax = calculateAfterTaxIncome(100_000);
    const tax = calculateTotalTax(100_000);
    expect(afterTax).toBe(100_000 - tax);
    expect(afterTax).toBeGreaterThan(75_000);
    expect(afterTax).toBeLessThan(85_000);
  });
});

describe("calculateMarginalRate", () => {
  it("returns 0 for $0 income", () => {
    expect(calculateMarginalRate(0)).toBe(0);
  });

  it("returns 29.65% at $60K (federal 20.5% + Ontario 9.15%)", () => {
    // $60K is in federal bracket 57375-114750 (20.5%)
    // and Ontario bracket 52886-105775 (9.15%)
    expect(calculateMarginalRate(60_000)).toBeCloseTo(0.2965, 4);
  });

  it("returns 20.05% at $30K (federal 15% + Ontario 5.05%)", () => {
    expect(calculateMarginalRate(30_000)).toBeCloseTo(0.2005, 4);
  });

  it("returns top combined rate for very high income", () => {
    // Federal top: 33%, Ontario top: 13.16%
    expect(calculateMarginalRate(500_000)).toBeCloseTo(0.4616, 4);
  });
});

describe("calculateTaxOnWithdrawal", () => {
  it("TFSA withdrawal = $0 tax regardless of amount", () => {
    expect(calculateTaxOnWithdrawal(50_000, "TFSA", 0)).toBe(0);
    expect(calculateTaxOnWithdrawal(100_000, "TFSA", 80_000)).toBe(0);
  });

  it("Cash withdrawal = $0 tax", () => {
    expect(calculateTaxOnWithdrawal(20_000, "Cash", 50_000)).toBe(0);
  });

  it("RRSP withdrawal is taxed as regular income added to otherIncome", () => {
    const tax = calculateTaxOnWithdrawal(20_000, "RRSP", 60_000);
    // Should equal totalTax(80K) - totalTax(60K), which is positive
    const expected = calculateTotalTax(80_000) - calculateTotalTax(60_000);
    expect(tax).toBe(expected);
    expect(tax).toBeGreaterThan(0);
  });

  it("RRSP withdrawal with $0 other income still gets taxed", () => {
    const tax = calculateTaxOnWithdrawal(50_000, "RRSP", 0);
    expect(tax).toBe(calculateTotalTax(50_000));
    expect(tax).toBeGreaterThan(0);
  });

  it("NonRegistered withdrawal taxes only the capital gains portion", () => {
    const tax = calculateTaxOnWithdrawal(100_000, "NonRegistered", 50_000);
    // 50% of 100K = 50K gains, 50% inclusion = 25K taxable
    // Tax = totalTax(50K + 25K) - totalTax(50K)
    const expected = calculateTotalTax(75_000) - calculateTotalTax(50_000);
    expect(tax).toBe(expected);
    expect(tax).toBeGreaterThan(0);
    // Should be less than taxing the full amount as income
    const fullIncomeTax = calculateTotalTax(150_000) - calculateTotalTax(50_000);
    expect(tax).toBeLessThan(fullIncomeTax);
  });

  it("returns $0 for zero withdrawal amount", () => {
    expect(calculateTaxOnWithdrawal(0, "RRSP", 50_000)).toBe(0);
  });
});

describe("calculateAfterTaxPortfolioValue", () => {
  it("TFSA is worth full balance", () => {
    const accounts: Account[] = [{ type: "TFSA", balance: 100_000 }];
    expect(calculateAfterTaxPortfolioValue(accounts)).toBe(100_000);
  });

  it("RRSP is worth less than full balance due to deferred tax", () => {
    const accounts: Account[] = [{ type: "RRSP", balance: 100_000 }];
    const value = calculateAfterTaxPortfolioValue(accounts);
    expect(value).toBeLessThan(100_000);
    expect(value).toBeGreaterThan(50_000); // Tax rate won't exceed 50%
  });

  it("Cash is worth full balance", () => {
    const accounts: Account[] = [{ type: "Cash", balance: 50_000 }];
    expect(calculateAfterTaxPortfolioValue(accounts)).toBe(50_000);
  });

  it("TFSA worth more than RRSP dollar-for-dollar", () => {
    const tfsaAccounts: Account[] = [{ type: "TFSA", balance: 100_000 }];
    const rrspAccounts: Account[] = [{ type: "RRSP", balance: 100_000 }];
    const tfsaValue = calculateAfterTaxPortfolioValue(tfsaAccounts);
    const rrspValue = calculateAfterTaxPortfolioValue(rrspAccounts);
    expect(tfsaValue).toBeGreaterThan(rrspValue);
  });

  it("sums after-tax value across multiple accounts", () => {
    const accounts: Account[] = [
      { type: "TFSA", balance: 50_000 },
      { type: "RRSP", balance: 200_000 },
      { type: "NonRegistered", balance: 100_000 },
      { type: "Cash", balance: 20_000 },
    ];
    const value = calculateAfterTaxPortfolioValue(accounts);
    // TFSA: 50K, Cash: 20K (full), RRSP and NonRegistered: less than face
    const rawTotal = 50_000 + 200_000 + 100_000 + 20_000;
    expect(value).toBeLessThan(rawTotal);
    expect(value).toBeGreaterThan(rawTotal * 0.6); // At least 60% of raw
  });

  it("returns 0 for empty accounts", () => {
    expect(calculateAfterTaxPortfolioValue([])).toBe(0);
  });
});

describe("calculateOptimalRRSPContribution", () => {
  it("returns 18% of income when below the annual limit", () => {
    const result = calculateOptimalRRSPContribution(75_000);
    // 18% of 75K = 13500, which is below 32490 limit
    expect(result.contribution).toBe(13_500);
  });

  it("caps at the annual limit for high income", () => {
    const result = calculateOptimalRRSPContribution(250_000);
    // 18% of 250K = 45000, but capped at 32490
    expect(result.contribution).toBe(32_490);
  });

  it("calculates positive tax savings for $75K income", () => {
    const result = calculateOptimalRRSPContribution(75_000);
    expect(result.taxSavings).toBeGreaterThan(0);
    // Tax savings ≈ $4,003 (marginal rate ~29.65% on $13,500 contribution)
    expect(result.taxSavings).toBeCloseTo(4_003, -1);
  });

  it("returns zero contribution and savings for $0 income", () => {
    const result = calculateOptimalRRSPContribution(0);
    expect(result.contribution).toBe(0);
    expect(result.taxSavings).toBe(0);
  });

  it("returns zero for negative income", () => {
    const result = calculateOptimalRRSPContribution(-10_000);
    expect(result.contribution).toBe(0);
    expect(result.taxSavings).toBe(0);
  });

  it("tax savings are less than the contribution itself", () => {
    const result = calculateOptimalRRSPContribution(100_000);
    expect(result.taxSavings).toBeLessThan(result.contribution);
    expect(result.taxSavings).toBeGreaterThan(0);
  });
});
