import type { Persona } from "@/types";
import { calculateAnnualExpenses } from "@/engine/fire";

/** Convert "YYYY-MM" to a comparable number (year * 12 + month). */
function toMonths(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
}

/** Get "YYYY-MM" for a given simulation year offset from now. */
function simYearToYM(yearOffset: number): number {
  const now = new Date();
  const y = now.getFullYear() + yearOffset;
  const m = now.getMonth(); // 0-indexed
  return y * 12 + m;
}

/**
 * Resolve effective annual income and expenses for a given simulation year,
 * incorporating active life events on top of base persona values.
 *
 * @param yearOffset - 0 = current year, 1 = next year, etc.
 */
export function resolveFinancialsAtYear(
  persona: Persona,
  yearOffset: number,
): { annualIncome: number; annualExpenses: number } {
  const baseExpenses = calculateAnnualExpenses(persona);
  let annualIncome = persona.annualIncome;
  let annualExpenses = baseExpenses;

  const currentMonth = simYearToYM(yearOffset);

  for (const event of persona.lifeEvents ?? []) {
    const start = toMonths(event.startDate);
    if (currentMonth < start) continue;
    if (event.endDate !== undefined && currentMonth >= toMonths(event.endDate)) continue;

    const annual = event.monthlyAmount * 12;
    if (event.type === "income") {
      annualIncome += annual;
    } else {
      annualExpenses += annual;
    }
  }

  return { annualIncome, annualExpenses };
}

/**
 * Build per-year contribution schedule (income - expenses) for N years
 * starting from now.
 */
export function buildContributionSchedule(
  persona: Persona,
  years: number,
): number[] {
  const schedule: number[] = [];
  for (let i = 0; i < years; i++) {
    const { annualIncome, annualExpenses } = resolveFinancialsAtYear(persona, i);
    schedule.push(annualIncome - annualExpenses);
  }
  return schedule;
}
