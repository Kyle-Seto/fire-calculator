import type { Persona, FireResults } from "@/types";
import { calculateOptimalRRSPContribution } from "@/engine/tax";
import { calculateYearsToFI } from "@/engine/fire";
import { DEFAULTS } from "@/data/constants";
import { formatCurrency, formatPercent } from "@/lib/utils";

export type Recommendation = {
  id: string;
  title: string;
  description: string;
  impact: string;
  priority: number;
  category: "tax" | "savings" | "retirement" | "risk";
};

const TFSA_CUMULATIVE_LIMIT = 95_000;

function getTFSABalance(persona: Persona): number {
  const tfsa = persona.accounts.find((a) => a.type === "TFSA");
  return tfsa?.balance ?? 0;
}

function getNonRegisteredBalance(persona: Persona): number {
  const nr = persona.accounts.find((a) => a.type === "NonRegistered");
  return nr?.balance ?? 0;
}

function isRetired(persona: Persona): boolean {
  return persona.retirementStatus === "retired";
}

function ruleTFSARoom(persona: Persona): Recommendation | null {
  const tfsaBalance = getTFSABalance(persona);
  if (tfsaBalance >= TFSA_CUMULATIVE_LIMIT) return null;

  const room = TFSA_CUMULATIVE_LIMIT - tfsaBalance;

  return {
    id: "tfsa-room",
    title: "Max Out Your TFSA",
    description: `Your TFSA has ~${formatCurrency(room)} of room. Tax-free growth means every dollar withdrawn in retirement is yours to keep.`,
    impact: "Tax-free compounding accelerates your FIRE timeline",
    priority: 2,
    category: "tax",
  };
}

function ruleRRSPOptimization(persona: Persona): Recommendation | null {
  if (persona.annualIncome <= 55_000) return null;
  if (isRetired(persona)) return null;

  const { contribution, taxSavings } = calculateOptimalRRSPContribution(
    persona.annualIncome,
  );

  if (contribution <= 0 || taxSavings <= 0) return null;

  return {
    id: "rrsp-optimization",
    title: "Optimize RRSP Contributions",
    description: `Contributing ${formatCurrency(contribution)} to your RRSP saves you ${formatCurrency(taxSavings)} in taxes this year.`,
    impact: `${formatCurrency(taxSavings)} tax savings reinvested annually`,
    priority: 1,
    category: "tax",
  };
}

function ruleHighSavingsRate(results: FireResults): Recommendation | null {
  if (results.savingsRate === null || results.savingsRate <= 50) return null;

  return {
    id: "high-savings-rate",
    title: "Elite Savings Rate",
    description: `Your savings rate of ${formatPercent(results.savingsRate)} puts you in elite territory. Most FIRE achievers save 40-60%.`,
    impact: "You're outpacing the typical FIRE timeline",
    priority: 8,
    category: "savings",
  };
}

function ruleLowSavingsRate(
  persona: Persona,
  results: FireResults,
): Recommendation | null {
  if (isRetired(persona)) return null;
  if (results.savingsRate === null || results.savingsRate >= 20) return null;

  const targetRate = Math.min(results.savingsRate + 10, 30);
  const currentAnnualSavings =
    persona.annualIncome - results.annualExpenses;
  const targetAnnualSavings = persona.annualIncome * (targetRate / 100);
  const additionalSavings = targetAnnualSavings - currentAnnualSavings;

  // Estimate years saved by increasing savings rate
  const currentYears = results.yearsToFI;
  const newYearsToFI = calculateYearsToFI(
    results.portfolioTotal,
    targetAnnualSavings,
    results.fireNumber,
    DEFAULTS.realReturnMean,
  );

  const yearsSaved =
    Number.isFinite(currentYears) && Number.isFinite(newYearsToFI)
      ? currentYears - newYearsToFI
      : 0;

  const yearsDescription =
    yearsSaved > 0 ? ` could cut ${yearsSaved.toFixed(1)} years off your timeline` : "";

  return {
    id: "low-savings-rate",
    title: "Boost Your Savings Rate",
    description: `Increasing your savings rate from ${formatPercent(results.savingsRate)} to ${formatPercent(targetRate)}${yearsDescription}. That's an extra ${formatCurrency(additionalSavings)}/year.`,
    impact: yearsSaved > 0 ? `${yearsSaved.toFixed(1)} fewer years to FIRE` : "Significant timeline improvement",
    priority: 2,
    category: "savings",
  };
}

