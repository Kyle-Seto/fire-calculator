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
    assets: [
      { id: "si-cash", label: "Savings", type: "Cash", value: 40_000 },
      { id: "si-fhsa", label: "FHSA", type: "FHSA", value: 8_000 },
    ],
    liabilities: [],
    housing: {
      type: "rent",
      monthlyAmount: 1_250,
    },
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
    assets: [
      { id: "jj-pretax", label: "Pretax (401k/IRA)", type: "RRSP", value: 450_000 },
      { id: "jj-roth", label: "Roth", type: "TFSA", value: 380_000 },
      { id: "jj-taxable", label: "Taxable", type: "NonRegistered", value: 170_000 },
      { id: "jj-home", label: "Primary residence", type: "Property", value: 575_000 },
      { id: "jj-rental", label: "Rental property", type: "Property", value: 526_000 },
      { id: "jj-boat", label: "Sailboat", type: "Other", value: 50_000 },
      { id: "jj-cars", label: "Vehicles", type: "Vehicle", value: 22_000 },
    ],
    liabilities: [
      { id: "jj-mortgage1", label: "Primary mortgage", balance: 243_452 },
      { id: "jj-mortgage2", label: "Rental mortgage", balance: 170_160 },
    ],
    housing: {
      type: "own",
      monthlyAmount: 1_306,
    },
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
    monthlySpending: 1_640, // donations ~$700 + groceries/transit/misc ~$940 (excl $1K/mo savings)
    assets: [
      { id: "rwd-rrsp", label: "RRSP", type: "RRSP", value: 849_000 },
      { id: "rwd-tfsa", label: "TFSA", type: "TFSA", value: 209_000 },
      { id: "rwd-nonreg", label: "Non-registered", type: "NonRegistered", value: 220_000 },
      { id: "rwd-cash", label: "HISA", type: "Cash", value: 65_000 },
      { id: "rwd-home", label: "Townhouse", type: "Property", value: 950_000 },
    ],
    liabilities: [
      { id: "rwd-heloc", label: "HELOC", balance: 233_000 },
      { id: "rwd-invloan", label: "Investment loan", balance: 200_000 },
    ],
    housing: {
      type: "own",
      monthlyAmount: 1_730,
    },
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
    assets: [
      { id: "ivf-rrsp", label: "RRSP", type: "RRSP", value: 137_237 },
      { id: "ivf-tfsa", label: "TFSA", type: "TFSA", value: 135_591 },
      { id: "ivf-margin", label: "Margin account", type: "NonRegistered", value: 46_889 },
      { id: "ivf-fhsa", label: "FHSA", type: "FHSA", value: 19_295 },
    ],
    liabilities: [],
    housing: {
      type: "rent",
      monthlyAmount: 2_350,
    },
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
    resp: {
      balance: 0,
      contributions: 0,
      cesgReceived: 0,
      beneficiaryAge: 0,
      annualContribution: 2_500,
    },
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
    assets: [
      { id: "geo-etfs", label: "ETFs", type: "NonRegistered", value: 65_000 },
      { id: "geo-cash", label: "Cash + GICs", type: "Cash", value: 15_000 },
      { id: "geo-home", label: "Home", type: "Property", value: 620_000 },
      { id: "geo-vehicles", label: "Vehicles", type: "Vehicle", value: 18_000 },
    ],
    liabilities: [],
    housing: {
      type: "own",
      monthlyAmount: 0, // mortgage paid off Dec 2025
    },
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
    assets: [
      { id: "hb-rrsp", label: "RRSP", type: "RRSP", value: 37_695 },
      { id: "hb-tfsa", label: "TFSA", type: "TFSA", value: 7_300 },
      { id: "hb-inv", label: "Investments", type: "NonRegistered", value: 15_000 },
      { id: "hb-cash", label: "Cash", type: "Cash", value: 10_000 },
      { id: "hb-home", label: "Home", type: "Property", value: 300_000 },
      { id: "hb-car", label: "Vehicle", type: "Vehicle", value: 28_000 },
    ],
    liabilities: [
      { id: "hb-mortgage", label: "Mortgage", balance: 139_141 },
    ],
    housing: {
      type: "own",
      monthlyAmount: 926,
    },
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
