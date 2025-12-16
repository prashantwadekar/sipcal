export interface InvestmentData {
  year: number;
  investedAmount: number;
  estimatedReturns: number;
  totalValue: number;

  // Optional label for mixed year/month displays (e.g., "1y 2m", "6m")
  yearLabel?: string;
  // Numeric fractional year if needed
  yearNumber?: number;
}
