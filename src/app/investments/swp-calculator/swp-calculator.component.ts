import { Component } from '@angular/core';
import { CalculationService } from '../calculation.service';
import { InvestmentData } from '../investment-data';
import * as XLSX from 'xlsx';
// jsPDF and html2canvas are dynamically imported inside exportPdf to keep them out of the initial bundle.

@Component({
  selector: 'app-swp-calculator',
  templateUrl: './swp-calculator.component.html',
  styleUrls: ['./swp-calculator.component.scss'],
})
export class SwpCalculatorComponent {
  // Input Model
  initialCorpus: number = 1000000; // Default corpus
  monthlyWithdrawal: number = 10000;
  expectedRate: number = 12;
  periodInYears: number = 10;

  // Output Model
  isCalculated: boolean = false;
  finalInvestment: number = 0; // initial corpus
  finalReturns: number = 0;
  finalValue: number = 0;
  yearWiseGrowth: InvestmentData[] = [];
  monthWiseGrowth: any[] = [];
  totalMonths: number = 0;

  // Chart properties
  returnsPercentage: number = 0;
  investedPercentage: number = 0;

  constructor(private calcService: CalculationService) {}

  analyze(): void {
    if (
      this.initialCorpus <= 0 ||
      this.expectedRate <= 0 ||
      this.periodInYears <= 0 ||
      this.monthlyWithdrawal < 0
    ) {
      alert('Please enter valid positive values for all fields.');
      this.isCalculated = false;
      return;
    }

    this.yearWiseGrowth = [];
    this.monthWiseGrowth = [];

    const totalMonths = this.calcService.parseYearsInputToMonths(
      this.periodInYears
    );
    this.totalMonths = totalMonths;
    const monthlyRate = this.expectedRate / 100 / 12;

    let totalValue = this.initialCorpus;
    const invested = this.initialCorpus;

    for (let m = 1; m <= totalMonths; m++) {
      const amountBeforeInterest = Math.round(totalValue);

      // interest accrues on the current balance
      const interestThisMonth = totalValue * monthlyRate;
      totalValue += interestThisMonth;

      const monthlyReturnAmount = Math.round(interestThisMonth);
      const monthlyReturnRate = Number((monthlyRate * 100).toFixed(4));

      // withdrawal happens at the end of month (cannot exceed available amount)
      const actualWithdrawal = Math.min(
        Math.round(this.monthlyWithdrawal),
        Math.round(totalValue)
      );
      totalValue -= actualWithdrawal;

      this.monthWiseGrowth.push({
        month: m,
        amountBeforeInterest,
        withdrawalAmount: actualWithdrawal,
        monthlyReturnAmount,
        monthlyReturnRate,
        investedAmount: Math.round(invested),
        estimatedReturns: Math.round(totalValue - invested),
        totalValue: Math.round(totalValue),
      });

      // push yearly snapshot on year boundary or final month
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
          year: yearsPart,
          yearNumber: Number((m / 12).toFixed(1)),
          yearLabel,
          investedAmount: Math.round(invested),
          estimatedReturns: Math.round(totalValue - invested),
          totalValue: Math.round(totalValue),
        });
      }

      // if corpus is exhausted, stop early
      if (totalValue <= 0) {
        break;
      }
    }

    this.finalInvestment = invested;
    this.finalValue = Math.round(totalValue);
    this.finalReturns = this.finalValue - invested;

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

  formatCurrency(value: number): string {
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  }

  // YEAR-WISE EXCEL
  downloadExcel(): void {
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

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataForExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'YearWise');
    XLSX.writeFile(wb, `SWP_Year_Wise_${this.periodInYears}Y.xlsx`);
  }

  // YEAR-WISE PDF
  downloadPdf(): void {
    if (!this.isCalculated || this.yearWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }

    this.exportPdf('yearWiseTable', `SWP_Year_Wise_${this.periodInYears}Y.pdf`);
  }

  // MONTH-WISE EXCEL
  downloadMonthWiseExcel(): void {
    if (!this.isCalculated || this.monthWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }

    const dataForExport: any[] = this.monthWiseGrowth.map((item) => ({
      Month: item.month,
      'Amount (₹)': item.amountBeforeInterest,
      'Withdrawal (₹)': item.withdrawalAmount,
      'Return (₹)': item.monthlyReturnAmount,
      'Total (₹)': item.totalValue,
      'Return Rate (per month)': item.monthlyReturnRate,
    }));

    const totalWithdrawals = this.monthWiseGrowth.reduce(
      (s, it) => s + (it.withdrawalAmount || 0),
      0
    );

    const totalMonthlyReturns = this.monthWiseGrowth.reduce(
      (s, it) => s + (it.monthlyReturnAmount || 0),
      0
    );

    dataForExport.push({
      Month: 'SUMMARY',
      'Amount (₹)': '',
      'Withdrawal (₹)': totalWithdrawals,
      'Return (₹)': totalMonthlyReturns,
      'Total (₹)': this.finalValue,
      'Return Rate (per month)': '',
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataForExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MonthWise');
    XLSX.writeFile(wb, `SWP_Month_Wise_${this.periodInYears}Y.xlsx`);
  }

  // MONTH-WISE PDF
  downloadMonthWisePdf(): void {
    if (!this.isCalculated || this.monthWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }

    this.exportPdf(
      'monthWiseTable',
      `SWP_Month_Wise_${this.periodInYears}Y.pdf`
    );
  }

  private async exportPdf(tableId: string, fileName: string) {
    const element = document.getElementById(tableId);
    if (!element) return;

    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const canvas = await html2canvas(element, { scale: 2 });
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
  }
}
