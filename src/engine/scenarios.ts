import { DEFAULTS } from "@/data/constants";
import { calculateAllResults } from "@/engine/fire";
import type { Persona } from "@/types";

// ── Types ──

export type Scenario = {
	id: string;
	name: string;
	description: string;
	icon: string;
	apply: (persona: Persona) => Persona;
};

export type MetricSnapshot = {
	fireDateEstimate: Date | null;
	yearsToFI: number;
	fireNumber: number;
	portfolioTotal: number;
	monthlyExpenses: number;
	annualIncome: number;
	savingsRate: number | null;
	afterTaxSavingsRate: number | null;
	netWorth: number;
	totalLiabilities: number;
	fireProgress: number;
};

export type ScenarioResult = {
	scenario: Scenario;
	originalFireDate: Date | null;
	newFireDate: Date | null;
	originalYearsToFI: number;
	newYearsToFI: number;
	deltaMonths: number; // positive = later, negative = earlier
	baseSnapshot: MetricSnapshot;
	scenarioSnapshot: MetricSnapshot;
};

// ── Scenario Definitions ──

function clonePersona(persona: Persona): Persona {
	return {
		...persona,
		assets: persona.assets.map((a) => ({ ...a })),
		liabilities: persona.liabilities.map((l) => ({ ...l })),
		housing: { ...persona.housing },
		partner: persona.partner ? { ...persona.partner } : undefined,
		lifeEvents: persona.lifeEvents?.map((e) => ({ ...e })),
	};
}

// ── Persona-Specific Scenarios ──
// Each persona gets scenarios tailored to their actual situation and the decisions
// discussed in their Millennial Revolution case study.

