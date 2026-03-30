export const DEFAULTS = {
  withdrawalRate: 0.04, // 4% rule
  realReturnMean: 0.07, // 7% real return
  realReturnStdDev: 0.15, // 15% standard deviation
  inflationRate: 0.02, // 2% inflation
  monteCarloRuns: 1000,
  simulationYears: 50,
} as const;

// FIRE type thresholds (annual spending in CAD)
export const FIRE_THRESHOLDS = {
  lean: 40_000, // < $40K
  traditional: 100_000, // $40K - $100K
  fat: 100_000, // >= $100K
} as const;
