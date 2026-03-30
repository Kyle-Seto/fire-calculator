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
import type { Asset } from "@/types";

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
    expect(tax).toBeCloseTo(7006.47, 0);
  });

  it("calculates ~$21,308 total tax on $100K income", () => {
    const tax = calculateTotalTax(100_000);
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
    expect(calculateMarginalRate(60_000)).toBeCloseTo(0.2965, 4);
  });

  it("returns 20.05% at $30K (federal 15% + Ontario 5.05%)", () => {
    expect(calculateMarginalRate(30_000)).toBeCloseTo(0.2005, 4);
  });

  it("returns top combined rate for very high income", () => {
    expect(calculateMarginalRate(500_000)).toBeCloseTo(0.4616, 4);
  });
});

describe("calculateTaxOnWithdrawal", () => {
  it("TFSA withdrawal = $0 tax regardless of amount", () => {
    expect(calculateTaxOnWithdrawal(50_000, "TFSA", 0)).toBe(0);
    expect(calculateTaxOnWithdrawal(100_000, "TFSA", 80_000)).toBe(0);
  });

  it("FHSA withdrawal = $0 tax (qualifying withdrawal assumption)", () => {
    expect(calculateTaxOnWithdrawal(40_000, "FHSA", 0)).toBe(0);
    expect(calculateTaxOnWithdrawal(20_000, "FHSA", 80_000)).toBe(0);
  });

  it("Cash withdrawal = $0 tax", () => {
    expect(calculateTaxOnWithdrawal(20_000, "Cash", 50_000)).toBe(0);
  });

  it("RRSP withdrawal is taxed as regular income added to otherIncome", () => {
    const tax = calculateTaxOnWithdrawal(20_000, "RRSP", 60_000);
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
    const expected = calculateTotalTax(75_000) - calculateTotalTax(50_000);
    expect(tax).toBe(expected);
    expect(tax).toBeGreaterThan(0);
    const fullIncomeTax = calculateTotalTax(150_000) - calculateTotalTax(50_000);
    expect(tax).toBeLessThan(fullIncomeTax);
  });

  it("returns $0 for zero withdrawal amount", () => {
    expect(calculateTaxOnWithdrawal(0, "RRSP", 50_000)).toBe(0);
  });
});

describe("calculateAfterTaxPortfolioValue", () => {
  it("TFSA is worth full value", () => {
    const assets: Asset[] = [{ id: "1", label: "TFSA", type: "TFSA", value: 100_000 }];
    expect(calculateAfterTaxPortfolioValue(assets)).toBe(100_000);
  });

  it("FHSA is worth full value (tax-free withdrawal assumption)", () => {
    const assets: Asset[] = [{ id: "1", label: "FHSA", type: "FHSA", value: 40_000 }];
    expect(calculateAfterTaxPortfolioValue(assets)).toBe(40_000);
  });

  it("RRSP is worth less than full value due to deferred tax", () => {
    const assets: Asset[] = [{ id: "1", label: "RRSP", type: "RRSP", value: 100_000 }];
    const value = calculateAfterTaxPortfolioValue(assets);
    expect(value).toBeLessThan(100_000);
    expect(value).toBeGreaterThan(50_000);
  });

  it("Cash is worth full value", () => {
    const assets: Asset[] = [{ id: "1", label: "Cash", type: "Cash", value: 50_000 }];
    expect(calculateAfterTaxPortfolioValue(assets)).toBe(50_000);
  });

  it("TFSA worth more than RRSP dollar-for-dollar", () => {
    const tfsaAssets: Asset[] = [{ id: "1", label: "TFSA", type: "TFSA", value: 100_000 }];
    const rrspAssets: Asset[] = [{ id: "2", label: "RRSP", type: "RRSP", value: 100_000 }];
    expect(calculateAfterTaxPortfolioValue(tfsaAssets)).toBeGreaterThan(
      calculateAfterTaxPortfolioValue(rrspAssets),
    );
  });

  it("sums after-tax value across multiple assets", () => {
    const assets: Asset[] = [
      { id: "1", label: "TFSA", type: "TFSA", value: 50_000 },
      { id: "2", label: "RRSP", type: "RRSP", value: 200_000 },
      { id: "3", label: "Non-Reg", type: "NonRegistered", value: 100_000 },
      { id: "4", label: "Cash", type: "Cash", value: 20_000 },
    ];
    const value = calculateAfterTaxPortfolioValue(assets);
    const rawTotal = 50_000 + 200_000 + 100_000 + 20_000;
    expect(value).toBeLessThan(rawTotal);
    expect(value).toBeGreaterThan(rawTotal * 0.6);
  });

  it("mixed portfolio with FHSA sums correctly", () => {
    const assets: Asset[] = [
      { id: "1", label: "TFSA", type: "TFSA", value: 50_000 },
      { id: "2", label: "FHSA", type: "FHSA", value: 30_000 },
      { id: "3", label: "RRSP", type: "RRSP", value: 100_000 },
    ];
    const value = calculateAfterTaxPortfolioValue(assets);
    // TFSA + FHSA = full value (80K), RRSP is discounted
    expect(value).toBeGreaterThan(130_000);
    expect(value).toBeLessThan(180_000);
  });

  it("returns 0 for empty assets", () => {
    expect(calculateAfterTaxPortfolioValue([])).toBe(0);
  });
});

describe("calculateOptimalRRSPContribution", () => {
  it("returns 18% of income when below the annual limit", () => {
    const result = calculateOptimalRRSPContribution(75_000);
    expect(result.contribution).toBe(13_500);
  });

  it("caps at the annual limit for high income", () => {
    const result = calculateOptimalRRSPContribution(250_000);
    expect(result.contribution).toBe(32_490);
  });

  it("calculates positive tax savings for $75K income", () => {
    const result = calculateOptimalRRSPContribution(75_000);
    expect(result.taxSavings).toBeGreaterThan(0);
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
