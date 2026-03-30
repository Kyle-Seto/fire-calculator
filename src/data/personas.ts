import type { PersonaTemplate } from "@/types";

export const PERSONA_TEMPLATES: PersonaTemplate[] = [
  {
    id: "early-career",
    name: "Early Career Saver",
    description:
      "Classic FIRE starter. 27-year-old earning $75K, renting in Toronto.",
    whyInteresting:
      "Shows the power of savings rate + compounding. Demonstrates TFSA vs RRSP contribution ordering.",
    age: 27,
    annualIncome: 75_000,
    monthlySpending: 3_200,
    accounts: [
      { type: "TFSA", balance: 18_000 },
      { type: "RRSP", balance: 12_000 },
      { type: "NonRegistered", balance: 10_000 },
    ],
    housing: {
      type: "rent",
      monthlyAmount: 1_800,
    },
    debt: 0,
    retirementStatus: "accumulating",
  },
  {
    id: "mid-career",
    name: "Mid-Career Couple",
    description:
      "Dual-income couple with a kid, navigating mortgage and savings.",
    whyInteresting:
      "The messy middle. Tax optimization matters most here.",
    age: 35,
    annualIncome: 160_000,
    monthlySpending: 5_800,
    accounts: [
      { type: "TFSA", balance: 80_000 },
      { type: "RRSP", balance: 100_000 },
      { type: "NonRegistered", balance: 60_000 },
    ],
    housing: {
      type: "own",
      monthlyAmount: 2_200,
      mortgageRemaining: 420_000,
    },
    debt: 0,
    retirementStatus: "accumulating",
    partner: {
      age: 33,
      annualIncome: 65_000,
    },
  },
  {
    id: "almost-there",
    name: "Almost There",
    description:
      "1-2 years from financial independence. Lean FIRE path.",
    whyInteresting:
      "Shows pre-retirement moves: building cash cushion, Yield Shield planning.",
    age: 42,
    annualIncome: 110_000,
    monthlySpending: 3_500,
    accounts: [
      { type: "TFSA", balance: 69_500 },
      { type: "RRSP", balance: 380_000 },
      { type: "NonRegistered", balance: 400_500 },
    ],
    housing: {
      type: "rent",
      monthlyAmount: 1_400,
    },
    debt: 0,
    retirementStatus: "accumulating",
  },
  {
    id: "just-fired",
    name: "Just FIREd",
    description: "Recently retired at 38 with a $1.1M portfolio.",
    whyInteresting:
      "Withdrawal phase. Sequence-of-returns risk visualization.",
    age: 38,
    annualIncome: 0,
    monthlySpending: 3_400,
    accounts: [
      { type: "TFSA", balance: 69_500 },
      { type: "RRSP", balance: 450_000 },
      { type: "NonRegistered", balance: 580_500 },
    ],
    housing: {
      type: "rent",
      monthlyAmount: 1_200,
    },
    debt: 0,
    retirementStatus: "retired",
    withdrawalStrategy: "Yield Shield + Cash Cushion",
    cashCushion: 25_000,
    portfolioYield: 0.032,
  },
];

export function getPersonaById(id: string): PersonaTemplate | undefined {
  return PERSONA_TEMPLATES.find((persona) => persona.id === id);
}