const PERSONA_SCENARIOS: Record<string, (persona: Persona) => Scenario[]> = {
	// Student Investor — 22yo, $37K stipend, $40K savings, renting
	"mr-student-investor": () => [
		{
			id: "si-post-grad-job",
			name: "Graduate and land a $65K job",
			description: "Finish school and start full-time. Nearly double your income.",
			icon: "\u{1F393}",
			apply: (p) => {
				const c = clonePersona(p);
				c.annualIncome = 65_000;
				return c;
			},
		},
		{
			id: "si-max-tfsa",
			name: "Max out TFSA contributions",
			description: "Redirect $7K/yr into TFSA for tax-free growth.",
			icon: "\u{1F4B0}",
			apply: (p) => {
				const c = clonePersona(p);
				const tfsa = c.assets.find((a) => a.type === "TFSA");
				if (tfsa) tfsa.value += 7_000;
				else c.assets.push({ id: "sc-tfsa", label: "TFSA", type: "TFSA", value: 7_000 });
				return c;
			},
		},
		{
			id: "si-cheaper-rent",
			name: "Find a roommate",
			description: "Split rent — drop from $1,250/mo to $800/mo.",
			icon: "\u{1F3E0}",
			apply: (p) => {
				const c = clonePersona(p);
				c.housing = { type: "rent", monthlyAmount: 800 };
				return c;
			},
		},
		{
			id: "si-side-income",
			name: "Pick up freelance work",
			description: "Add $12K/yr in side income while studying.",
			icon: "\u{1F4BB}",
			apply: (p) => {
				const c = clonePersona(p);
				c.annualIncome += 12_000;
				return c;
			},
		},
	],

	// Retire or Boat? (JJ) — 53yo, $220K income, rental + boat + home, debt
	"mr-retire-or-boat": () => [
		{
			id: "jj-sell-boat",
			name: "Sell the boat",
			description: "Recoup $50K and save $1,000/mo in upkeep costs.",
			icon: "\u{26F5}",
			apply: (p) => {
				const c = clonePersona(p);
				c.assets = c.assets.filter((a) => a.id !== "jj-boat");
				addToPortfolio(c, 50_000);
				// Remove boat upkeep life event
				c.lifeEvents = c.lifeEvents?.filter((e) => e.id !== "jj-boat-upkeep");
				return c;
			},
		},
		{
			id: "jj-sell-rental",
			name: "Sell the rental property",
			description: "Liquidate the rental, pay off its mortgage, add equity to portfolio.",
			icon: "\u{1F3E2}",
			apply: (p) => {
				const c = clonePersona(p);
				const rental = c.assets.find((a) => a.id === "jj-rental");
				const rentalValue = rental?.value ?? 0;
				c.assets = c.assets.filter((a) => a.id !== "jj-rental");
				const mortgage = c.liabilities.find((l) => l.id === "jj-mortgage2");
				const mortgageBalance = mortgage?.balance ?? 0;
				c.liabilities = c.liabilities.filter((l) => l.id !== "jj-mortgage2");
				const equity = rentalValue - mortgageBalance;
				if (equity > 0) addToPortfolio(c, equity);
				// Remove rental income life event
				c.lifeEvents = c.lifeEvents?.filter((e) => e.id !== "jj-rental-income");
				return c;
			},
		},
		{
			id: "jj-pay-off-mortgages",
			name: "Pay off both mortgages",
			description: "Clear $413K in mortgage debt from portfolio.",
			icon: "\u{1F4A8}",
			apply: (p) => {
				const c = clonePersona(p);
				const totalDebt = c.liabilities.reduce((s, l) => s + l.balance, 0);
				deductFromPortfolio(c, totalDebt);
				c.liabilities = [];
				return c;
			},
		},
		{
			id: "jj-retire-now",
			name: "Retire now and travel",
			description: "Stop working. Live off rental income + portfolio withdrawals.",
			icon: "\u{2708}\u{FE0F}",
			apply: (p) => {
				const c = clonePersona(p);
				c.annualIncome = 0;
				c.monthlySpending = 5_000; // lower spending in retirement, travel
				return c;
			},
		},
	],

	// Retiring With Debt — 55yo single mom, $1.3M portfolio, $433K debt
	"mr-retiring-with-debt": () => [
		{
			id: "rwd-pay-all-debt",
			name: "Pay off all debt from portfolio",
			description: "Clear $433K in HELOC + investment loan. Zero liabilities.",
			icon: "\u{1F4A8}",
			apply: (p) => {
				const c = clonePersona(p);
				const totalDebt = c.liabilities.reduce((s, l) => s + l.balance, 0);
				deductFromPortfolio(c, totalDebt);
				c.liabilities = [];
				// No more interest payments
				// Debt payments are removed since liabilities are cleared
				return c;
			},
		},
		{
			id: "rwd-sell-townhouse",
			name: "Sell the townhouse and rent",
			description: "Unlock $950K in home equity. Rent for $2,000/mo.",
			icon: "\u{1F3E0}",
			apply: (p) => {
				const c = clonePersona(p);
				const home = c.assets.find((a) => a.id === "rwd-home");
				if (home) {
					addToPortfolio(c, home.value);
					c.assets = c.assets.filter((a) => a.id !== "rwd-home");
				}
				c.housing = { type: "rent", monthlyAmount: 2_000 };
				return c;
			},
		},
		{
			id: "rwd-pay-heloc-first",
			name: "Pay off HELOC only",
			description: "Clear the $233K HELOC, keep the investment loan working.",
			icon: "\u{1F3AF}",
			apply: (p) => {
				const c = clonePersona(p);
				const heloc = c.liabilities.find((l) => l.id === "rwd-heloc");
				if (heloc) {
					deductFromPortfolio(c, heloc.balance);
					c.liabilities = c.liabilities.filter((l) => l.id !== "rwd-heloc");
				}
				return c;
			},
		},
		{
			id: "rwd-work-2-more-years",
			name: "Work 2 more years",
			description: "Build a bigger cash cushion before drawing down.",
			icon: "\u{23F3}",
			apply: (p) => {
				const c = clonePersona(p);
				// ~2 years of savings at current rate
				addToPortfolio(c, 80_000);
				return c;
			},
		},
	],

	// IVF + FIRE — 37yo self-employed, $340K portfolio, IVF planned
	"mr-ivf-fire": () => [
		{
			id: "ivf-skip-ivf",
			name: "Skip IVF entirely",
			description: "Save ~$120K in egg freezing and IVF treatment costs.",
			icon: "\u{1F6AB}",
			apply: (p) => {
				const c = clonePersona(p);
				// Remove IVF-related life events
				c.lifeEvents = c.lifeEvents?.filter(
					(e) => e.id !== "ivf-egg-freezing" && e.id !== "ivf-treatments" && e.id !== "ivf-ccb",
				);
				return c;
			},
		},
		{
			id: "ivf-one-kid",
			name: "Have 1 kid instead of 2",
			description: "Half the IVF cost. Still get CCB for one child.",
			icon: "\u{1F476}",
			apply: (p) => {
				const c = clonePersona(p);
				// Halve IVF treatment cost
				const ivfEvent = c.lifeEvents?.find((e) => e.id === "ivf-treatments");
				if (ivfEvent) ivfEvent.monthlyAmount = 2_500;
				// Lower CCB (1 kid)
				const ccb = c.lifeEvents?.find((e) => e.id === "ivf-ccb");
				if (ccb) ccb.monthlyAmount = 333;
				return c;
			},
		},
		{
			id: "ivf-buy-home",
			name: "Buy a home",
			description: "$120K down on a $600K home. Monthly costs similar to rent.",
			icon: "\u{1F3E1}",
			apply: (p) => {
				const c = clonePersona(p);
				deductFromPortfolio(c, 120_000);
				c.assets.push({ id: "sc-home", label: "Home", type: "Property", value: 600_000 });
				c.liabilities.push({
					id: "sc-mortgage",
					label: "Mortgage",
					balance: 480_000,
					interestRate: 0.055,
					minimumPayment: 2_800,
				});
				c.housing = { type: "own", monthlyAmount: 2_800 };
				return c;
			},
		},
		{
			id: "ivf-move-cheaper",
			name: "Move to a cheaper city",
			description: "Leave Vancouver. Cut rent from $2,350 to $1,400/mo.",
			icon: "\u{1F30D}",
			apply: (p) => {
				const c = clonePersona(p);
				c.housing = { type: "rent", monthlyAmount: 1_400 };
				return c;
			},
		},
	],

	// Geo-Arbitrage — couple 52/53, $80K invested + $620K home
	"mr-geo-arbitrage": () => [
		{
			id: "geo-sell-and-travel",
			name: "Sell house and geo-arbitrage",
			description: "Sell for $620K. Live abroad for $2,500/mo all-in.",
			icon: "\u{1F30D}",
			apply: (p) => {
				const c = clonePersona(p);
				const home = c.assets.find((a) => a.id === "geo-home");
				if (home) {
					addToPortfolio(c, home.value);
					c.assets = c.assets.filter((a) => a.id !== "geo-home");
				}
				c.annualIncome = 0; // stop working
				c.monthlySpending = 1_200;
				c.housing = { type: "rent", monthlyAmount: 1_300 };
				return c;
			},
		},
		{
			id: "geo-sell-rent-local",
			name: "Sell house and rent locally",
			description: "Free up $620K equity. Rent in BC for $2,000/mo.",
			icon: "\u{1F3E0}",
			apply: (p) => {
				const c = clonePersona(p);
				const home = c.assets.find((a) => a.id === "geo-home");
				if (home) {
					addToPortfolio(c, home.value);
					c.assets = c.assets.filter((a) => a.id !== "geo-home");
				}
				c.housing = { type: "rent", monthlyAmount: 2_000 };
				return c;
			},
		},
		{
			id: "geo-keep-working",
			name: "Keep house, work 3 more years",
			description: "Save aggressively for 3 more years before retiring.",
			icon: "\u{23F3}",
			apply: (p) => {
				const c = clonePersona(p);
				// ~3 years of aggressive savings
				addToPortfolio(c, 120_000);
				return c;
			},
		},
		{
			id: "geo-part-time",
			name: "Sell house, consult part-time",
			description: "Geo-arbitrage + $30K/yr consulting to bridge to CPP/OAS.",
			icon: "\u{1F4BB}",
			apply: (p) => {
				const c = clonePersona(p);
				const home = c.assets.find((a) => a.id === "geo-home");
				if (home) {
					addToPortfolio(c, home.value);
					c.assets = c.assets.filter((a) => a.id !== "geo-home");
				}
				c.annualIncome = 30_000;
				c.monthlySpending = 1_200;
				c.housing = { type: "rent", monthlyAmount: 1_300 };
				return c;
			},
		},
	],

	// Ex Stole My Inheritance — 60yo rebuilding, $70K portfolio, $139K mortgage
	"mr-healing-brain": () => [
		{
			id: "hb-pay-mortgage",
			name: "Pay off the mortgage",
			description: "Use portfolio to clear $139K mortgage. Free up $926/mo.",
			icon: "\u{1F4A8}",
			apply: (p) => {
				const c = clonePersona(p);
				const mortgage = c.liabilities.find((l) => l.id === "hb-mortgage");
				if (mortgage) {
					deductFromPortfolio(c, mortgage.balance);
					c.liabilities = [];
				}
				return c;
			},
		},
		{
			id: "hb-sell-downsize",
			name: "Sell house and downsize",
			description: "Sell for $300K, buy a $200K condo. Net $100K + clear mortgage.",
			icon: "\u{1F3E0}",
			apply: (p) => {
				const c = clonePersona(p);
				const home = c.assets.find((a) => a.id === "hb-home");
				const mortgage = c.liabilities.find((l) => l.id === "hb-mortgage");
				const equity = (home?.value ?? 0) - (mortgage?.balance ?? 0);
				c.assets = c.assets.filter((a) => a.id !== "hb-home");
				c.liabilities = c.liabilities.filter((l) => l.id !== "hb-mortgage");
				// Buy cheaper condo
				c.assets.push({ id: "sc-condo", label: "Condo", type: "Property", value: 200_000 });
				// Net proceeds go to portfolio
				const netProceeds = equity - 200_000;
				if (netProceeds > 0) addToPortfolio(c, netProceeds);
				c.housing = { type: "own", monthlyAmount: 500 }; // lower condo fees
				return c;
			},
		},
		{
			id: "hb-work-longer",
			name: "Work 2 more years",
			description: "More time for portfolio to grow before CPP/OAS kick in.",
			icon: "\u{23F3}",
			apply: (p) => {
				const c = clonePersona(p);
				addToPortfolio(c, 56_000); // ~2 years of savings
				return c;
			},
		},
		{
			id: "hb-sell-and-rent",
			name: "Sell house and rent",
			description: "Unlock $161K equity ($300K - $139K mortgage). Rent for $1,500/mo.",
			icon: "\u{1F3E2}",
			apply: (p) => {
				const c = clonePersona(p);
				const home = c.assets.find((a) => a.id === "hb-home");
				const mortgage = c.liabilities.find((l) => l.id === "hb-mortgage");
				const equity = (home?.value ?? 0) - (mortgage?.balance ?? 0);
				c.assets = c.assets.filter((a) => a.id !== "hb-home");
				c.liabilities = c.liabilities.filter((l) => l.id !== "hb-mortgage");
				if (equity > 0) addToPortfolio(c, equity);
				c.housing = { type: "rent", monthlyAmount: 1_500 };
				return c;
			},
		},
	],
};

