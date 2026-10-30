// Grading & Calculation Utilities for Ghanaian Educational Institutions

export interface GradeInfo {
  grade: 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9';
  numericValue: number;
  interpretation: string;
  badgeColor: string;
}

export function calculateWassceGrade(score: number): GradeInfo {
  const rounded = Math.round(score);
  if (rounded >= 75) {
    return { grade: 'A1', numericValue: 1, interpretation: 'Excellent', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  } else if (rounded >= 70) {
    return { grade: 'B2', numericValue: 2, interpretation: 'Very Good', badgeColor: 'bg-teal-100 text-teal-800 border-teal-300' };
  } else if (rounded >= 65) {
    return { grade: 'B3', numericValue: 3, interpretation: 'Good', badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
  } else if (rounded >= 60) {
    return { grade: 'C4', numericValue: 4, interpretation: 'Credit', badgeColor: 'bg-blue-100 text-blue-800 border-blue-300' };
  } else if (rounded >= 55) {
    return { grade: 'C5', numericValue: 5, interpretation: 'Credit', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
  } else if (rounded >= 50) {
    return { grade: 'C6', numericValue: 6, interpretation: 'Credit', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300' };
  } else if (rounded >= 45) {
    return { grade: 'D7', numericValue: 7, interpretation: 'Pass', badgeColor: 'bg-orange-100 text-orange-800 border-orange-300' };
  } else if (rounded >= 40) {
    return { grade: 'E8', numericValue: 8, interpretation: 'Weak Pass', badgeColor: 'bg-rose-100 text-rose-800 border-rose-300' };
  } else {
    return { grade: 'F9', numericValue: 9, interpretation: 'Fail', badgeColor: 'bg-red-100 text-red-800 border-red-300' };
  }
}

export function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatGHS(amount: number): string {
  return `GH₵ ${Number(amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Ghana Statutory Payroll Computation (SSNIT Act 766 & GRA Income Tax Act 2015 Act 896 as amended)
export interface PayrollBreakdown {
  basicSalary: number;
  allowances: number;
  grossSalary: number;
  ssnitEmployee: number; // 5.5% Tier 1 & 2
  ssnitEmployer: number; // 13.0% Tier 1
  taxableIncome: number;
  graPayeTax: number;
  totalDeductions: number;
  netSalary: number;
}

export function calculateGhanaPayroll(basicSalary: number, allowances: number = 0): PayrollBreakdown {
  const grossSalary = basicSalary + allowances;
  const ssnitEmployee = basicSalary * 0.055;
  const ssnitEmployer = basicSalary * 0.130;
  
  // Taxable income is Gross Salary minus Employee SSNIT
  const taxableIncome = Math.max(0, grossSalary - ssnitEmployee);

  // GRA PAYE Monthly Tax Bands
  let remaining = taxableIncome;
  let tax = 0;

  // Band 1: First GH₵ 490 @ 0%
  const b1 = Math.min(remaining, 490);
  tax += b1 * 0.0;
  remaining -= b1;

  // Band 2: Next GH₵ 110 @ 5%
  if (remaining > 0) {
    const b2 = Math.min(remaining, 110);
    tax += b2 * 0.05;
    remaining -= b2;
  }

  // Band 3: Next GH₵ 130 @ 10%
  if (remaining > 0) {
    const b3 = Math.min(remaining, 130);
    tax += b3 * 0.10;
    remaining -= b3;
  }

  // Band 4: Next GH₵ 3,166.67 @ 17.5%
  if (remaining > 0) {
    const b4 = Math.min(remaining, 3166.67);
    tax += b4 * 0.175;
    remaining -= b4;
  }

  // Band 5: Next GH₵ 16,000 @ 25%
  if (remaining > 0) {
    const b5 = Math.min(remaining, 16000);
    tax += b5 * 0.25;
    remaining -= b5;
  }

  // Band 6: Next GH₵ 30,520 @ 30%
  if (remaining > 0) {
    const b6 = Math.min(remaining, 30520);
    tax += b6 * 0.30;
    remaining -= b6;
  }

  // Band 7: Exceeding GH₵ 50,416.67 @ 35%
  if (remaining > 0) {
    tax += remaining * 0.35;
  }

  const graPayeTax = Math.round(tax * 100) / 100;
  const totalDeductions = Math.round((ssnitEmployee + graPayeTax) * 100) / 100;
  const netSalary = Math.round((grossSalary - totalDeductions) * 100) / 100;

  return {
    basicSalary,
    allowances,
    grossSalary,
    ssnitEmployee: Math.round(ssnitEmployee * 100) / 100,
    ssnitEmployer: Math.round(ssnitEmployer * 100) / 100,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    graPayeTax,
    totalDeductions,
    netSalary,
  };
}
