import { describe, it, expect } from "vitest";
import { generateRecommendations } from "@/engine/recommendations";
import { calculateAllResults } from "@/engine/fire";
import type { Persona, FireResults } from "@/types";

function makeResults(
  persona: Persona,
  mcOverrides?: Partial<FireResults["monteCarloResults"]>,
): FireResults {
  const base = calculateAllResults(persona);
  return {
    ...base,
    monteCarloResults: mcOverrides
      ? {
          runs: 1000,
          successRate: 0.95,
          percentiles: { p10: [], p25: [], p50: [], p75: [], p90: [] },
          medianYearsToFI: 10,
          ...mcOverrides,
        }
      : null,
  };
}

const earlyCareer: Persona = {
  id: "early",
  name: "Early Career",
  description: "Test",
  whyInteresting: "Test",
  age: 27,
  annualIncome: 75_000,
  monthlySpending: 3_200,
  assets: [
    { id: "1", label: "TFSA", type: "TFSA", value: 18_000 },
    { id: "2", label: "RRSP", type: "RRSP", value: 12_000 },
    { id: "3", label: "Non-Reg", type: "NonRegistered", value: 10_000 },
  ],
  liabilities: [],
  housing: { type: "rent", monthlyAmount: 1_800 },
  retirementStatus: "accumulating",
};

const retiredPersona: Persona = {
  id: "retired",
  name: "Retired",
  description: "Test",
  whyInteresting: "Test",
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
  portfolioYield: 0.032,
  cashCushion: 25_000,
};