// ── Fallback: generate scenarios from persona characteristics ──

function generateFallbackScenarios(persona: Persona): Scenario[] {
	const scenarios: Scenario[] = [];
	const totalDebt = persona.liabilities.reduce((s, l) => s + l.balance, 0);
	const hasHome = persona.assets.some((a) => a.type === "Property");
	const totalExpenses = persona.monthlySpending + persona.housing.monthlyAmount;

	if (totalDebt > 0) {
		scenarios.push({
			id: "pay-off-debt",
			name: "Pay off all debt",
			description: `Clear ${formatCompact(totalDebt)} in liabilities from portfolio.`,
			icon: "\u{1F4A8}",
			apply: (p) => {
				const c = clonePersona(p);
				const debt = c.liabilities.reduce((s, l) => s + l.balance, 0);
				if (debt > 0) {
					deductFromPortfolio(c, debt);
					c.liabilities = [];
				}
				return c;
			},
		});
	}

	if (hasHome) {
		scenarios.push({
			id: "sell-home-rent",
			name: "Sell the house and rent",
			description: "Unlock home equity into portfolio. Rent for $2,000/mo.",
			icon: "\u{1F3E0}",
			apply: (p) => {
				const c = clonePersona(p);
				const ha = c.assets.find((a) => a.type === "Property");
				const hv = ha?.value ?? 0;
				const mi = c.liabilities.findIndex(
					(l) =>
						l.label.toLowerCase().includes("mortgage") || l.label.toLowerCase().includes("heloc"),
				);
				const mb = mi >= 0 ? c.liabilities[mi].balance : 0;
				c.assets = c.assets.filter((a) => a !== ha);
				if (mi >= 0) c.liabilities.splice(mi, 1);
				if (hv - mb > 0) addToPortfolio(c, hv - mb);
				c.housing = { type: "rent", monthlyAmount: 2_000 };
				return c;
			},
		});
	}

	if (totalExpenses > 3_000) {
		const cutSpending = Math.round(persona.monthlySpending * 0.7);
		scenarios.push({
			id: "cut-spending",
			name: "Cut spending by 30%",
			description: `Reduce discretionary spending to ${formatCompact(cutSpending)}/mo.`,
			icon: "\u{2702}\u{FE0F}",
			apply: (p) => {
				const c = clonePersona(p);
				c.monthlySpending = cutSpending;
				return c;
			},
		});
	}

	if (persona.annualIncome > 0) {
		const boost = Math.round(persona.annualIncome * 0.2);
		scenarios.push({
			id: "income-boost",
			name: "Earn 20% more",
			description: `Raise income by ${formatCompact(boost)}/yr.`,
			icon: "\u{1F4BC}",
			apply: (p) => {
				const c = clonePersona(p);
				c.annualIncome = Math.round(c.annualIncome * 1.2);
				return c;
			},
		});
	}

	return scenarios;
}

