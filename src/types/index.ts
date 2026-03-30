// ── Enums ──

export const AccountType = {
  TFSA: "TFSA",
  RRSP: "RRSP",
  NonRegistered: "NonRegistered",
  Cash: "Cash",
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const FireType = {
  Lean: "Lean",
  Traditional: "Traditional",
  Fat: "Fat",
  Barista: "Barista",
  Coast: "Coast",
} as const;

export type FireType = (typeof FireType)[keyof typeof FireType];

// ── Core Types ──

export type Account = {
  type: AccountType;
  balance: number;
  contributionRoom?: number;
};

export type Persona = {
  id: string;
  name: string;
  description: string;
  whyInteresting: string;
  age: number;
  annualIncome: number;
  monthlySpending: number;
  accounts: Account[];
  housing: {
    type: "rent" | "own";
    monthlyAmount: number;
    mortgageRemaining?: number;
  };
  debt: number;
  retirementStatus: "accumulating" | "retired";
  withdrawalStrategy?: string;
  cashCushion?: number;
  portfolioYield?: number;
  partner?: {
    age: number;
    annualIncome: number;
  };
};

export type PersonaTemplate = Persona;

// ── Result Types ──

export type MonteCarloResults = {
  runs: number;
  successRate: number;
  percentiles: {
    p10: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p90: number[];
  };
  medianYearsToFI: number;
};

export type FireResults = {
  fireNumber: number;
  savingsRate: number | null;
  yearsToFI: number;
  fireDateEstimate: Date | null;
  monthlyIncome: number;
  monthlyExpenses: number;
  annualExpenses: number;
  portfolioTotal: number;
  fireProgress: number;
  fireType: FireType;
  monteCarloResults: MonteCarloResults | null;
  // After-tax fields (Ontario/federal)
  afterTaxIncome: number;
  afterTaxSavingsRate: number | null;
  totalTax: number;
  marginalRate: number;
  afterTaxPortfolioValue: number;
  afterTaxFireProgress: number;
};