function ruleCashCushionNearFI(
  persona: Persona,
  results: FireResults,
): Recommendation | null {
  if (isRetired(persona)) return null;
  if (!Number.isFinite(results.yearsToFI) || results.yearsToFI >= 3) return null;

  const annualExpenses = results.annualExpenses;
  const portfolioYield = persona.portfolioYield ?? 0.03;
  const annualYieldIncome = results.portfolioTotal * portfolioYield;
  const cushion = Math.max(0, annualExpenses - annualYieldIncome);

  return {
    id: "cash-cushion-near-fi",
    title: "Build Your Cash Cushion",
    description: `You're close! Start building a cash cushion of ${formatCurrency(cushion)} (annual expenses minus portfolio yield) for your first 3-5 years.`,
    impact: "Protects against selling assets in a downturn",
    priority: 1,
    category: "retirement",
  };
}

function ruleYieldShieldRetired(
  persona: Persona,
  results: FireResults,
): Recommendation | null {
  if (!isRetired(persona)) return null;
  if (persona.portfolioYield === undefined) return null;

  const annualYield = results.portfolioTotal * persona.portfolioYield;
  const coveragePercent = (annualYield / results.annualExpenses) * 100;

  return {
    id: "yield-shield-retired",
    title: "Yield Shield Status",
    description: `Your portfolio yields ${formatPercent(persona.portfolioYield * 100)} (${formatCurrency(annualYield)}/yr). This covers ${formatPercent(coveragePercent, 0)} of your expenses \u2014 the Yield Shield protects you from selling in a downturn.`,
    impact:
      coveragePercent >= 80
        ? "Strong yield coverage \u2014 minimal sequence risk"
        : "Consider shifting toward dividend-producing assets",
    priority: 3,
    category: "retirement",
  };
}

function ruleSequenceOfReturnsWarning(
  persona: Persona,
  results: FireResults,
): Recommendation | null {
  if (!isRetired(persona)) return null;
  if (!results.monteCarloResults) return null;

  const successRate = results.monteCarloResults.successRate * 100;
  if (successRate >= 90) return null;

  return {
    id: "sequence-of-returns-warning",
    title: "Sequence of Returns Risk",
    description: `Your portfolio survival rate is ${formatPercent(successRate, 0)}. Consider reducing spending or building a larger cash cushion.`,
    impact: "Improving to 90%+ success rate is the standard safety target",
    priority: 1,
    category: "risk",
  };
}

function ruleNonRegisteredTaxEfficiency(
  persona: Persona,
): Recommendation | null {
  if (isRetired(persona)) return null;

  const nrBalance = getNonRegisteredBalance(persona);
  if (nrBalance <= 50_000) return null;

  return {
    id: "non-registered-tax-efficiency",
    title: "Tax-Loss Harvesting Opportunity",
    description: `You have ${formatCurrency(nrBalance)} in non-registered accounts. Track unrealized losses to offset capital gains and reduce your tax bill each year.`,
    impact: "Reduces annual tax drag on investment returns",
    priority: 5,
    category: "tax",
  };
}

function ruleReduceSpendingImpact(
  persona: Persona,
  results: FireResults,
): Recommendation | null {
  if (isRetired(persona)) return null;
  if (!Number.isFinite(results.yearsToFI)) return null;

  const monthlyReduction = 200;
  const annualReduction = monthlyReduction * 12;
  const newAnnualExpenses = results.annualExpenses - annualReduction;
  const newAnnualSavings = persona.annualIncome - newAnnualExpenses;
  const newFireNumber = newAnnualExpenses / DEFAULTS.withdrawalRate;

  const newYearsToFI = calculateYearsToFI(
    results.portfolioTotal,
    newAnnualSavings,
    newFireNumber,
    DEFAULTS.realReturnMean,
  );

  if (!Number.isFinite(newYearsToFI)) return null;

  const monthsSaved = (results.yearsToFI - newYearsToFI) * 12;

  if (monthsSaved <= 0) return null;

  return {
    id: "reduce-spending-impact",
    title: "Cut $200/mo, Retire Sooner",
    description: `Reducing spending by $200/month lowers both your expenses and your FIRE number. The double impact moves your timeline forward.`,
    impact: `Moves FIRE date ${Math.round(monthsSaved)} months earlier`,
    priority: 4,
    category: "savings",
  };
}

export function generateRecommendations(
  persona: Persona,
  results: FireResults,
): Recommendation[] {
  const all: (Recommendation | null)[] = [
    ruleTFSARoom(persona),
    ruleRRSPOptimization(persona),
    ruleHighSavingsRate(results),
    ruleLowSavingsRate(persona, results),
    ruleCashCushionNearFI(persona, results),
    ruleYieldShieldRetired(persona, results),
    ruleSequenceOfReturnsWarning(persona, results),
    ruleNonRegisteredTaxEfficiency(persona),
    ruleReduceSpendingImpact(persona, results),
  ];

  return all
    .filter((r): r is Recommendation => r !== null)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);
}