export function generateScenarios(persona: Persona): Scenario[] {
	const personaSpecific = PERSONA_SCENARIOS[persona.id];
	if (personaSpecific) return personaSpecific(persona);
	return generateFallbackScenarios(persona);
}

function formatCompact(n: number): string {
	if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
	return `$${n}`;
}

// ── Helpers for scenario apply functions ──

function deductFromPortfolio(p: Persona, amount: number) {
	const investable = ["NonRegistered", "Cash", "FHSA"];
	let remaining = amount;
	// Non-reg and cash first
	for (const asset of p.assets) {
		if (remaining <= 0) break;
		if (investable.includes(asset.type)) {
			const deduction = Math.min(asset.value, remaining);
			asset.value -= deduction;
			remaining -= deduction;
		}
	}
	// Then anything else
	for (const asset of p.assets) {
		if (remaining <= 0) break;
		const deduction = Math.min(asset.value, remaining);
		asset.value -= deduction;
		remaining -= deduction;
	}
}

function addToPortfolio(p: Persona, amount: number) {
	const nonReg = p.assets.find((a) => a.type === "NonRegistered");
	if (nonReg) {
		nonReg.value += amount;
	} else {
		const cash = p.assets.find((a) => a.type === "Cash");
		if (cash) {
			cash.value += amount;
		} else {
			p.assets.push({ id: "sc-cash", label: "Cash", type: "Cash", value: amount });
		}
	}
}

