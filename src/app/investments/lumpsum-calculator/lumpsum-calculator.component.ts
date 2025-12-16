// src/app/investments/lumpsum-calculator/lumpsum-calculator.component.ts

import { Component } from '@angular/core';
import { CalculationService } from '../calculation.service';
import { InvestmentData } from '../investment-data';
import * as XLSX from 'xlsx';
// jsPDF and html2canvas are dynamically imported inside exportPdf to keep them out of the initial bundle.

@Component({
  selector: 'app-lumpsum-calculator',
  templateUrl: './lumpsum-calculator.component.html',
  // You will need to create this SCSS file based on sip-calculator.component.scss
  styleUrls: ['./lumpsum-calculator.component.scss'],
})
export class LumpsumCalculatorComponent {
  // Input Model
  lumpsumInvestment: number = 25000; // Use a default value based on your image
  expectedRate: number = 12;
  periodInYears: number = 10;

  // Output Model
  isCalculated: boolean = false;
  finalInvestment: number = 0;
  finalReturns: number = 0;
  finalValue: number = 0;
  yearWiseGrowth: InvestmentData[] = [];
  monthWiseGrowth: any[] = [];
  totalMonths: number = 0;

  // Chart Properties
  returnsPercentage: number = 0;
  investedPercentage: number = 0;

  // For exports summary consistency (Lumpsum has no monthly contribution)
  monthlyInvestment: number = 0;

  constructor(private calcService: CalculationService) {}

  analyze(): void {
    if (
      this.lumpsumInvestment <= 0 ||
      this.expectedRate <= 0 ||
      this.periodInYears <= 0
    ) {
      alert('Please enter valid positive values for all fields.');
      this.isCalculated = false;
      return;
    }

    // Use the new Lumpsum calculation service method
    this.yearWiseGrowth = this.calcService.getLumpsumGrowth(
      this.lumpsumInvestment,
      this.expectedRate,
      this.periodInYears
    );

    const lastYearData = this.yearWiseGrowth[this.yearWiseGrowth.length - 1];

    if (lastYearData) {
      this.finalInvestment = lastYearData.investedAmount;
      this.finalReturns = lastYearData.estimatedReturns;
      this.finalValue = lastYearData.totalValue;

      // Build month-wise table
      this.monthWiseGrowth = [];
      const totalMonths = this.calcService.parseYearsInputToMonths(
        this.periodInYears
      );
      this.totalMonths = totalMonths;
      const monthlyRate = this.expectedRate / 100 / 12;
      let totalValue = this.lumpsumInvestment;
      const invested = this.lumpsumInvestment;

      for (let m = 1; m <= totalMonths; m++) {
        const amountBeforeInterest = Math.round(totalValue);
        const interestThisMonth = totalValue * monthlyRate;
        totalValue += interestThisMonth;

        this.monthWiseGrowth.push({
          month: m,
          amountBeforeInterest,
          monthlyInvestment: 0,
          monthlyReturnAmount: Math.round(interestThisMonth),
          monthlyReturnRate: Number((monthlyRate * 100).toFixed(4)),
          investedAmount: Math.round(invested),
          estimatedReturns: Math.round(totalValue - invested),
          totalValue: Math.round(totalValue),
        });
      }

      this.isCalculated = true;

      if (this.finalValue > 0) {
        this.returnsPercentage = Math.round(
          (this.finalReturns / this.finalValue) * 100
        );
        this.investedPercentage = 100 - this.returnsPercentage;
      } else {
        this.returnsPercentage = 0;
        this.investedPercentage = 0;
      }
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  }

  // Reuse the exact same download functions from the SIP Calculator:

  downloadExcel(): void {
    if (!this.isCalculated || this.yearWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }

    const dataForExport: any[] = this.yearWiseGrowth.map((item) => ({
      Period: item.yearLabel || item.year,
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
    XLSX.utils.book_append_sheet(wb, ws, 'Lumpsum_Projection');

    const fileName = `Lumpsum_Projection_${this.periodInYears}Y.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  async downloadPdf(): Promise<void> {
    if (!this.isCalculated || this.yearWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }

    const data = document.getElementById('growthTable');

    if (data) {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const canvas = await html2canvas(data, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 208;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Lumpsum_Projection_${this.periodInYears}Y.pdf`);
    }
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
      'Return (₹)': item.monthlyReturnAmount,
      'Total (₹)': item.totalValue,
      'Return Rate (per month)': item.monthlyReturnRate,
      'Monthly Investment (₹)': item.monthlyInvestment,
    }));

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

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataForExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MonthWise');

    const fileName = `Lumpsum_Month_Wise_${this.periodInYears}Y.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // MONTH-WISE PDF
  downloadMonthWisePdf(): void {
    if (!this.isCalculated || this.monthWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }

    this.exportPdf(
      'monthWiseTable',
      `Lumpsum_Month_Wise_${this.periodInYears}Y.pdf`
    );
  }

  // Reusable helper to export a table as PDF (same behavior across calculators)
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
