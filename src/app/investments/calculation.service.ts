import { Injectable } from '@angular/core';
import { InvestmentData } from './investment-data';

@Injectable({
  providedIn: 'root'
})
export class CalculationService {

  constructor() { }

  private getMonthlyRate(annualRate: number): number {
    return annualRate / 100 / 12;
  }

  // 2. SIP Future Value (FV) - Monthly Compounding (Annuity Due is standard for SIPs)
  private calculateSIPFV(monthlyInvestment: number, rate: number, months: number): number {
    const monthlyRate = this.getMonthlyRate(rate);
    
    // Formula for Future Value of Annuity Due: P * (((1 + i)^n - 1) / i) * (1 + i)
    const totalFV = monthlyInvestment * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate * (1 + monthlyRate);
    return totalFV;
  }

  private calculateLumpsumFV(principal: number, rate: number, months: number): number {
    const monthlyRate = this.getMonthlyRate(rate);
    
    // Formula: P * (1 + i)^n
    const totalFV = principal * Math.pow(1 + monthlyRate, months);
    return totalFV;
  }
  /**
   * Generates year-wise growth for Standard SIP
   */
  getStandardSIPGrowth(monthlyInvestment: number, rate: number, years: number): InvestmentData[] {
    const growthData: InvestmentData[] = [];

    for (let i = 1; i <= years; i++) {
      const months = i * 12;
      const investedAmount = monthlyInvestment * months;
      const totalValue = this.calculateSIPFV(monthlyInvestment, rate, months);
      const estimatedReturns = totalValue - investedAmount;

      growthData.push({
        year: i,
        investedAmount: Math.round(investedAmount),
        estimatedReturns: Math.round(estimatedReturns),
        totalValue: Math.round(totalValue)
      });
    }

    return growthData;
  }

  getLumpsumGrowth(principal: number, rate: number, years: number): InvestmentData[] {
    const growthData: InvestmentData[] = [];
    
    // The total invested amount remains the same throughout the period
    const investedAmount = principal;

    for (let i = 1; i <= years; i++) {
      const months = i * 12;
      
      const totalValue = this.calculateLumpsumFV(principal, rate, months);
      const estimatedReturns = totalValue - investedAmount;

      growthData.push({
        year: i,
        investedAmount: Math.round(investedAmount), // Stays constant
        estimatedReturns: Math.round(estimatedReturns),
        totalValue: Math.round(totalValue)
      });
    }

    return growthData;
  }

  getStepUpSIPGrowth(
    initialMonthlyInvestment: number,
    rate: number,
    stepUpRate: number, // Annual step-up percentage (e.g., 10 for 10%)
    years: number
  ): InvestmentData[] {
    const growthData: InvestmentData[] = [];
    const monthlyRate = this.getMonthlyRate(rate);
    const stepUpFactor = 1 + (stepUpRate / 100);

    let currentMonthlySIP = initialMonthlyInvestment;
    let totalCorpus = 0;
    let totalInvested = 0;

    for (let year = 1; year <= years; year++) {
      // 1. Calculate the FV of the money invested in the CURRENT YEAR
      // The investment made this year will compound for (years - year + 1) years.
      const compoundingMonths = (years - year + 1) * 12;

      // The investment made in this year (12 payments)
      const currentYearInvested = currentMonthlySIP * 12;
      totalInvested += currentYearInvested;

      // Calculate FV of this year's contribution, treated as a 1-year annuity due
      // Compounded up to the final period.
      const fvOfCurrentYearSIP = this.calculateFVofOneYearSIP(
        currentMonthlySIP, 
        monthlyRate, 
        compoundingMonths
      );
      
      totalCorpus += fvOfCurrentYearSIP;

      // 2. Prepare Data for Year-wise Table
      const estimatedReturns = totalCorpus - totalInvested;
      
      growthData.push({
        year: year,
        investedAmount: Math.round(totalInvested),
        estimatedReturns: Math.round(estimatedReturns),
        totalValue: Math.round(totalCorpus)
      });
      
      // 3. Step Up the Monthly SIP for the NEXT YEAR's calculation
      currentMonthlySIP *= stepUpFactor;
    }

    return growthData;
  }
  
  // New helper function to calculate the Future Value of a 1-year SIP compounded over N months
  private calculateFVofOneYearSIP(monthlyInvestment: number, monthlyRate: number, compoundingMonths: number): number {
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

  private calculateStandardSIPFV(monthlyInvestment: number, rate: number, months: number): number {
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
        totalValue: Math.round(totalValue)
      });
    }

    return growthData;
  }
} 