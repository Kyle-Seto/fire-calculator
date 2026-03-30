import { describe, it, expect } from "vitest";
import {
  evaluateScenario,
  evaluateAllScenarios,
  SCENARIOS,
} from "@/engine/scenarios";
import { calculateAllResults } from "@/engine/fire";
import type { Persona } from "@/types";

const basePersona: Persona = {
  id: "test-scenario",
  name: "Test",
  description: "Test persona for scenarios",
  whyInteresting: "Testing",
  age: 30,
  annualIncome: 100_000,
  monthlySpending: 3_000,
  accounts: [
    { type: "TFSA", balance: 50_000 },
    { type: "RRSP", balance: 80_000 },
    { type: "NonRegistered", balance: 70_000 },
  ],
  housing: { type: "rent", monthlyAmount: 1_500 },
  debt: 0,
  retirementStatus: "accumulating",
};

describe("SCENARIOS", () => {
  it("has 6 scenarios defined", () => {
    expect(SCENARIOS).toHaveLength(6);
  });

  it("each scenario has required fields", () => {
    for (const s of SCENARIOS) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.icon).toBeTruthy();
      expect(typeof s.apply).toBe("function");
    }
  });

  it("scenario apply does not mutate the original persona", () => {
    for (const s of SCENARIOS) {
      const originalBalance = basePersona.accounts[0].balance;
      const originalSpending = basePersona.monthlySpending;
      const originalIncome = basePersona.annualIncome;

      s.apply(basePersona);

      expect(basePersona.accounts[0].balance).toBe(originalBalance);
      expect(basePersona.monthlySpending).toBe(originalSpending);
      expect(basePersona.annualIncome).toBe(originalIncome);
    }
  });
});

describe("evaluateScenario", () => {
  it("returns a valid ScenarioResult", () => {
    const scenario = SCENARIOS.find((s) => s.id === "save-more")!;
    const result = evaluateScenario(scenario, basePersona);

    expect(result.scenario).toBe(scenario);
    expect(typeof result.originalYearsToFI).toBe("number");
    expect(typeof result.newYearsToFI).toBe("number");
    expect(typeof result.deltaMonths).toBe("number");
  });

  it("save-more scenario reduces years to FI (negative delta)", () => {
    const scenario = SCENARIOS.find((s) => s.id === "save-more")!;
    const result = evaluateScenario(scenario, basePersona);

    expect(result.deltaMonths).toBeLessThan(0);
    expect(result.newYearsToFI).toBeLessThan(result.originalYearsToFI);
  });

  it("market-crash scenario increases years to FI (positive delta)", () => {
    const scenario = SCENARIOS.find((s) => s.id === "market-crash")!;
    const result = evaluateScenario(scenario, basePersona);

    expect(result.deltaMonths).toBeGreaterThan(0);
  });

  it("move-cheaper scenario reduces years to FI", () => {
    const scenario = SCENARIOS.find((s) => s.id === "move-cheaper")!;
    const result = evaluateScenario(scenario, basePersona);

    expect(result.deltaMonths).toBeLessThan(0);
  });

  it("accepts precomputed base results and produces same output", () => {
    const scenario = SCENARIOS.find((s) => s.id === "save-more")!;
    const base = calculateAllResults(basePersona);

    const withPrecomputed = evaluateScenario(scenario, basePersona, 0.04, base);
    const withoutPrecomputed = evaluateScenario(scenario, basePersona);

    expect(withPrecomputed.originalYearsToFI).toBe(withoutPrecomputed.originalYearsToFI);
    expect(withPrecomputed.newYearsToFI).toBe(withoutPrecomputed.newYearsToFI);
    expect(withPrecomputed.deltaMonths).toBe(withoutPrecomputed.deltaMonths);
  });
});

describe("evaluateAllScenarios", () => {
  it("returns results for all scenarios", () => {
    const results = evaluateAllScenarios(basePersona);
    expect(results).toHaveLength(SCENARIOS.length);
  });

  it("results are sorted by deltaMonths ascending", () => {
    const results = evaluateAllScenarios(basePersona);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].deltaMonths).toBeGreaterThanOrEqual(
        results[i - 1].deltaMonths,
      );
    }
  });

  it("produces same results as individual evaluateScenario calls", () => {
    const allResults = evaluateAllScenarios(basePersona);

    for (const result of allResults) {
      const individual = evaluateScenario(result.scenario, basePersona);
      expect(result.originalYearsToFI).toBe(individual.originalYearsToFI);
      expect(result.newYearsToFI).toBe(individual.newYearsToFI);
      expect(result.deltaMonths).toBe(individual.deltaMonths);
    }
  });

  it("each result references a known scenario", () => {
    const results = evaluateAllScenarios(basePersona);
    const scenarioIds = SCENARIOS.map((s) => s.id);

    for (const result of results) {
      expect(scenarioIds).toContain(result.scenario.id);
    }
  });
});
