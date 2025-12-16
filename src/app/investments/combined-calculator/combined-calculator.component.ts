import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-combined-calculator',
  templateUrl: './combined-calculator.component.html',
  styleUrls: ['./combined-calculator.component.scss'],
})
export class CombinedCalculatorComponent {
  lumpsumInvestment = 50000;
  monthlyInvestment = 5000;
  expectedRate = 12;
  periodInYears = 2;

  isCalculated = false;

  finalInvestment = 0;
  finalReturns = 0;
  finalValue = 0;

  yearWiseGrowth: any[] = [];
  monthWiseGrowth: any[] = [];

  // Chart Properties
  returnsPercentage: number = 0;
  investedPercentage: number = 0;

  // Derived months (interpreting decimal part as months when applicable)
  totalMonths: number = 0;

  analyze(): void {
    this.yearWiseGrowth = [];
    this.monthWiseGrowth = [];

    const annualRate = this.expectedRate / 100;
    const monthlyRate = annualRate / 12;

    let totalValue = this.lumpsumInvestment;
    let invested = this.lumpsumInvestment;

    // MONTH-WISE
    const totalMonths = this.getTotalMonthsFromYearsInput(this.periodInYears);
    this.totalMonths = totalMonths;

    for (let m = 1; m <= totalMonths; m++) {
      // previous total before contribution
      const prevTotal = totalValue;

      // monthly contribution
      invested += this.monthlyInvestment;
      totalValue += this.monthlyInvestment;

      // amount present before interest is applied this month (prev total + contribution)
      const amountBeforeInterest = Math.round(
        prevTotal + this.monthlyInvestment
      );

      // interest for this month
      const interestThisMonth = totalValue * monthlyRate;
      totalValue += interestThisMonth;

      const monthlyReturnAmount = Math.round(interestThisMonth);
      const monthlyReturnRate = Number((monthlyRate * 100).toFixed(4)); // percent per month

      this.monthWiseGrowth.push({
        month: m,
        amountBeforeInterest,
        monthlyInvestment: Math.round(this.monthlyInvestment),
        monthlyReturnAmount,
        monthlyReturnRate,
        investedAmount: Math.round(invested),
        estimatedReturns: Math.round(totalValue - invested),
        totalValue: Math.round(totalValue),
      });

      // Push yearly snapshot on exact year boundary or on final month (for partial years)
      if (m % 12 === 0 || m === totalMonths) {
        const yearsPart = Math.floor(m / 12);
        const monthsPart = m % 12;
        const yearLabel =
          monthsPart === 0
            ? `${yearsPart}y`
            : yearsPart === 0
            ? `${monthsPart}m`
            : `${yearsPart}y ${monthsPart}m`;

        this.yearWiseGrowth.push({
          // numeric value kept for calculations/exports if needed
          yearNumber: Number((m / 12).toFixed(1)),
          yearLabel,
          investedAmount: Math.round(invested),
          estimatedReturns: Math.round(totalValue - invested),
          totalValue: Math.round(totalValue),
        });
      }
    }

    this.finalInvestment = invested;
    this.finalValue = totalValue;
    this.finalReturns = totalValue - invested;

    // Calculate chart percentages
    if (this.finalValue > 0) {
      this.returnsPercentage = Math.round(
        (this.finalReturns / this.finalValue) * 100
      );
      this.investedPercentage = 100 - this.returnsPercentage;
    } else {
      this.returnsPercentage = 0;
      this.investedPercentage = 0;
    }

    this.isCalculated = true;
  }

  /**
   * Interprets the `periodInYears` input so that the decimal part (if present)
   * is treated as months digits. Examples:
   *  - 0.2 => 2 months
   *  - 0.12 => 12 months (=> 1 year)
   *  - 1.6 => 1 year + 6 months
   */
  private getTotalMonthsFromYearsInput(yearsInput: number): number {
    const s = String(yearsInput);

    // If no decimal part, use normal years-to-months rounding
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
  formatCurrency(v: number): string {
    return v.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  }

  // YEAR-WISE EXCEL
  downloadYearWiseExcel() {
    if (!this.isCalculated || this.yearWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }

    const dataForExport: any[] = this.yearWiseGrowth.map((item) => ({
      Period: item.yearLabel || item.yearNumber,
      'Invested Amount (₹)': item.investedAmount,
      'Estimated Returns (₹)': item.estimatedReturns,
      'Total Value (₹)': item.totalValue,
    }));

    dataForExport.push({
      Year: 'SUMMARY',
      'Invested Amount (₹)': this.finalInvestment,
      'Estimated Returns (₹)': this.finalReturns,
      'Total Value (₹)': this.finalValue,
    });

    const ws = XLSX.utils.json_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'YearWise');
    XLSX.writeFile(wb, `Combined_Year_Wise_${this.periodInYears}Y.xlsx`);
  }

  // YEAR-WISE PDF
  downloadYearWisePdf() {
    if (!this.isCalculated || this.yearWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }
    this.exportPdf(
      'yearWiseTable',
      `Combined_Year_Wise_${this.periodInYears}Y.pdf`
    );
  }

  // MONTH-WISE EXCEL
  downloadMonthWiseExcel() {
    if (!this.isCalculated || this.monthWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }

    const dataForExport: any[] = this.monthWiseGrowth.map((item) => ({
      Month: item.month,
      'Amount (₹)': item.amountBeforeInterest,
      'Return (₹)': item.monthlyReturnAmount,
      'Total (₹)': item.totalValue,
      'Return Rate (per month)': item.monthlyReturnRate,
      'Monthly Investment (₹)': item.monthlyInvestment,
    }));

    // Compute sum of monthly returns for a sensible summary
    const totalMonthlyReturns = this.monthWiseGrowth.reduce(
      (s, it) => s + (it.monthlyReturnAmount || 0),
      0
    );

    dataForExport.push({
      Month: 'SUMMARY',
      'Amount (₹)': '',
      'Return (₹)': totalMonthlyReturns,
      'Total (₹)': this.finalValue,
      'Return Rate (per month)': '',
      'Monthly Investment (₹)': this.monthlyInvestment,
    });

    const ws = XLSX.utils.json_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MonthWise');
    XLSX.writeFile(wb, `Combined_Month_Wise_${this.periodInYears}Y.xlsx`);
  }

  // MONTH-WISE PDF
  downloadMonthWisePdf() {
    if (!this.isCalculated || this.monthWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }
    this.exportPdf(
      'monthWiseTable',
      `Combined_Month_Wise_${this.periodInYears}Y.pdf`
    );
  }

  private exportPdf(tableId: string, fileName: string) {
    const element = document.getElementById(tableId);
    if (!element) return;

    html2canvas(element, { scale: 2 }).then((canvas) => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 208;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        imgWidth,
        imgHeight
      );
      pdf.save(fileName);
    });
  }
}
