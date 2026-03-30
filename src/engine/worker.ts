import * as Comlink from "comlink";

import type { FireResults, Persona } from "@/types";
import { DEFAULTS } from "@/data/constants";
import { calculateAllResults } from "./fire";
import { runMonteCarloSimulation } from "./monteCarlo";

const api = {
  calculate(persona: Persona): FireResults {
    const baseResults = calculateAllResults(persona);

    const isRetired = persona.retirementStatus === "retired";
    const annualExpenses = baseResults.annualExpenses;
    const annualIncome = persona.annualIncome;

    const monteCarloResults = runMonteCarloSimulation({
      startingPortfolio: baseResults.portfolioTotal,
      annualContribution: isRetired
        ? -annualExpenses
        : annualIncome - annualExpenses,
      targetAmount: isRetired ? 0 : baseResults.fireNumber,
      years: DEFAULTS.simulationYears,
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
