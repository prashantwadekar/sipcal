import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
// jsPDF and html2canvas are dynamically imported inside exportPdf to keep them out of the initial bundle.

@Component({
  selector: 'app-emi-calculator',
  templateUrl: './emi-calculator.component.html',
  styleUrls: ['./emi-calculator.component.scss'],
})
export class EmiCalculatorComponent {
  // Input
  purchasePrice: number = 150000;
  downPayment: number = 15000;
  interestRate: number = 12; // annual %
  loanPeriodMonths: number = 36;

  // Output
  loanAmount: number = 0;
  emi: number = 0;
  totalInterest: number = 0;
  totalPayment: number = 0;

  isCalculated: boolean = false;

  monthWiseSchedule: any[] = [];
  yearWiseSchedule: any[] = [];

  constructor() {}

  analyze(): void {
    if (
      this.purchasePrice <= 0 ||
      this.downPayment < 0 ||
      this.interestRate < 0 ||
      this.loanPeriodMonths <= 0
    ) {
      alert('Please enter valid values.');
      this.isCalculated = false;
      return;
    }

    this.loanAmount = Math.round(this.purchasePrice - this.downPayment);
    const n = Math.max(1, Math.round(this.loanPeriodMonths));
    const r = this.interestRate / 100 / 12; // monthly rate

    if (this.loanAmount <= 0) {
      alert('Loan amount must be positive.');
      this.isCalculated = false;
      return;
    }

    // EMI formula
    if (r === 0) {
      this.emi = Number((this.loanAmount / n).toFixed(0));
    } else {
      const pow = Math.pow(1 + r, n);
      this.emi = Math.round((this.loanAmount * r * pow) / (pow - 1));
    }

    // Build amortization schedule
    this.monthWiseSchedule = [];
    this.yearWiseSchedule = [];

    let balance = this.loanAmount;
    let totalInterest = 0;
    let totalPrincipal = 0;

    for (let m = 1; m <= n; m++) {
      const opening = Math.round(balance);
      const interest = Math.round(balance * r);
      let principal = this.emi - interest;

      // Fix final principal to clear balance (handle rounding)
      if (m === n) {
        principal = opening; // last payment clears the remaining balance
      }

      const closing = Math.round(opening - principal);

      this.monthWiseSchedule.push({
        month: m,
        openingBalance: opening,
        emi: this.emi,
        interestAmount: interest,
        principalAmount: principal,
        closingBalance: closing,
      });

      totalInterest += interest;
      totalPrincipal += principal;
      balance = closing;

      if (m % 12 === 0 || m === n) {
        const yearsPart = Math.floor(m / 12);
        const monthsPart = m % 12;
        const yearLabel =
          monthsPart === 0
            ? `${yearsPart}y`
            : yearsPart === 0
            ? `${monthsPart}m`
            : `${yearsPart}y ${monthsPart}m`;

        // Aggregate principal & interest for the year window
        const yearRows = this.monthWiseSchedule.slice(
          Math.max(0, m - (monthsPart === 0 ? 12 : monthsPart)),
          m
        );

        const principalPaid = yearRows.reduce(
          (s, r) => s + (r.principalAmount || 0),
          0
        );
        const interestPaid = yearRows.reduce(
          (s, r) => s + (r.interestAmount || 0),
          0
        );

        this.yearWiseSchedule.push({
          year: yearsPart,
          yearLabel,
          principalPaid: Math.round(principalPaid),
          interestPaid: Math.round(interestPaid),
          remainingBalance: Math.round(balance),
        });
      }

      if (balance <= 0) break;
    }

    this.totalInterest = totalInterest;
    this.totalPayment = this.emi * n + this.downPayment; // include downpayment
    this.isCalculated = true;
  }

  formatCurrency(v: number) {
    return v.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  }

  // Helper: returns interest percentage string for donut (e.g., '25%')
  getReturnsPercent(): string {
    const denom = (this.totalInterest || 0) + (this.loanAmount || 0);
    if (denom <= 0) return '0%';
    return Math.round((this.totalInterest / denom) * 100) + '%';
  }

  // Exports
  downloadYearWiseExcel(): void {
    if (!this.isCalculated || this.yearWiseSchedule.length === 0) {
      alert('Please analyze before downloading.');
      return;
    }

    const data = this.yearWiseSchedule.map((y) => ({
      Period: y.yearLabel || y.year,
      'Principal Paid (₹)': y.principalPaid,
      'Interest Paid (₹)': y.interestPaid,
      'Remaining Balance (₹)': y.remainingBalance,
    }));

    data.push({
      Period: 'SUMMARY',
      'Principal Paid (₹)': this.monthWiseSchedule.reduce(
        (s, r) => s + (r.principalAmount || 0),
        0
      ),
      'Interest Paid (₹)': this.totalInterest,
      'Remaining Balance (₹)': this.monthWiseSchedule.length
        ? this.monthWiseSchedule[this.monthWiseSchedule.length - 1]
            .closingBalance
        : 0,
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'YearWise');
    XLSX.writeFile(wb, `EMI_Year_Wise_${this.loanPeriodMonths}M.xlsx`);
  }

  downloadMonthWiseExcel(): void {
    if (!this.isCalculated || this.monthWiseSchedule.length === 0) {
      alert('Please analyze before downloading.');
      return;
    }

    const data = this.monthWiseSchedule.map((m) => ({
      Month: m.month,
      'Opening Balance (₹)': m.openingBalance,
      'EMI (₹)': m.emi,
      'Interest (₹)': m.interestAmount,
      'Principal (₹)': m.principalAmount,
      'Closing Balance (₹)': m.closingBalance,
    }));

    data.push({
      Month: 'SUMMARY',
      'Opening Balance (₹)': '',
      'EMI (₹)': '',
      'Interest (₹)': this.totalInterest,
      'Principal (₹)': this.monthWiseSchedule.reduce(
        (s, r) => s + (r.principalAmount || 0),
        0
      ),
      'Closing Balance (₹)': this.monthWiseSchedule.length
        ? this.monthWiseSchedule[this.monthWiseSchedule.length - 1]
            .closingBalance
        : 0,
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MonthWise');
    XLSX.writeFile(wb, `EMI_Month_Wise_${this.loanPeriodMonths}M.xlsx`);
  }

  downloadYearWisePdf(): void {
    if (!this.isCalculated || this.yearWiseSchedule.length === 0) {
      alert('Please analyze before downloading.');
      return;
    }
    this.exportPdf(
      'yearWiseTable',
      `EMI_Year_Wise_${this.loanPeriodMonths}M.pdf`
    );
  }

  downloadMonthWisePdf(): void {
    if (!this.isCalculated || this.monthWiseSchedule.length === 0) {
      alert('Please analyze before downloading.');
      return;
    }
    this.exportPdf(
      'monthWiseTable',
      `EMI_Month_Wise_${this.loanPeriodMonths}M.pdf`
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
