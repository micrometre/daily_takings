import { useState, useEffect } from 'react';
import { FileManager } from './FileManager';
import type { SalesSummary } from '../types/sales';

interface SalesDisplayProps {
  fileName: string;
  onBack: () => void;
}

export default function SalesDisplay({ fileName, onBack }: SalesDisplayProps) {
  const [salesData, setSalesData] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileManager = FileManager.getInstance();

  useEffect(() => {
    const loadSalesData = async () => {
      if (!fileName) return;

      setLoading(true);
      setError(null);
      try {
        const data = await fileManager.readSalesFile(fileName);
        setSalesData(data);
      } catch (err) {
        setError('Failed to load sales data');
        console.error('Error loading sales data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSalesData();
  }, [fileName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-4xl mb-4">⚠️</div>
        <p className="text-red-800 mb-4">{error}</p>
        <button
          onClick={onBack}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!salesData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-400 text-4xl mb-4">📄</div>
        <p className="text-gray-600 mb-4">No sales data found</p>
        <button
          onClick={onBack}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'digital': return '📱';
      default: return '💰';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'text-green-600';
      case 'card': return 'text-blue-600';
      case 'digital': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-2 transition-colors"
            >
              ← Back to Sales Entry
            </button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              📊 Sales Summary for {fileManager.formatDate(salesData.date)}
            </h1>
            <p className="text-gray-600 mt-1">File: {fileName}</p>
          </div>
        </div>
      </div>

      {/* Summary Totals */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">💰 Payment Method Breakdown</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">💵 Cash Total</p>
            <p className="text-2xl font-bold text-green-600">{fileManager.formatCurrency(salesData.totals.cash)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">💳 Card Total</p>
            <p className="text-2xl font-bold text-blue-600">{fileManager.formatCurrency(salesData.totals.card)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">📱 Digital Total</p>
            <p className="text-2xl font-bold text-purple-600">{fileManager.formatCurrency(salesData.totals.digital)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center border-2 border-green-500">
            <p className="text-sm text-gray-600">💰 Grand Total</p>
            <p className="text-2xl font-bold text-green-700">{fileManager.formatCurrency(salesData.totals.total)}</p>
          </div>
        </div>
      </div>

      {/* Products Details */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🛍️ Product Sales Details</h2>
        
        {salesData.products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No products sold on this date</p>
        ) : (
          <div className="grid gap-4">
            {salesData.products.map((product, index) => {
              const productTotal = (product.cash + product.card + product.digital) * 
                (salesData.totals.total / salesData.products.reduce((sum, p) => sum + p.quantity, 0));
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-medium text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-600">Total Quantity: {product.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {fileManager.formatCurrency(productTotal)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Cash Sales */}
                    <div className="bg-green-50 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">💵 Cash</span>
                        <span className="text-lg font-semibold text-green-600">{product.cash}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {fileManager.formatCurrency(product.cash * (productTotal / product.quantity))}
                      </p>
                    </div>

                    {/* Card Sales */}
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">💳 Card</span>
                        <span className="text-lg font-semibold text-blue-600">{product.card}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {fileManager.formatCurrency(product.card * (productTotal / product.quantity))}
                      </p>
                    </div>

                    {/* Digital Sales */}
                    <div className="bg-purple-50 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">📱 Digital</span>
                        <span className="text-lg font-semibold text-purple-600">{product.digital}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {fileManager.formatCurrency(product.digital * (productTotal / product.quantity))}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📈 Quick Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">
              {salesData.products.reduce((sum, p) => sum + p.quantity, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Items Sold</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">
              {salesData.products.length}
            </p>
            <p className="text-sm text-gray-600">Product Types</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-800">
              {salesData.products.length > 0 ? 
                fileManager.formatCurrency(salesData.totals.total / salesData.products.reduce((sum, p) => sum + p.quantity, 0)) : 
                fileManager.formatCurrency(0)
              }
            </p>
            <p className="text-sm text-gray-600">Average per Item</p>
          </div>
        </div>
      </div>
    </div>
  );
}