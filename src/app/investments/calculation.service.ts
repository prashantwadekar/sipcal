import { Injectable } from '@angular/core';
import { InvestmentData } from './investment-data';

@Injectable({
  providedIn: 'root',
})
export class CalculationService {
  constructor() {}

  private getMonthlyRate(annualRate: number): number {
    return annualRate / 100 / 12;
  }

  /**
   * Interprets the `yearsInput` so that the decimal part (if present)
   * is treated as months digits. Examples:
   *  - 0.2 => 2 months
   *  - 0.12 => 12 months (=> 1 year)
   *  - 1.6 => 1 year + 6 months
   */
  // Public helper to parse years input into total months (decimal part as months digits)
  parseYearsInputToMonths(yearsInput: number): number {
    const s = String(yearsInput);

    // If no decimal part, use simple years-to-months
    if (!s.includes('.')) {
      return Math.round(yearsInput * 12);
    }

    const parts = s.split('.');
    const years = parseInt(parts[0]) || 0;
    const decimal = parts[1] || '';

    // Interpret decimal digits as months (take up to 2 digits)
    const monthDigits = decimal.length === 1 ? decimal : decimal.slice(0, 2);
    let months = parseInt(monthDigits) || 0;

    // Convert overflow months to years + remaining months
    const extraYears = Math.floor(months / 12);
    const remainingMonths = months % 12;

    return years * 12 + extraYears * 12 + remainingMonths;
  }

  // 2. SIP Future Value (FV) - Monthly Compounding (Annuity Due is standard for SIPs)
  private calculateSIPFV(
    monthlyInvestment: number,
    rate: number,
    months: number
  ): number {
    const monthlyRate = this.getMonthlyRate(rate);

    // Formula for Future Value of Annuity Due: P * (((1 + i)^n - 1) / i) * (1 + i)
    const totalFV =
      ((monthlyInvestment * (Math.pow(1 + monthlyRate, months) - 1)) /
        monthlyRate) *
      (1 + monthlyRate);
    return totalFV;
  }

  private calculateLumpsumFV(
    principal: number,
    rate: number,
    months: number
  ): number {
    const monthlyRate = this.getMonthlyRate(rate);

    // Formula: P * (1 + i)^n
    const totalFV = principal * Math.pow(1 + monthlyRate, months);
    return totalFV;
  }
  /**
   * Generates year-wise growth for Standard SIP
   */
  getStandardSIPGrowth(
    monthlyInvestment: number,
    rate: number,
    yearsInput: number
  ): InvestmentData[] {
    const growthData: InvestmentData[] = [];

    const totalMonths = this.parseYearsInputToMonths(yearsInput);

    let investedAmount = 0;

    for (let m = 1; m <= totalMonths; m++) {
      investedAmount += monthlyInvestment;
      const totalValue = this.calculateStandardSIPFV(
        monthlyInvestment,
        rate,
        m
      );
      const estimatedReturns = totalValue - investedAmount;

      if (m % 12 === 0 || m === totalMonths) {
        const yearsPart = Math.floor(m / 12);
        const monthsPart = m % 12;
        const yearLabel =
          monthsPart === 0
            ? `${yearsPart}y`
            : yearsPart === 0
            ? `${monthsPart}m`
            : `${yearsPart}y ${monthsPart}m`;

        growthData.push({
          year: Math.round(m / 12),
          yearLabel,
          yearNumber: Number((m / 12).toFixed(1)),
          investedAmount: Math.round(investedAmount),
          estimatedReturns: Math.round(estimatedReturns),
          totalValue: Math.round(totalValue),
        });
      }
    }

    return growthData;
  }

  getLumpsumGrowth(
    principal: number,
    rate: number,
    yearsInput: number
  ): InvestmentData[] {
    const growthData: InvestmentData[] = [];

    const totalMonths = this.parseYearsInputToMonths(yearsInput);

    for (let m = 1; m <= totalMonths; m++) {
      const months = m;
      const totalValue = this.calculateLumpsumFV(principal, rate, months);
      const estimatedReturns = totalValue - principal;

      if (m % 12 === 0 || m === totalMonths) {
        const yearsPart = Math.floor(m / 12);
        const monthsPart = m % 12;
        const yearLabel =
          monthsPart === 0
            ? `${yearsPart}y`
            : yearsPart === 0
            ? `${monthsPart}m`
            : `${yearsPart}y ${monthsPart}m`;

        growthData.push({
          year: Math.round(m / 12),
          yearLabel,
          yearNumber: Number((m / 12).toFixed(1)),
          investedAmount: Math.round(principal), // Stays constant
          estimatedReturns: Math.round(estimatedReturns),
          totalValue: Math.round(totalValue),
        });
      }
    }

    return growthData;
  }

