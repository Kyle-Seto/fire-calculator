import type { PersonaTemplate } from "@/types";

export const PERSONA_TEMPLATES: PersonaTemplate[] = [
  {
    id: "mr-student-investor",
    name: "Student Investor",
    description:
      "22-year-old Canadian Master's student with $40K to invest. From Millennial Revolution.",
    sourceUrl: "https://www.millennial-revolution.com/build/case-study/reader-case-student-investor/",
    whyInteresting:
      "Can compounding from age 22 overcome a low stipend income? Shows how early investing beats high income.",
    age: 22,
    annualIncome: 37_000,
    monthlySpending: 700,
    accounts: [
      { type: "Cash", balance: 40_000 },
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
      "53-year-old earning $220K USD with $1M portfolio, 2 years from FIRE. Amounts in USD. From Millennial Revolution.",
    sourceUrl: "https://www.millennial-revolution.com/build/case-study/reader-case-retire-and-travel-or-own-a-boat/",
    whyInteresting:
      "High income but high expenses. Rental property income vs portfolio withdrawal — which path wins?",
    age: 53,
    annualIncome: 219_567,
    monthlySpending: 7_419,
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
    lifeEvents: [
      {
        id: "jj-rental-income",
        label: "Rental property income",
        type: "income",
        monthlyAmount: 4_000,
        startDate: "2028-01",
      },
      {
        id: "jj-boat-upkeep",
        label: "Boat upkeep (until sold)",
        type: "expense",
        monthlyAmount: 1_000,
        startDate: "2026-01",
        endDate: "2028-01",
      },
    ],
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
    monthlySpending: 1_680,
    accounts: [
      { type: "RRSP", balance: 849_000 },
      { type: "TFSA", balance: 209_000 },
      { type: "NonRegistered", balance: 220_000 },
      { type: "Cash", balance: 65_000 },
    ],
    housing: {
      type: "own",
      monthlyAmount: 1_730,
    },
    debt: 433_000,
    lifeEvents: [
      {
        id: "rwd-investment-loan",
        label: "Investment loan interest",
        type: "expense",
        monthlyAmount: 970,
        startDate: "2025-06",
        endDate: "2033-06",
      },
      {
        id: "rwd-cpp",
        label: "CPP benefits",
        type: "income",
        monthlyAmount: 848,
        startDate: "2036-01",
      },
      {
        id: "rwd-oas",
        label: "OAS benefits",
        type: "income",
        monthlyAmount: 740,
        startDate: "2036-01",
      },
      {
        id: "rwd-pension",
        label: "Employer pension",
        type: "income",
        monthlyAmount: 1_000,
        startDate: "2036-01",
      },
    ],
    retirementStatus: "accumulating",
  },
  {
    id: "mr-ivf-fire",
    name: "How Will IVF Affect FIRE?",
    description:
      "37-year-old self-employed Vancouverite earning $200K gross, $340K portfolio. IVF + 2 kids planned. From Millennial Revolution.",
    sourceUrl: "https://www.millennial-revolution.com/build/case-study/reader-case-how-will-ivf-affect-fire/",
    whyInteresting:
      "Major one-time costs (IVF $120K) and future child expenses collide with a strong savings rate. Does FIRE survive parenthood?",
    age: 37,
    annualIncome: 130_000,
    monthlySpending: 2_784,
    accounts: [
      { type: "RRSP", balance: 137_237 },
      { type: "TFSA", balance: 135_591 },
      { type: "NonRegistered", balance: 66_884 },
    ],
    housing: {
      type: "rent",
      monthlyAmount: 2_350,
    },
    debt: 0,
    lifeEvents: [
      {
        id: "ivf-egg-freezing",
        label: "Egg freezing + storage",
        type: "expense",
        monthlyAmount: 1_733,
        startDate: "2026-01",
        endDate: "2027-01",
      },
      {
        id: "ivf-treatments",
        label: "IVF treatments (2 children)",
        type: "expense",
        monthlyAmount: 5_000,
        startDate: "2027-01",
        endDate: "2029-01",
      },
      {
        id: "ivf-ccb",
        label: "Canada Child Benefit",
        type: "income",
        monthlyAmount: 666,
        startDate: "2029-01",
      },
    ],
    retirementStatus: "accumulating",
  },
  {
    id: "mr-geo-arbitrage",
    name: "Dreaming of Geo-Arbitrage",
    description:
      "Common-law couple (52 & 53) in BC with $80K invested + $620K home. Planning to sell and travel. From Millennial Revolution.",
    sourceUrl: "https://www.millennial-revolution.com/build/case-study/reader-case-dreaming-of-geo-arbitrage/",
    whyInteresting:
      "Geo-arbitrage drops expenses from $60K to $30K. Home equity becomes the portfolio. CPP/OAS in ~10 years seals it.",
    age: 53,
    annualIncome: 111_000,
    monthlySpending: 3_100,
    accounts: [
      { type: "NonRegistered", balance: 65_000 },
      { type: "Cash", balance: 15_000 },
    ],
    housing: {
      type: "own",
      monthlyAmount: 1_900,
      mortgageRemaining: 20_300,
    },
    debt: 0,
    lifeEvents: [
      {
        id: "geo-cpp-oas",
        label: "CPP + OAS (both partners)",
        type: "income",
        monthlyAmount: 1_700,
        startDate: "2036-01",
      },
    ],
    retirementStatus: "accumulating",
    partner: {
      age: 52,
      annualIncome: 0,
    },
  },
  {
    id: "mr-healing-brain",
    name: "Ex Stole My Inheritance",
    description:
      "60-year-old Canadian rebuilding after losing $350K to abusive ex. $70K portfolio, 5 years to retirement. From Millennial Revolution.",
    sourceUrl: "https://www.millennial-revolution.com/build/case-study/reader-case-ex-stole-my-inheritance-am-i-screwed-2/",
    whyInteresting:
      "Starting over at 60. Government benefits (CPP + OAS + pension) become the real FIRE engine, not the portfolio.",
    age: 60,
    annualIncome: 70_103,
    monthlySpending: 2_413,
    accounts: [
      { type: "RRSP", balance: 37_695 },
      { type: "TFSA", balance: 7_300 },
      { type: "NonRegistered", balance: 15_000 },
      { type: "Cash", balance: 10_000 },
    ],
    housing: {
      type: "own",
      monthlyAmount: 926,
      mortgageRemaining: 139_141,
    },
    debt: 0,
    lifeEvents: [
      {
        id: "hb-pension",
        label: "Employer pension",
        type: "income",
        monthlyAmount: 1_000,
        startDate: "2031-01",
      },
      {
        id: "hb-cpp",
        label: "CPP benefits",
        type: "income",
        monthlyAmount: 848,
        startDate: "2031-01",
      },
      {
        id: "hb-oas",
        label: "OAS benefits",
        type: "income",
        monthlyAmount: 740,
        startDate: "2031-01",
      },
    ],
    retirementStatus: "accumulating",
  },
];

export function getPersonaById(id: string): PersonaTemplate | undefined {
  return PERSONA_TEMPLATES.find((persona) => persona.id === id);
}
