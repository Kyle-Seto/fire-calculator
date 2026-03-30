import { describe, it, expect } from "vitest";
import {
  calculateFireNumber,
  calculateSavingsRate,
  calculateYearsToFI,
  calculateFireDate,
  calculateFireProgress,
  classifyFireType,
  calculatePortfolioTotal,
  calculateAllResults,
} from "@/engine/fire";
import type { Asset, Persona } from "@/types";

describe("calculatePortfolioTotal", () => {
  it("sums investable asset values", () => {
    const assets: Asset[] = [
      { id: "1", label: "TFSA", type: "TFSA", value: 50_000 },
      { id: "2", label: "RRSP", type: "RRSP", value: 100_000 },
      { id: "3", label: "Cash", type: "Cash", value: 10_000 },
    ];
    expect(calculatePortfolioTotal(assets)).toBe(160_000);
  });

  it("returns 0 for empty assets", () => {
    expect(calculatePortfolioTotal([])).toBe(0);
  });

  it("includes FHSA in portfolio total", () => {
    const assets: Asset[] = [
      { id: "1", label: "TFSA", type: "TFSA", value: 50_000 },
      { id: "2", label: "FHSA", type: "FHSA", value: 30_000 },
    ];
    expect(calculatePortfolioTotal(assets)).toBe(80_000);
  });

  it("excludes non-investable types", () => {
    const assets: Asset[] = [
      { id: "1", label: "TFSA", type: "TFSA", value: 50_000 },
      { id: "2", label: "House", type: "Property", value: 500_000 },
      { id: "3", label: "Car", type: "Vehicle", value: 30_000 },
    ];
    expect(calculatePortfolioTotal(assets)).toBe(50_000);
  });
});

describe("calculateFireNumber", () => {
  it("at 4% withdrawal rate, $40K expenses = $1M", () => {
    expect(calculateFireNumber(40_000, 0.04)).toBe(1_000_000);
  });

  it("at 3.5% withdrawal rate, $40K expenses = ~$1,142,857", () => {
    const result = calculateFireNumber(40_000, 0.035);
    expect(result).toBeCloseTo(1_142_857.14, 0);
  });

  it("uses default 4% withdrawal rate when not specified", () => {
    expect(calculateFireNumber(40_000)).toBe(1_000_000);
  });
});

describe("calculateSavingsRate", () => {
  it("$75K income, $38.4K expenses = ~48.8%", () => {
    const result = calculateSavingsRate(75_000, 38_400);
    expect(result).toBeCloseTo(48.8, 1);
  });

  it("returns null for $0 income (retired)", () => {
    expect(calculateSavingsRate(0, 30_000)).toBeNull();
  });

  it("returns negative rate when expenses exceed income", () => {
    const result = calculateSavingsRate(50_000, 60_000);
    expect(result).not.toBeNull();
    expect(result!).toBeLessThan(0);
  });
});

describe("calculateYearsToFI", () => {
  it("returns 0 when portfolio already exceeds FIRE number", () => {
    expect(calculateYearsToFI(1_200_000, 20_000, 1_000_000, 0.07)).toBe(0);
  });

  it("$0 savings, nonzero portfolio, positive return = finite years (compound growth)", () => {
    const years = calculateYearsToFI(500_000, 0, 1_000_000, 0.07);
    expect(years).toBeGreaterThan(0);
    expect(Number.isFinite(years)).toBe(true);
    // ln(2) / ln(1.07) ≈ 10.24 years
    expect(years).toBeCloseTo(10.24, 1);
  });

  it("$0 savings AND $0 portfolio = Infinity", () => {
    expect(calculateYearsToFI(0, 0, 1_000_000, 0.07)).toBe(Infinity);
  });

  it("handles 0% return rate without errors", () => {
    const years = calculateYearsToFI(100_000, 50_000, 1_000_000, 0);
    expect(Number.isFinite(years)).toBe(true);
    // Linear: (1M - 100K) / 50K = 18 years
    expect(years).toBe(18);
  });

  it("0% return rate with no savings returns Infinity", () => {
    expect(calculateYearsToFI(100_000, 0, 1_000_000, 0)).toBe(Infinity);
  });

  it("normal case produces reasonable result", () => {
    const years = calculateYearsToFI(200_000, 30_000, 1_000_000, 0.07);
    expect(years).toBeGreaterThan(0);
    expect(years).toBeLessThan(50);
    expect(Number.isFinite(years)).toBe(true);
  });
});