  getStepUpSIPGrowth(
    initialMonthlyInvestment: number,
    rate: number,
    stepUpRate: number, // Annual step-up percentage (e.g., 10 for 10%)
    yearsInput: number
  ): InvestmentData[] {
    const growthData: InvestmentData[] = [];
    const monthlyRate = this.getMonthlyRate(rate);
    const stepUpFactor = 1 + stepUpRate / 100;

    const totalMonths = this.parseYearsInputToMonths(yearsInput);

    const contributions: { month: number; amount: number }[] = [];

    for (let m = 1; m <= totalMonths; m++) {
      const yearIndex = Math.floor((m - 1) / 12);
      const monthlySIPForMonth = Math.round(
        initialMonthlyInvestment * Math.pow(stepUpFactor, yearIndex)
      );

      contributions.push({ month: m, amount: monthlySIPForMonth });

      // At snapshot months (year-end or final month) compute totals
      if (m % 12 === 0 || m === totalMonths) {
        let totalCorpus = 0;
        let totalInvested = 0;

        for (let k = 1; k <= m; k++) {
          const contrib = contributions[k - 1];
          totalInvested += contrib.amount;
          const monthsToCompound = m - k; // compounding from payment month to current snapshot month
          totalCorpus +=
            contrib.amount * Math.pow(1 + monthlyRate, monthsToCompound);
        }

        const estimatedReturns = totalCorpus - totalInvested;

        const yearsPart = Math.floor(m / 12);
        const monthsPart = m % 12;
        const yearLabel =
          monthsPart === 0
            ? `${yearsPart}y`
            : yearsPart === 0
            ? `${monthsPart}m`
            : `${yearsPart}y ${monthsPart}m`;

        growthData.push({
          year: Math.round(m / 12),
          yearLabel,
          yearNumber: Number((m / 12).toFixed(1)),
          investedAmount: Math.round(totalInvested),
          estimatedReturns: Math.round(estimatedReturns),
          totalValue: Math.round(totalCorpus),
        });
      }
    }

    return growthData;
  }

  // New helper function to calculate the Future Value of a 1-year SIP compounded over N months
  private calculateFVofOneYearSIP(
    monthlyInvestment: number,
    monthlyRate: number,
    compoundingMonths: number
  ): number {
    let fv = 0;
    for (let month = 1; month <= 12; month++) {
      // Time remaining for this month's payment to compound:
      // compoundingMonths - (month - 1)
      const monthsToCompound = compoundingMonths - (month - 1);

      // FV = P * (1 + i)^n
      fv += monthlyInvestment * Math.pow(1 + monthlyRate, monthsToCompound);
    }
    return fv;
  }

  private calculateStandardSIPFV(
    monthlyInvestment: number,
    rate: number,
    months: number
  ): number {
    const monthlyRate = this.getMonthlyRate(rate);

    // Formula for Future Value of an Annuity (SIP)
    // FV = P * [((1 + i)^n - 1) / i] * (1 + i)  (Due Annuity)
    const factor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
    const totalFV = monthlyInvestment * factor * (1 + monthlyRate);

    return totalFV;
  }

  // ... existing getStandardSIPGrowth, getLumpsumGrowth, getStepUpSIPGrowth methods ...

  /**
   * Generates year-wise growth for Combined Lumpsum and Standard SIP investment.
   * Calculates Lumpsum growth and SIP growth separately, then sums the results.
   */
  getCombinedGrowth(
    lumpsumAmount: number,
    monthlySIP: number,
    rate: number,
    years: number
  ): InvestmentData[] {
    const growthData: InvestmentData[] = [];

    let totalSIPInvested = 0;

    for (let i = 1; i <= years; i++) {
      const months = i * 12;

      // 1. Lumpsum Component Calculation (Compounding for i years)
      const lumpsumFV = this.calculateLumpsumFV(lumpsumAmount, rate, months);

      // 2. SIP Component Calculation (Compounding for i years)
      const sipFV = this.calculateStandardSIPFV(monthlySIP, rate, months);

      // 3. Aggregate Totals
      const totalValue = lumpsumFV + sipFV;

      // 4. Track Invested Amounts
      const currentYearSIPInvested = monthlySIP * 12;
      totalSIPInvested += currentYearSIPInvested;

      const totalInvested = lumpsumAmount + totalSIPInvested;
      const estimatedReturns = totalValue - totalInvested;

      growthData.push({
        year: i,
        investedAmount: Math.round(totalInvested),
        estimatedReturns: Math.round(estimatedReturns),
        totalValue: Math.round(totalValue),
      });
    }

    return growthData;
  }
}
