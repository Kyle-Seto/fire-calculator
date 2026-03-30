import type { Account, AccountType } from "@/types";
import {
  FEDERAL_BRACKETS,
  ONTARIO_BRACKETS,
  BASIC_PERSONAL_AMOUNT,
  ONTARIO_PERSONAL_AMOUNT,
  CAPITAL_GAINS_INCLUSION_RATE,
  RRSP_CONTRIBUTION_RATE,
  RRSP_ANNUAL_LIMIT,
  type TaxBracket,
} from "@/data/taxBrackets";

/**
 * Calculate progressive tax for a given income using the provided brackets.
 * The personal amount is applied as a non-refundable credit at the lowest bracket rate.
 */
export function calculateIncomeTax(
  income: number,
  brackets: TaxBracket[],
  personalAmount: number,
): number {
  if (income <= 0) return 0;

  let tax = 0;
  for (const bracket of brackets) {
    if (income <= bracket.min) break;
    const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }

  // Apply personal amount as a credit at the lowest bracket rate
  const lowestRate = brackets[0].rate;
  const credit = personalAmount * lowestRate;

  return Math.max(0, tax - credit);
}

/**
 * Calculate combined federal + Ontario tax for a given income.
 */
export function calculateTotalTax(income: number): number {
  const federalTax = calculateIncomeTax(
    income,
    FEDERAL_BRACKETS,
    BASIC_PERSONAL_AMOUNT,
  );
  const provincialTax = calculateIncomeTax(
    income,
    ONTARIO_BRACKETS,
    ONTARIO_PERSONAL_AMOUNT,
  );
  return federalTax + provincialTax;
}

/**
 * Calculate after-tax income (gross minus total tax).
 */
export function calculateAfterTaxIncome(grossIncome: number): number {
  return grossIncome - calculateTotalTax(grossIncome);
}

/**
 * Calculate the combined federal + provincial marginal rate at a given income level.
 */
export function calculateMarginalRate(income: number): number {
  if (income <= 0) return 0;

  const findMarginalRate = (brackets: TaxBracket[]): number => {
    for (const bracket of brackets) {
      if (income > bracket.min && income <= bracket.max) {
        return bracket.rate;
      }
    }
    // Income exceeds all brackets — use the top rate
    return brackets[brackets.length - 1].rate;
  };

  return findMarginalRate(FEDERAL_BRACKETS) + findMarginalRate(ONTARIO_BRACKETS);
}

/**
 * Calculate tax owed on a withdrawal from a specific account type.
 * - TFSA: $0 (tax-free)
 * - RRSP: taxed as regular income (incremental tax on top of otherIncome)
 * - NonRegistered: only the capital gains portion is taxed (assumes 50% of withdrawal is gains)
 * - Cash: $0
 */
export function calculateTaxOnWithdrawal(
  amount: number,
  accountType: AccountType,
  otherIncome: number,
): number {
  if (amount <= 0) return 0;

  switch (accountType) {
    case "TFSA":
      return 0;

    case "RRSP": {
      const taxWithWithdrawal = calculateTotalTax(otherIncome + amount);
      const taxWithout = calculateTotalTax(otherIncome);
      return taxWithWithdrawal - taxWithout;
    }

    case "NonRegistered": {
      // Assume 50% of withdrawal is capital gains
      const capitalGains = amount * 0.5;
      const taxableGains = capitalGains * CAPITAL_GAINS_INCLUSION_RATE;
      const taxWithGains = calculateTotalTax(otherIncome + taxableGains);
      const taxWithout = calculateTotalTax(otherIncome);
      return taxWithGains - taxWithout;
    }

    case "Cash":
      return 0;

    default:
      return 0;
  }
}

/**
 * Calculate the after-tax value of a portfolio across all accounts.
 * - TFSA: full balance (tax-free)
 * - RRSP: balance * (1 - estimated average tax rate)
 * - NonRegistered: balance minus tax on assumed gains (50% of balance is gains)
 * - Cash: full balance
 */
export function calculateAfterTaxPortfolioValue(accounts: Account[]): number {
  return accounts.reduce((total, account) => {
    switch (account.type) {
      case "TFSA":
        return total + account.balance;

      case "RRSP": {
        // Estimate average tax rate by computing tax on the full balance as income
        const taxOnFull = calculateTotalTax(account.balance);
        const avgTaxRate =
          account.balance > 0 ? taxOnFull / account.balance : 0;
        return total + account.balance * (1 - avgTaxRate);
      }

      case "NonRegistered": {
        // Assume 50% of balance is capital gains
        const assumedGains = account.balance * 0.5;
        const taxableGains = assumedGains * CAPITAL_GAINS_INCLUSION_RATE;
        const tax = calculateTotalTax(taxableGains);
        return total + account.balance - tax;
      }

      case "Cash":
        return total + account.balance;

      default:
        return total + account.balance;
    }
  }, 0);
}

/**
 * Calculate the optimal RRSP contribution (min of 18% income, annual limit)
 * and the resulting tax savings.
 */
export function calculateOptimalRRSPContribution(income: number): {
  contribution: number;
  taxSavings: number;
} {
  if (income <= 0) return { contribution: 0, taxSavings: 0 };

  const contribution = Math.min(income * RRSP_CONTRIBUTION_RATE, RRSP_ANNUAL_LIMIT);

  const taxWithout = calculateTotalTax(income);
  const taxWith = calculateTotalTax(income - contribution);
  const taxSavings = taxWithout - taxWith;

  return { contribution, taxSavings };
}