// ── Custom Decision Builder ──

export type CustomDecision = {
	name: string;
	incomeChange: number; // $/yr — positive = more income
	spendingChange: number; // $/mo — positive = more spending
	portfolioChange: number; // $ — positive = add to portfolio, negative = withdraw
	liabilityChange: number; // $ — positive = add debt, negative = pay off
};

export function buildCustomScenario(decision: CustomDecision): Scenario {
	return {
		id: `custom-${Date.now()}`,
		name: decision.name || "Custom decision",
		description: "",
		icon: "\u{1F9EA}",
		apply: (persona) => {
			const p = clonePersona(persona);

			p.annualIncome += decision.incomeChange;
			p.monthlySpending += decision.spendingChange;

			// Apply one-time portfolio change to first investable account (or create Cash)
			if (decision.portfolioChange !== 0) {
				const investable = p.assets.find((a) =>
					["TFSA", "RRSP", "NonRegistered", "Cash"].includes(a.type),
				);
				if (investable) {
					investable.value += decision.portfolioChange;
					if (investable.value < 0) investable.value = 0;
				} else if (decision.portfolioChange > 0) {
					p.assets.push({
						id: "custom-cash",
						label: "Cash",
						type: "Cash",
						value: decision.portfolioChange,
					});
				}
			}

			// Apply liability change
			if (decision.liabilityChange > 0) {
				p.liabilities.push({
					id: `custom-debt-${Date.now()}`,
					label: "New debt",
					balance: decision.liabilityChange,
				});
			} else if (decision.liabilityChange < 0 && p.liabilities.length > 0) {
				let remaining = Math.abs(decision.liabilityChange);
				for (const l of p.liabilities) {
					if (remaining <= 0) break;
					const reduction = Math.min(l.balance, remaining);
					l.balance -= reduction;
					remaining -= reduction;
				}
				p.liabilities = p.liabilities.filter((l) => l.balance > 0);
			}

			return p;
		},
	};
}

