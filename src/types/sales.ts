export interface SalesFile {
  name: string;
  date: string;
  lastModified: Date;
}

export interface SalesSummary {
  date: string;
  products: Array<{
    productId: number;
    name: string;
    quantity: number;
    cash: number;
    card: number;
    digital: number;
  }>;
  totals: {
    cash: number;
    card: number;
    digital: number;
    total: number;
  };
}