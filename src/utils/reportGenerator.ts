export interface SalesData {
  date: string;
  totals: {
    cash: number;
    card: number;
    digital: number;
    total: number;
  };
  products: Array<{
    name: string;
    quantity: number;
    cash: number;
    card: number;
    digital: number;
  }>;
}

export class ReportGenerator {
  private static formatCurrency(amount: number): string {
    return `£${amount.toFixed(2)}`;
  }

  private static formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  private static calculateProductRevenue(product: any, salesData: SalesData): number {
    const productTotal = (product.cash + product.card + product.digital);
    const totalQuantity = salesData.products.reduce((sum, p) => sum + p.quantity, 0);
    return totalQuantity > 0 ? productTotal * (salesData.totals.total / totalQuantity) : 0;
  }

  private static getTotalItemsSold(salesData: SalesData): number {
    return salesData.products.reduce((sum, p) => sum + p.quantity, 0);
  }

  private static getAveragePerItem(salesData: SalesData): number {
    const totalItems = this.getTotalItemsSold(salesData);
    return totalItems > 0 ? salesData.totals.total / totalItems : 0;
  }

  static generateWebReportHTML(salesData: SalesData, fileName: string): string {
    const { formatCurrency, formatDate, calculateProductRevenue, getTotalItemsSold, getAveragePerItem } = this;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales Report - ${formatDate(salesData.date)}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f9fafb;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid;
        }
        .summary-card.cash { border-left-color: #10b981; }
        .summary-card.card { border-left-color: #3b82f6; }
        .summary-card.digital { border-left-color: #8b5cf6; }
        .summary-card.total { border-left-color: #f59e0b; background: #fffbeb; }
        .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
        }
        .summary-card .amount {
            font-size: 2em;
            font-weight: bold;
            margin: 0;
        }
        .summary-card.cash .amount { color: #10b981; }
        .summary-card.card .amount { color: #3b82f6; }
        .summary-card.digital .amount { color: #8b5cf6; }
        .summary-card.total .amount { color: #f59e0b; }
        .products-section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .products-section h2 {
            margin: 0 0 25px 0;
            color: #374151;
            font-size: 1.5em;
        }
        .product-item {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            background: #f9fafb;
        }
        .product-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        .product-name {
            font-weight: bold;
            font-size: 1.1em;
            color: #1f2937;
            flex: 1;
        }
        .product-total {
            font-size: 1.2em;
            font-weight: bold;
            color: #10b981;
        }
        .payment-breakdown {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-top: 10px;
        }
        .payment-method {
            text-align: center;
            padding: 10px;
            border-radius: 6px;
        }
        .payment-method.cash { background: #d1fae5; color: #065f46; }
        .payment-method.card { background: #dbeafe; color: #1e40af; }
        .payment-method.digital { background: #e9d5ff; color: #6b21a8; }
        .payment-method .label {
            font-size: 0.8em;
            margin-bottom: 5px;
            opacity: 0.8;
        }
        .payment-method .quantity {
            font-size: 1.2em;
            font-weight: bold;
        }
        .stats-section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
        }
        .stat-item {
            text-align: center;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 8px;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #374151;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 0.9em;
            color: #6b7280;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        @media print {
            body { background: white; }
            .header { background: #374151 !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Daily Sales Report</h1>
        <p>${formatDate(salesData.date)}</p>
        <p style="font-size: 0.9em; margin-top: 10px;">File: ${fileName}</p>
    </div>

    <div class="summary-grid">
        <div class="summary-card cash">
            <h3>💵 Cash Sales</h3>
            <p class="amount">${formatCurrency(salesData.totals.cash)}</p>
        </div>
        <div class="summary-card card">
            <h3>💳 Card Sales</h3>
            <p class="amount">${formatCurrency(salesData.totals.card)}</p>
        </div>
        <div class="summary-card digital">
            <h3>📱 Digital Sales</h3>
            <p class="amount">${formatCurrency(salesData.totals.digital)}</p>
        </div>
        <div class="summary-card total">
            <h3>💰 Total Sales</h3>
            <p class="amount">${formatCurrency(salesData.totals.total)}</p>
        </div>
    </div>

    <div class="products-section">
        <h2>🛍️ Product Sales Breakdown</h2>
        ${salesData.products.map((product) => {
          const revenue = calculateProductRevenue(product, salesData);
          
          return `
            <div class="product-item">
                <div class="product-header">
                    <div class="product-name">${product.name}</div>
                    <div class="product-total">${formatCurrency(revenue)}</div>
                </div>
                <p><strong>Total Quantity:</strong> ${product.quantity}</p>
                <div class="payment-breakdown">
                    <div class="payment-method cash">
                        <div class="label">Cash</div>
                        <div class="quantity">${product.cash}</div>
                    </div>
                    <div class="payment-method card">
                        <div class="label">Card</div>
                        <div class="quantity">${product.card}</div>
                    </div>
                    <div class="payment-method digital">
                        <div class="label">Digital</div>
                        <div class="quantity">${product.digital}</div>
                    </div>
                </div>
            </div>
          `;
        }).join('')}
    </div>

    <div class="stats-section">
        <h2>📈 Quick Statistics</h2>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${getTotalItemsSold(salesData)}</div>
                <div class="stat-label">Total Items Sold</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${salesData.products.length}</div>
                <div class="stat-label">Product Types</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatCurrency(getAveragePerItem(salesData))}</div>
                <div class="stat-label">Average per Item</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
        <p>Daily Takings Sales System</p>
    </div>
</body>
</html>
    `;
  }

  static generatePDFReportHTML(salesData: SalesData, fileName: string): string {
    const { formatCurrency, formatDate, calculateProductRevenue, getTotalItemsSold, getAveragePerItem } = this;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales Report - ${formatDate(salesData.date)}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
            font-size: 12pt;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 24pt;
            color: #333;
        }
        .header p {
            margin: 5px 0;
            font-size: 14pt;
        }
        .summary-section {
            margin-bottom: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            border: 1px solid #ddd;
            margin-bottom: 5px;
        }
        .summary-row.total {
            background: #f0f0f0;
            font-weight: bold;
            border: 2px solid #333;
        }
        .summary-label {
            font-weight: bold;
        }
        .products-section {
            margin-bottom: 30px;
        }
        .products-section h2 {
            border-bottom: 1px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 16pt;
        }
        .product-item {
            border: 1px solid #ddd;
            margin-bottom: 15px;
            padding: 15px;
            page-break-inside: avoid;
        }
        .product-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .product-name {
            font-weight: bold;
            font-size: 14pt;
        }
        .product-total {
            font-size: 14pt;
            font-weight: bold;
        }
        .payment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin-top: 10px;
        }
        .payment-item {
            text-align: center;
            padding: 8px;
            border: 1px solid #ccc;
            background: #f9f9f9;
        }
        .payment-label {
            font-size: 10pt;
            margin-bottom: 3px;
        }
        .payment-value {
            font-weight: bold;
            font-size: 12pt;
        }
        .stats-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #333;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
        }
        .stat-item {
            text-align: center;
            padding: 15px;
            border: 1px solid #ddd;
            background: #f9f9f9;
        }
        .stat-value {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 10pt;
        }
        .footer {
            position: fixed;
            bottom: 10mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10pt;
            color: #666;
        }
        @media print {
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Daily Sales Report</h1>
        <p>${formatDate(salesData.date)}</p>
        <p style="font-size: 10pt;">File: ${fileName}</p>
    </div>

    <div class="summary-section">
        <h2>Payment Summary</h2>
        <div class="summary-row">
            <span class="summary-label">💵 Cash Sales:</span>
            <span>${formatCurrency(salesData.totals.cash)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">💳 Card Sales:</span>
            <span>${formatCurrency(salesData.totals.card)}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">📱 Digital Sales:</span>
            <span>${formatCurrency(salesData.totals.digital)}</span>
        </div>
        <div class="summary-row total">
            <span class="summary-label">💰 Total Sales:</span>
            <span>${formatCurrency(salesData.totals.total)}</span>
        </div>
    </div>

    <div class="products-section">
        <h2>Product Sales Details</h2>
        ${salesData.products.map((product) => {
          const revenue = calculateProductRevenue(product, salesData);
          
          return `
            <div class="product-item">
                <div class="product-header">
                    <div class="product-name">${product.name}</div>
                    <div class="product-total">${formatCurrency(revenue)}</div>
                </div>
                <p><strong>Total Quantity:</strong> ${product.quantity}</p>
                <div class="payment-grid">
                    <div class="payment-item">
                        <div class="payment-label">Cash</div>
                        <div class="payment-value">${product.cash}</div>
                    </div>
                    <div class="payment-item">
                        <div class="payment-label">Card</div>
                        <div class="payment-value">${product.card}</div>
                    </div>
                    <div class="payment-item">
                        <div class="payment-label">Digital</div>
                        <div class="payment-value">${product.digital}</div>
                    </div>
                </div>
            </div>
          `;
        }).join('')}
    </div>

    <div class="stats-section">
        <h2>Statistics</h2>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${getTotalItemsSold(salesData)}</div>
                <div class="stat-label">Total Items Sold</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${salesData.products.length}</div>
                <div class="stat-label">Product Types</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${formatCurrency(getAveragePerItem(salesData))}</div>
                <div class="stat-label">Average per Item</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')} | Daily Takings Sales System</p>
    </div>
</body>
</html>
    `;
  }
}