// ── Evaluation ──

function toSnapshot(
	r: Omit<import("@/types").FireResults, "monteCarloResults">,
	income: number,
): MetricSnapshot {
	return {
		fireDateEstimate: r.fireDateEstimate,
		yearsToFI: r.yearsToFI,
		fireNumber: r.fireNumber,
		portfolioTotal: r.portfolioTotal,
		monthlyExpenses: r.monthlyExpenses,
		annualIncome: income,
		savingsRate: r.savingsRate,
		afterTaxSavingsRate: r.afterTaxSavingsRate,
		netWorth: r.netWorth,
		totalLiabilities: r.totalLiabilities,
		fireProgress: r.fireProgress,
	};
}

export function evaluateScenario(
	scenario: Scenario,
	persona: Persona,
	withdrawalRate: number = DEFAULTS.withdrawalRate,
	precomputedBase?: Omit<import("@/types").FireResults, "monteCarloResults">,
): ScenarioResult {
	const original = precomputedBase ?? calculateAllResults(persona, withdrawalRate);
	const modified = scenario.apply(persona);
	const newResults = calculateAllResults(modified, withdrawalRate);

	const originalYears = original.yearsToFI;
	const newYears = newResults.yearsToFI;

	let deltaMonths: number;
	if (!Number.isFinite(newYears) && !Number.isFinite(originalYears)) {
		deltaMonths = 0;
	} else if (!Number.isFinite(newYears)) {
		deltaMonths = Infinity;
	} else if (!Number.isFinite(originalYears)) {
		deltaMonths = -Infinity;
	} else {
		deltaMonths = (newYears - originalYears) * 12;
	}

	return {
		scenario,
		originalFireDate: original.fireDateEstimate,
		newFireDate: newResults.fireDateEstimate,
		originalYearsToFI: originalYears,
		newYearsToFI: newYears,
		deltaMonths,
		baseSnapshot: toSnapshot(original, persona.annualIncome),
		scenarioSnapshot: toSnapshot(newResults, modified.annualIncome),
	};
}

export function evaluateAllScenarios(
	persona: Persona,
	withdrawalRate: number = DEFAULTS.withdrawalRate,
): ScenarioResult[] {
	const scenarios = generateScenarios(persona);
	const base = calculateAllResults(persona, withdrawalRate);
	return scenarios
		.map((scenario) => evaluateScenario(scenario, persona, withdrawalRate, base))
		.sort((a, b) => a.deltaMonths - b.deltaMonths);
}