describe("calculateFireDate", () => {
  it("returns null for Infinity", () => {
    expect(calculateFireDate(Infinity)).toBeNull();
  });

  it("returns null for NaN", () => {
    expect(calculateFireDate(NaN)).toBeNull();
  });

  it("returns a Date for finite years", () => {
    const result = calculateFireDate(10);
    expect(result).toBeInstanceOf(Date);
    const expectedYear = new Date().getFullYear() + 10;
    expect(result!.getFullYear()).toBeGreaterThanOrEqual(expectedYear - 1);
    expect(result!.getFullYear()).toBeLessThanOrEqual(expectedYear + 1);
  });

  it("returns approximately today for 0 years", () => {
    const result = calculateFireDate(0);
    expect(result).toBeInstanceOf(Date);
    const now = new Date();
    expect(result!.getFullYear()).toBe(now.getFullYear());
  });
});

describe("calculateFireProgress", () => {
  it("calculates correct percentage", () => {
    expect(calculateFireProgress(500_000, 1_000_000)).toBe(50);
  });

  it("can exceed 100%", () => {
    expect(calculateFireProgress(1_500_000, 1_000_000)).toBe(150);
  });

  it("handles fireNumber = 0 with positive portfolio", () => {
    expect(calculateFireProgress(100_000, 0)).toBe(100);
  });

  it("handles both zero", () => {
    expect(calculateFireProgress(0, 0)).toBe(0);
  });
});

describe("classifyFireType", () => {
  it("classifies $35K spending as Lean", () => {
    expect(classifyFireType(35_000, 500_000, 0, 1_000_000)).toBe("Lean");
  });

  it("classifies $60K spending as Traditional", () => {
    expect(classifyFireType(60_000, 500_000, 0, 1_500_000)).toBe("Traditional");
  });

  it("classifies $120K spending as Fat", () => {
    expect(classifyFireType(120_000, 500_000, 0, 3_000_000)).toBe("Fat");
  });

  it("classifies as Barista when income covers expenses but not yet FI", () => {
    expect(classifyFireType(40_000, 500_000, 50_000, 1_000_000)).toBe("Barista");
  });
});

describe("calculateAllResults", () => {
  it("produces valid results with a sample persona", () => {
    const persona: Persona = {
      id: "test-1",
      name: "Test Persona",
      description: "A test persona",
      whyInteresting: "For testing",
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

    const results = calculateAllResults(persona);

    expect(results.portfolioTotal).toBe(150_000);
    expect(results.monthlyExpenses).toBe(3_500);
    expect(results.annualExpenses).toBe(42_000);
    expect(results.monthlyIncome).toBeCloseTo(80_000 / 12);
    expect(results.fireNumber).toBe(42_000 / 0.04);
    expect(results.savingsRate).not.toBeNull();
    expect(results.savingsRate!).toBeGreaterThan(0);
    expect(results.yearsToFI).toBeGreaterThan(0);
    expect(Number.isFinite(results.yearsToFI)).toBe(true);
    expect(results.fireDateEstimate).toBeInstanceOf(Date);
    expect(results.fireProgress).toBeGreaterThan(0);
    expect(results.fireProgress).toBeLessThan(100);
    expect(["Lean", "Traditional", "Fat", "Barista", "Coast"]).toContain(
      results.fireType,
    );
  });

  it("handles retired persona with 0 income", () => {
    const persona: Persona = {
      id: "test-2",
      name: "Retired Persona",
      description: "Retired",
      whyInteresting: "For testing",
      age: 65,
      annualIncome: 0,
      monthlySpending: 2_000,
      assets: [
        { id: "1", label: "RRSP", type: "RRSP", value: 1_200_000 },
      ],
      liabilities: [],
      housing: { type: "own", monthlyAmount: 500 },
      retirementStatus: "retired",
    };

    const results = calculateAllResults(persona);

    expect(results.savingsRate).toBeNull();
    expect(results.portfolioTotal).toBe(1_200_000);
    expect(results.monthlyIncome).toBe(0);
  });
});
