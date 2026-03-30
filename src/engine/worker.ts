import * as Comlink from "comlink";
import { DEFAULTS } from "@/data/constants";
import type { FireResults, Persona } from "@/types";
import { calculateAllResults } from "./fire";
import { buildContributionSchedule, resolveFinancialsAtYear } from "./lifeEvents";
import { runMonteCarloSimulation } from "./monteCarlo";

const api = {
	calculate(persona: Persona): FireResults {
		const baseResults = calculateAllResults(persona);

		const isRetired = persona.retirementStatus === "retired" || baseResults.fireProgress >= 100;
		const annualExpenses = baseResults.annualExpenses;
		const annualIncome = persona.annualIncome;
		const years = DEFAULTS.simulationYears;

		// Build per-year contributions that incorporate life events and debt paydown
		const hasEvents = (persona.lifeEvents ?? []).length > 0;
		const hasDebt = persona.liabilities.some((l) => l.balance > 0 && (l.minimumPayment ?? 0) > 0);
		let annualContributions: number[] | undefined;
		if (hasEvents || hasDebt) {
			if (isRetired) {
				annualContributions = Array.from({ length: years }, (_, i) => {
					const { annualIncome: inc, annualExpenses: exp } = resolveFinancialsAtYear(persona, i);
					return inc - exp; // negative when expenses > income (withdrawal)
				});
			} else {
				annualContributions = buildContributionSchedule(persona, years);
			}
		}

		const monteCarloResults = runMonteCarloSimulation({
			startingPortfolio: baseResults.portfolioTotal,
			annualContribution: isRetired ? -annualExpenses : annualIncome - annualExpenses,
			annualContributions,
			targetAmount: isRetired ? 0 : baseResults.fireNumber,
			years,
			runs: DEFAULTS.monteCarloRuns,
			meanReturn: DEFAULTS.realReturnMean,
			stdDevReturn: DEFAULTS.realReturnStdDev,
			mode: isRetired ? "withdrawal" : "accumulating",
		});

		return {
			...baseResults,
			monteCarloResults,
		};
	},
};

Comlink.expose(api);

export type WorkerApi = typeof api;
