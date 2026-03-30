export type TaxBracket = {
  min: number;
  max: number;
  rate: number;
};

export const FEDERAL_BRACKETS: TaxBracket[] = [
  { min: 0, max: 57375, rate: 0.15 },
  { min: 57375, max: 114750, rate: 0.205 },
  { min: 114750, max: 158468, rate: 0.26 },
  { min: 158468, max: 221708, rate: 0.29 },
  { min: 221708, max: Infinity, rate: 0.33 },
];

export const ONTARIO_BRACKETS: TaxBracket[] = [
  { min: 0, max: 52886, rate: 0.0505 },
  { min: 52886, max: 105775, rate: 0.0915 },
  { min: 105775, max: 150000, rate: 0.1116 },
  { min: 150000, max: 220000, rate: 0.1216 },
  { min: 220000, max: Infinity, rate: 0.1316 },
];

export const BASIC_PERSONAL_AMOUNT = 16129; // Federal BPA 2025
export const ONTARIO_PERSONAL_AMOUNT = 11865;

// TFSA annual limit
export const TFSA_ANNUAL_LIMIT = 7000;

// RRSP
export const RRSP_CONTRIBUTION_RATE = 0.18; // 18% of earned income
export const RRSP_ANNUAL_LIMIT = 32490; // 2025 limit

// Capital gains inclusion rate
export const CAPITAL_GAINS_INCLUSION_RATE = 0.5; // First $250K at 50%

// FHSA
export const FHSA_ANNUAL_LIMIT = 8_000;
export const FHSA_LIFETIME_LIMIT = 40_000;

// RESP
export const RESP_LIFETIME_LIMIT = 50_000;
export const RESP_OPTIMAL_ANNUAL = 2_500;
export const CESG_RATE = 0.20;
export const CESG_ANNUAL_MAX = 500;
export const CESG_LIFETIME_MAX = 7_200;
