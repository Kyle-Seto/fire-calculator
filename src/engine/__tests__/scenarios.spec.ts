import { describe, expect, it } from "vitest";
import { calculateAllResults } from "@/engine/fire";
import { evaluateAllScenarios, evaluateScenario, generateScenarios } from "@/engine/scenarios";
import type { Persona } from "@/types";

const basePersona: Persona = {
	id: "test-scenario",
	name: "Test",
	description: "Test persona for scenarios",
	whyInteresting: "Testing",
	age: 30,
	annualIncome: 100_000,
	monthlySpending: 3_000,
	assets: [
		{ id: "1", label: "TFSA", type: "TFSA", value: 50_000 },
		{ id: "2", label: "RRSP", type: "RRSP", value: 80_000 },
		{ id: "3", label: "Non-Reg", type: "NonRegistered", value: 70_000 },
	],
	liabilities: [],
	housing: { type: "rent", monthlyAmount: 1_500 },
	retirementStatus: "accumulating",
};

describe("generateScenarios", () => {
	const scenarios = generateScenarios(basePersona);

	it("generates scenarios for a persona", () => {
		expect(scenarios.length).toBeGreaterThan(0);
	});

	it("each scenario has required fields", () => {
		for (const s of scenarios) {
			expect(s.id).toBeTruthy();
			expect(s.name).toBeTruthy();
			expect(s.description).toBeTruthy();
			expect(s.icon).toBeTruthy();
			expect(typeof s.apply).toBe("function");
		}
	});

	it("scenario apply does not mutate the original persona", () => {
		for (const s of scenarios) {
			const originalValue = basePersona.assets[0].value;
			const originalSpending = basePersona.monthlySpending;
			const originalIncome = basePersona.annualIncome;

			s.apply(basePersona);

			expect(basePersona.assets[0].value).toBe(originalValue);
			expect(basePersona.monthlySpending).toBe(originalSpending);
			expect(basePersona.annualIncome).toBe(originalIncome);
		}
	});
});

describe("evaluateScenario", () => {
	const scenarios = generateScenarios(basePersona);

	it("returns a valid ScenarioResult", () => {
		const scenario = scenarios[0];
		const result = evaluateScenario(scenario, basePersona);

		expect(result.scenario).toBe(scenario);
		expect(typeof result.originalYearsToFI).toBe("number");
		expect(typeof result.newYearsToFI).toBe("number");
		expect(typeof result.deltaMonths).toBe("number");
	});

	it("accepts precomputed base results and produces same output", () => {
		const scenario = scenarios[0];
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
		const scenarios = generateScenarios(basePersona);
		const results = evaluateAllScenarios(basePersona);
		expect(results).toHaveLength(scenarios.length);
	});

	it("results are sorted by deltaMonths ascending", () => {
		const results = evaluateAllScenarios(basePersona);
		for (let i = 1; i < results.length; i++) {
			expect(results[i].deltaMonths).toBeGreaterThanOrEqual(results[i - 1].deltaMonths);
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
		const scenarios = generateScenarios(basePersona);
		const results = evaluateAllScenarios(basePersona);
		const scenarioIds = scenarios.map((s) => s.id);

		for (const result of results) {
			expect(scenarioIds).toContain(result.scenario.id);
		}
	});
});