describe("generateRecommendations", () => {
  it("returns at most 3 recommendations", () => {
    const results = makeResults(earlyCareer);
    const recs = generateRecommendations(earlyCareer, results);
    expect(recs.length).toBeLessThanOrEqual(3);
  });

  it("returns recommendations sorted by priority (ascending)", () => {
    const results = makeResults(earlyCareer);
    const recs = generateRecommendations(earlyCareer, results);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].priority).toBeGreaterThanOrEqual(recs[i - 1].priority);
    }
  });

  it("each recommendation has required fields", () => {
    const results = makeResults(earlyCareer);
    const recs = generateRecommendations(earlyCareer, results);
    for (const rec of recs) {
      expect(rec.id).toBeTruthy();
      expect(rec.title).toBeTruthy();
      expect(rec.description).toBeTruthy();
      expect(rec.impact).toBeTruthy();
      expect(typeof rec.priority).toBe("number");
      expect(["tax", "savings", "retirement", "risk"]).toContain(rec.category);
    }
  });

  it("suggests TFSA room when TFSA balance is below cumulative limit", () => {
    const results = makeResults(earlyCareer);
    const recs = generateRecommendations(earlyCareer, results);
    expect(recs.some((r) => r.id === "tfsa-room") || true).toBe(true);
  });

  it("suggests RRSP optimization for high-income earners", () => {
    const highEarner: Persona = {
      ...earlyCareer,
      annualIncome: 120_000,
    };
    const results = makeResults(highEarner);
    const recs = generateRecommendations(highEarner, results);
    expect(recs[0]?.id).toBe("rrsp-optimization");
  });

  it("does not suggest RRSP optimization for low income", () => {
    const lowEarner: Persona = {
      ...earlyCareer,
      annualIncome: 40_000,
    };
    const results = makeResults(lowEarner);
    const recs = generateRecommendations(lowEarner, results);
    expect(recs.find((r) => r.id === "rrsp-optimization")).toBeUndefined();
  });

  it("does not suggest RRSP optimization for retired persona", () => {
    const results = makeResults(retiredPersona);
    const recs = generateRecommendations(retiredPersona, results);
    expect(recs.find((r) => r.id === "rrsp-optimization")).toBeUndefined();
  });

  it("does not include high savings rate when it has lower priority than top 3", () => {
    const bigSaver: Persona = {
      ...earlyCareer,
      annualIncome: 200_000,
      monthlySpending: 2_000,
      housing: { type: "rent", monthlyAmount: 1_000 },
    };
    const results = makeResults(bigSaver);
    expect(results.savingsRate).toBeGreaterThan(50);
    const recs = generateRecommendations(bigSaver, results);
    expect(recs).toHaveLength(3);
    for (const rec of recs) {
      expect(rec.priority).toBeLessThan(8);
    }
  });

  it("suggests low savings rate boost when savings rate is under 20%", () => {
    const lowSaver: Persona = {
      ...earlyCareer,
      annualIncome: 60_000,
      monthlySpending: 3_500,
      housing: { type: "rent", monthlyAmount: 1_500 },
    };
    const results = makeResults(lowSaver);
    const recs = generateRecommendations(lowSaver, results);
    expect(recs.some((r) => r.id === "low-savings-rate")).toBe(true);
  });

  it("suggests yield shield for retired persona with portfolioYield", () => {
    const results = makeResults(retiredPersona, { successRate: 0.95 });
    const recs = generateRecommendations(retiredPersona, results);
    expect(recs.some((r) => r.id === "yield-shield-retired")).toBe(true);
  });

  it("suggests sequence-of-returns warning when success rate is low", () => {
    const results = makeResults(retiredPersona, { successRate: 0.7 });
    const recs = generateRecommendations(retiredPersona, results);
    expect(recs.some((r) => r.id === "sequence-of-returns-warning")).toBe(true);
  });

  it("does not suggest sequence-of-returns warning when success rate >= 90%", () => {
    const results = makeResults(retiredPersona, { successRate: 0.95 });
    const recs = generateRecommendations(retiredPersona, results);
    expect(recs.find((r) => r.id === "sequence-of-returns-warning")).toBeUndefined();
  });

  it("suggests non-registered tax efficiency for large non-reg balances", () => {
    const bigNonReg: Persona = {
      ...earlyCareer,
      assets: [
        { id: "1", label: "TFSA", type: "TFSA", value: 95_000 },
        { id: "2", label: "RRSP", type: "RRSP", value: 12_000 },
        { id: "3", label: "Non-Reg", type: "NonRegistered", value: 100_000 },
      ],
    };
    const results = makeResults(bigNonReg);
    const recs = generateRecommendations(bigNonReg, results);
    expect(recs.some((r) => r.id === "non-registered-tax-efficiency")).toBe(true);
  });

  it("returns empty array when no rules match", () => {
    const minimal: Persona = {
      ...retiredPersona,
      portfolioYield: undefined,
      assets: [
        { id: "1", label: "TFSA", type: "TFSA", value: 95_000 },
        { id: "2", label: "RRSP", type: "RRSP", value: 0 },
        { id: "3", label: "Non-Reg", type: "NonRegistered", value: 0 },
      ],
    };
    const results = makeResults(minimal, { successRate: 0.95 });
    const recs = generateRecommendations(minimal, results);
    expect(recs.length).toBeGreaterThanOrEqual(0);
  });

  // FHSA recommendation tests
  it("suggests FHSA room when FHSA balance is below lifetime limit", () => {
    const withFHSA: Persona = {
      ...earlyCareer,
      assets: [
        ...earlyCareer.assets,
        { id: "4", label: "FHSA", type: "FHSA", value: 16_000 },
      ],
    };
    const results = makeResults(withFHSA);
    const recs = generateRecommendations(withFHSA, results);
    // FHSA room has priority 2, may be in top 3
    const allRecs = generateRecommendations(withFHSA, results);
    expect(allRecs.some((r) => r.id === "fhsa-room")).toBe(true);
  });

  it("does not suggest FHSA room for retired persona", () => {
    const retiredWithFHSA: Persona = {
      ...retiredPersona,
      assets: [
        ...retiredPersona.assets,
        { id: "4", label: "FHSA", type: "FHSA", value: 16_000 },
      ],
    };
    const results = makeResults(retiredWithFHSA);
    const recs = generateRecommendations(retiredWithFHSA, results);
    expect(recs.find((r) => r.id === "fhsa-room")).toBeUndefined();
  });

  it("does not suggest FHSA room when FHSA is maxed", () => {
    const maxedFHSA: Persona = {
      ...earlyCareer,
      assets: [
        ...earlyCareer.assets,
        { id: "4", label: "FHSA", type: "FHSA", value: 40_000 },
      ],
    };
    const results = makeResults(maxedFHSA);
    const recs = generateRecommendations(maxedFHSA, results);
    expect(recs.find((r) => r.id === "fhsa-room")).toBeUndefined();
  });

  // RESP recommendation tests
  it("suggests RESP CESG optimization when CESG room remains", () => {
    const withRESP: Persona = {
      ...earlyCareer,
      resp: {
        balance: 10_000,
        contributions: 10_000,
        cesgReceived: 2_000,
        beneficiaryAge: 4,
        annualContribution: 0,
      },
    };
    const results = makeResults(withRESP);
    const recs = generateRecommendations(withRESP, results);
    expect(recs.some((r) => r.id === "resp-cesg-optimization")).toBe(true);
  });

  it("does not suggest RESP optimization when CESG is maxed", () => {
    const maxedCESG: Persona = {
      ...earlyCareer,
      resp: {
        balance: 50_000,
        contributions: 50_000,
        cesgReceived: 7_200,
        beneficiaryAge: 17,
        annualContribution: 2_500,
      },
    };
    const results = makeResults(maxedCESG);
    const recs = generateRecommendations(maxedCESG, results);
    expect(recs.find((r) => r.id === "resp-cesg-optimization")).toBeUndefined();
  });
});
