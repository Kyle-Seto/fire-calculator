import type { PersonaTemplate } from "@/types";

export const PERSONA_TEMPLATES: PersonaTemplate[] = [
  {
    id: "mr-student-investor",
    name: "Student Investor",
    description:
      "22-year-old Canadian Master's student with $50K to invest. From Millennial Revolution.",
    sourceUrl: "https://www.millennial-revolution.com/build/case-study/reader-case-student-investor/",
    whyInteresting:
      "Can compounding from age 22 overcome a low stipend income? Shows how early investing beats high income.",
    age: 22,
    annualIncome: 43_300,
    monthlySpending: 700,
    accounts: [
      { type: "TFSA", balance: 20_000 },
      { type: "NonRegistered", balance: 30_000 },
    ],
    housing: {
      type: "rent",
      monthlyAmount: 1_250,
    },
    debt: 0,
    retirementStatus: "accumulating",
  },
  {
    id: "mr-retire-or-boat",
    name: "Retire or Boat? (JJ)",
    description:
      "53-year-old earning $220K USD with $1M portfolio, 2 years from FIRE. From Millennial Revolution.",
    sourceUrl: "https://www.millennial-revolution.com/build/case-study/reader-case-retire-and-travel-or-own-a-boat/",
    whyInteresting:
      "High income but high expenses. Rental property income vs portfolio withdrawal — which path wins?",
    age: 53,
    annualIncome: 219_567,
    monthlySpending: 5_250,
    accounts: [
      { type: "RRSP", balance: 450_000 },
      { type: "TFSA", balance: 380_000 },
      { type: "NonRegistered", balance: 170_000 },
    ],
    housing: {
      type: "own",
      monthlyAmount: 1_306,
      mortgageRemaining: 243_452,
    },
    debt: 170_160,
    retirementStatus: "accumulating",
  },
  {
    id: "mr-retiring-with-debt",
    name: "Retiring With Debt",
    description:
      "55-year-old single mom near Vancouver with $1.3M portfolio but $433K debt. From Millennial Revolution.",
    sourceUrl: "https://www.millennial-revolution.com/build/case-study/reader-case-retiring-with-debt/",
    whyInteresting:
      "Can you FIRE with significant debt? RRSP drawdown strategy to avoid OAS clawback.",
    age: 55,
    annualIncome: 100_000,
    monthlySpending: 2_650,
    accounts: [
      { type: "RRSP", balance: 849_000 },
      { type: "TFSA", balance: 209_000 },
      { type: "NonRegistered", balance: 220_000 },
      { type: "Cash", balance: 65_000 },
    ],
    housing: {
      type: "own",
      monthlyAmount: 1_000,
    },
    debt: 433_000,
    retirementStatus: "accumulating",
  },
];

export function getPersonaById(id: string): PersonaTemplate | undefined {
  return PERSONA_TEMPLATES.find((persona) => persona.id === id);
}
