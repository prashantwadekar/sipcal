// src/app/investments/stepup-calculator/stepup-calculator.component.ts

import { Component } from '@angular/core';
import { CalculationService } from '../calculation.service';
import { InvestmentData } from '../investment-data';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-step-up-sip-calculator',
  templateUrl: './step-up-sip-calculator.component.html',
  // Create this SCSS file by copying sip-calculator.component.scss
  styleUrls: ['./step-up-sip-calculator.component.scss'],
})
export class StepUpCalculatorComponent {
  // Input Model
  monthlyInvestment: number = 10000;
  expectedRate: number = 12;
  stepUpRate: number = 10; // New input for annual step-up percentage
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

  constructor(private calcService: CalculationService) {}

  analyze(): void {
    if (
      this.monthlyInvestment <= 0 ||
      this.expectedRate <= 0 ||
      this.periodInYears <= 0 ||
      this.stepUpRate < 0
    ) {
      alert('Please enter valid positive values for all fields.');
      this.isCalculated = false;
      return;
    }

    // Use the new Step-Up SIP calculation service method
    this.yearWiseGrowth = this.calcService.getStepUpSIPGrowth(
      this.monthlyInvestment,
      this.expectedRate,
      this.stepUpRate,
      this.periodInYears
    );

    const lastYearData = this.yearWiseGrowth[this.yearWiseGrowth.length - 1];

    if (lastYearData) {
      this.finalInvestment = lastYearData.investedAmount;
      this.finalReturns = lastYearData.estimatedReturns;
      this.finalValue = lastYearData.totalValue;

      // Build month-wise breakdown using step-up schedule
      this.monthWiseGrowth = [];
      const totalMonths = this.calcService.parseYearsInputToMonths(
        this.periodInYears
      );
      this.totalMonths = totalMonths;
      const monthlyRate = this.expectedRate / 100 / 12;

      let totalValue = 0;
      let totalInvested = 0;

      for (let m = 1; m <= totalMonths; m++) {
        const yearIndex = Math.floor((m - 1) / 12);
        const monthlyContribution = Math.round(
          this.monthlyInvestment *
            Math.pow(1 + this.stepUpRate / 100, yearIndex)
        );

        const amountBeforeInterest = Math.round(
          totalValue + monthlyContribution
        );
        totalInvested += monthlyContribution;
        totalValue += monthlyContribution;

        const interestThisMonth = totalValue * monthlyRate;
        totalValue += interestThisMonth;

        this.monthWiseGrowth.push({
          month: m,
          amountBeforeInterest,
          monthlyInvestment: monthlyContribution,
          monthlyReturnAmount: Math.round(interestThisMonth),
          monthlyReturnRate: Number((monthlyRate * 100).toFixed(4)),
          investedAmount: Math.round(totalInvested),
          estimatedReturns: Math.round(totalValue - totalInvested),
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
    XLSX.writeFile(wb, `StepUp_Month_Wise_${this.periodInYears}Y.xlsx`);
  }

  // MONTH-WISE PDF
  downloadMonthWisePdf(): void {
    if (!this.isCalculated || this.monthWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }

    this.exportPdf(
      'monthWiseTable',
      `StepUp_Month_Wise_${this.periodInYears}Y.pdf`
    );
  }

  // Reusable helper to export a table as PDF
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

  // The download methods are the same, just updated the file name string
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
    XLSX.utils.book_append_sheet(wb, ws, 'StepUp_SIP_Projection');

    const fileName = `StepUp_SIP_Projection_${this.periodInYears}Y.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  downloadPdf(): void {
    if (!this.isCalculated || this.yearWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }

    const data = document.getElementById('growthTable');

    if (data) {
      html2canvas(data, { scale: 2 }).then((canvas) => {
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

        pdf.save(`StepUp_SIP_Projection_${this.periodInYears}Y.pdf`);
      });
    }
  }
}
