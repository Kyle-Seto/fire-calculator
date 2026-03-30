import type { MonteCarloResults } from "@/types";

interface MonteCarloParams {
  startingPortfolio: number;
  annualContribution: number; // positive for accumulating, negative for withdrawing
  targetAmount: number; // FIRE number (for accumulating) or 0 (for checking portfolio survival)
  years: number;
  runs: number;
  meanReturn: number; // default 0.07
  stdDevReturn: number; // default 0.15
  seed?: number; // optional seed for reproducible tests
  mode: "accumulating" | "withdrawal";
}

/**
 * Mulberry32 PRNG — a simple seedable 32-bit generator.
 * Returns a function that produces values in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Box-Muller transform: convert two uniform random numbers into a standard normal variate.
 */
function boxMuller(rand: () => number): number {
  let u1 = rand();
  // Avoid log(0)
  while (u1 === 0) u1 = rand();
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Generate a single log-normal return.
 * r = exp(mu_log - 0.5 * sigma_log^2 + sigma_log * Z) - 1
 * where mu_log = ln(1 + meanReturn), sigma_log = stdDevReturn, Z ~ N(0,1).
 */
function generateReturn(
  rand: () => number,
  meanReturn: number,
  stdDevReturn: number,
): number {
  const z = boxMuller(rand);
  const muLog = Math.log(1 + meanReturn);
  const sigmaLog = stdDevReturn;
  return Math.exp(muLog - 0.5 * sigmaLog * sigmaLog + sigmaLog * z) - 1;
}

function getPercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const fraction = index - lower;
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

function getMedian(values: number[]): number {
  return getPercentile(values, 50);
}

export function runMonteCarloSimulation(
  params: MonteCarloParams,
): MonteCarloResults {
  const {
    startingPortfolio,
    annualContribution,
    targetAmount,
    years,
    runs,
    meanReturn,
    stdDevReturn,
    seed,
    mode,
  } = params;

  const rand =
    seed !== undefined ? mulberry32(seed) : () => Math.random();

  // portfoliosByYear[yearIndex][runIndex] = portfolio value
  const portfoliosByYear: number[][] = Array.from({ length: years }, () =>
    new Array(runs),
  );

  let successCount = 0;
  const yearsToFIPerRun: number[] = [];

  for (let run = 0; run < runs; run++) {
    let portfolio = startingPortfolio;
    let succeeded = false;
    let yearReachedFI = years; // default: never reached

    for (let year = 0; year < years; year++) {
      const annualReturn = generateReturn(rand, meanReturn, stdDevReturn);
      portfolio = portfolio * (1 + annualReturn) + annualContribution;

      if (mode === "withdrawal" && portfolio < 0) {
        portfolio = 0;
      }

      portfoliosByYear[year][run] = portfolio;

      if (mode === "accumulating" && !succeeded && portfolio >= targetAmount) {
        succeeded = true;
        yearReachedFI = year + 1; // 1-indexed year count
      }
    }

    if (mode === "withdrawal") {
      // Success if portfolio never hit 0 (stayed positive through all years)
      const survived = portfoliosByYear.every(
        (yearValues) => yearValues[run] > 0,
      );
      if (survived) successCount++;
    } else {
      if (succeeded) successCount++;
    }

    yearsToFIPerRun.push(yearReachedFI);
  }

  // Compute percentiles at each year
  const p10: number[] = [];
  const p25: number[] = [];
  const p50: number[] = [];
  const p75: number[] = [];
  const p90: number[] = [];

  for (let year = 0; year < years; year++) {
    const values = portfoliosByYear[year];
    p10.push(getPercentile(values, 10));
    p25.push(getPercentile(values, 25));
    p50.push(getPercentile(values, 50));
    p75.push(getPercentile(values, 75));
    p90.push(getPercentile(values, 90));
  }

  const medianYearsToFI =
    mode === "accumulating" ? getMedian(yearsToFIPerRun) : 0;

  return {
    successRate: successCount / runs,
    percentiles: { p10, p25, p50, p75, p90 },
    medianYearsToFI,
    runs,
  };
}

export type { MonteCarloParams };
