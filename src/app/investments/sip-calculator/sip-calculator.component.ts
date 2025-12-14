import { Component } from '@angular/core';
import { CalculationService } from '../calculation.service';
import { InvestmentData } from '../investment-data';

// Import the required libraries
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-sip-calculator',
  templateUrl: './sip-calculator.component.html',
  styleUrls: ['./sip-calculator.component.scss'],
})
export class SipCalculatorComponent {
  // Input Model
  monthlyInvestment: number = 10000;
  expectedRate: number = 12;
  periodInYears: number = 10;

  // Output Model
  isCalculated: boolean = false;
  finalInvestment: number = 0;
  finalReturns: number = 0;
  finalValue: number = 0;
  yearWiseGrowth: InvestmentData[] = [];

  // Chart Properties
  returnsPercentage: number = 0;
  investedPercentage: number = 0;

  constructor(private calcService: CalculationService) {}

  /**
   * Performs the SIP calculation, updates results, and sets chart percentages.
   */
  analyze(): void {
    // 1. Input Validation
    if (
      this.monthlyInvestment <= 0 ||
      this.expectedRate <= 0 ||
      this.periodInYears <= 0
    ) {
      alert('Please enter valid positive values for all fields.');
      this.isCalculated = false;
      return;
    }

    // 2. Perform Calculation
    this.yearWiseGrowth = this.calcService.getStandardSIPGrowth(
      this.monthlyInvestment,
      this.expectedRate,
      this.periodInYears
    );

    // 3. Set Final Values
    const lastYearData = this.yearWiseGrowth[this.yearWiseGrowth.length - 1];

    if (lastYearData) {
      this.finalInvestment = lastYearData.investedAmount;
      this.finalReturns = lastYearData.estimatedReturns;
      this.finalValue = lastYearData.totalValue;
      this.isCalculated = true;

      // 4. Calculate Chart Percentages
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

  /**
   * Helper for currency formatting
   */
  formatCurrency(value: number): string {
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
  }

  /**
   * Exports the yearWiseGrowth table data to an Excel file (.xlsx).
   */
  downloadExcel(): void {
    if (!this.isCalculated || this.yearWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }

    // 1. Prepare Data for Excel
    const dataForExport: any[] = this.yearWiseGrowth.map((item) => ({
      Year: item.year,
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

    // 2. Create Worksheet and Workbook (MISSING CODE FROM ORIGINAL SNIPPET WAS HERE)
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataForExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SIP_Projection');

    // 3. Write and Download File
    const fileName = `SIP_Projection_${this.periodInYears}Y.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  /**
   * Exports the Year-wise Growth Projection table to a PDF file.
   */
  downloadPdf(): void {
    if (!this.isCalculated || this.yearWiseGrowth.length === 0) {
      alert('Please analyze the growth before downloading.');
      return;
    }

    // Target the table element by its ID
    const data = document.getElementById('growthTable');

    if (data) {
      html2canvas(data, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 208; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add image to PDF (handles multiple pages if the table is very long)
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`SIP_Projection_${this.periodInYears}Y.pdf`);
      });
    }
  }
}
