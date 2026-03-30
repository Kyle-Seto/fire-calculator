// ── Enums ──

export const AssetType = {
	TFSA: "TFSA",
	RRSP: "RRSP",
	FHSA: "FHSA",
	NonRegistered: "NonRegistered",
	Cash: "Cash",
	Property: "Property",
	Vehicle: "Vehicle",
	Other: "Other",
} as const;

export type AssetType = (typeof AssetType)[keyof typeof AssetType];

/** Asset types that count toward the investable portfolio (used for FIRE calc). */
export const INVESTABLE_TYPES: AssetType[] = ["TFSA", "RRSP", "FHSA", "NonRegistered", "Cash"];

export const FireType = {
	Lean: "Lean",
	Traditional: "Traditional",
	Fat: "Fat",
	Barista: "Barista",
	Coast: "Coast",
} as const;

export type FireType = (typeof FireType)[keyof typeof FireType];

// ── Core Types ──

export type LifeEvent = {
	id: string;
	label: string;
	type: "income" | "expense";
	monthlyAmount: number;
	startDate: string; // "YYYY-MM" format
	endDate?: string; // "YYYY-MM" format, undefined = permanent
};

export type Asset = {
	id: string;
	label: string;
	type: AssetType;
	value: number;
};

export type Liability = {
	id: string;
	label: string;
	balance: number;
	interestRate?: number; // annual rate, e.g. 0.05 = 5%
	minimumPayment?: number; // monthly payment amount
};

export type Persona = {
	id: string;
	name: string;
	description: string;
	whyInteresting: string;
	age: number;
	annualIncome: number;
	monthlySpending: number;
	assets: Asset[];
	liabilities: Liability[];
	housing: {
		type: "rent" | "own";
		monthlyAmount: number;
	};
	lifeEvents?: LifeEvent[];
	sourceUrl?: string;
	retirementStatus: "accumulating" | "retired";
	withdrawalStrategy?: string;
	cashCushion?: number;
	portfolioYield?: number;
	partner?: {
		age: number;
		annualIncome: number;
	};
	resp?: RESPAccount;
};

export type RESPAccount = {
	balance: number;
	contributions: number;
	cesgReceived: number;
	beneficiaryAge: number;
	annualContribution?: number;
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
	netWorth: number;
	totalAssets: number;
	totalLiabilities: number;
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
