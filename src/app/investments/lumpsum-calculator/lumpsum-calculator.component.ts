// src/app/investments/lumpsum-calculator/lumpsum-calculator.component.ts

import { Component } from '@angular/core';
import { CalculationService } from '../calculation.service';
import { InvestmentData } from '../investment-data';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-lumpsum-calculator',
  templateUrl: './lumpsum-calculator.component.html',
  // You will need to create this SCSS file based on sip-calculator.component.scss
  styleUrls: ['./lumpsum-calculator.component.scss'] 
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

  // Chart Properties
  returnsPercentage: number = 0;
  investedPercentage: number = 0;

  constructor(private calcService: CalculationService) { }

  analyze(): void {
    if (this.lumpsumInvestment <= 0 || this.expectedRate <= 0 || this.periodInYears <= 0) {
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
      this.isCalculated = true;

      if (this.finalValue > 0) {
        this.returnsPercentage = Math.round((this.finalReturns / this.finalValue) * 100);
        this.investedPercentage = 100 - this.returnsPercentage;
      } else {
        this.returnsPercentage = 0;
        this.investedPercentage = 0;
      }
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  }
  
  // Reuse the exact same download functions from the SIP Calculator:

  downloadExcel(): void {
    if (!this.isCalculated || this.yearWiseGrowth.length === 0) {
      alert("Please analyze the growth before downloading.");
      return;
    }

    const dataForExport: any[] = this.yearWiseGrowth.map(item => ({
      Year: item.year,
      'Invested Amount (₹)': item.investedAmount,
      'Estimated Returns (₹)': item.estimatedReturns,
      'Total Value (₹)': item.totalValue
    }));

    dataForExport.push({
      Year: 'SUMMARY',
      'Invested Amount (₹)': this.finalInvestment,
      'Estimated Returns (₹)': this.finalReturns,
      'Total Value (₹)': this.finalValue
    });

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataForExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lumpsum_Projection');

    const fileName = `Lumpsum_Projection_${this.periodInYears}Y.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  downloadPdf(): void {
    if (!this.isCalculated || this.yearWiseGrowth.length === 0) {
      alert("Please analyze the growth before downloading.");
      return;
    }
    
    const data = document.getElementById('growthTable'); 

    if (data) {
      html2canvas(data, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 208;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
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
      });
    }
  }
}