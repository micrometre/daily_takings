import { useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  emoji: string;
  isCustom?: boolean;
}

interface SaleItem {
  productId: number;
  quantity: number;
  cash: number;
  card: number;
  digital: number;
}

const defaultProducts: Product[] = [
  { id: 1, name: "Chocolate Fudge Cake", price: 25.99, emoji: "🍫" },
];

export default function SalesEntry() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [nextProductId, setNextProductId] = useState(7);
  
  // Custom product form state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    emoji: '🍖'
  });

  const [salesData, setSalesData] = useState<SaleItem[]>(
    defaultProducts.map(product => ({
      productId: product.id,
      quantity: 0,
      cash: 0,
      card: 0,
      digital: 0
    }))
  );

  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const updateSaleItem = (productId: number, field: keyof Omit<SaleItem, 'productId'>, value: number) => {
    setSalesData(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, [field]: Math.max(0, value) }
        : item
    ));
  };

  const addCustomProduct = () => {
    if (newProduct.name.trim() === '' || newProduct.price <= 0) {
      alert('Please enter a valid product name and price.');
      return;
    }

    const customProduct: Product = {
      id: nextProductId,
      name: newProduct.name.trim(),
      price: newProduct.price,
      emoji: newProduct.emoji,
      isCustom: true
    };

    setProducts(prev => [...prev, customProduct]);
    setSalesData(prev => [...prev, {
      productId: nextProductId,
      quantity: 0,
      cash: 0,
      card: 0,
      digital: 0
    }]);

    setNextProductId(prev => prev + 1);
    setNewProduct({ name: '', price: 0, emoji: '🍖' });
    setShowAddProduct(false);
  };

  const removeCustomProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product?.isCustom) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      setSalesData(prev => prev.filter(item => item.productId !== productId));
    }
  };

  const getProductTotal = (item: SaleItem) => {
    const product = products.find(p => p.id === item.productId);
    return product ? (item.cash + item.card + item.digital) * product.price : 0;
  };

  const getTotalRevenue = () => {
    return salesData.reduce((total, item) => total + getProductTotal(item), 0);
  };

  const getTotalsByPaymentMethod = () => {
    return salesData.reduce((totals, item) => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        totals.cash += item.cash * product.price;
        totals.card += item.card * product.price;
        totals.digital += item.digital * product.price;
      }
      return totals;
    }, { cash: 0, card: 0, digital: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totals = getTotalsByPaymentMethod();
    const summary = {
      date: currentDate,
      products: salesData.filter(item => item.quantity > 0),
      totals: {
        ...totals,
        total: getTotalRevenue()
      }
    };
    
    // Generate markdown report
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: YYYY-MM-DDTHH-MM-SS
    const filename = `daily-sales-report-${timestamp}.md`;
    
    let markdownContent = `# Daily Sales Report\n\n`;
    markdownContent += `**Generated:** ${now.toLocaleString()}\n`;
    markdownContent += `**Sales Date:** ${currentDate}\n\n`;
    
    markdownContent += `## Products Sold\n\n`;
    if (summary.products.length === 0) {
      markdownContent += `No products sold on this date.\n\n`;
    } else {
      markdownContent += `| Product | Emoji | Price | Cash | Card | Digital | Total Qty | Revenue |\n`;
      markdownContent += `|---------|-------|-------|------|------|---------|-----------|----------|\n`;
      
      summary.products.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const totalQty = item.cash + item.card + item.digital;
          const revenue = getProductTotal(item);
          markdownContent += `| ${product.name} | ${product.emoji} | £${product.price.toFixed(2)} | ${item.cash} | ${item.card} | ${item.digital} | ${totalQty} | £${revenue.toFixed(2)} |\n`;
        }
      });
      markdownContent += `\n`;
    }
    
    markdownContent += `## Payment Method Summary\n\n`;
    markdownContent += `| Payment Method | Amount |\n`;
    markdownContent += `|----------------|--------|\n`;
    markdownContent += `| 💵 Cash | £${totals.cash.toFixed(2)} |\n`;
    markdownContent += `| 💳 Card | £${totals.card.toFixed(2)} |\n`;
    markdownContent += `| 📱 Digital | £${totals.digital.toFixed(2)} |\n`;
    markdownContent += `| **💰 Total** | **£${summary.totals.total.toFixed(2)}** |\n\n`;
    
    markdownContent += `## Report Details\n\n`;
    markdownContent += `- **Total Products Sold:** ${summary.products.reduce((sum, item) => sum + item.cash + item.card + item.digital, 0)}\n`;
    markdownContent += `- **Number of Different Products:** ${summary.products.length}\n`;
    markdownContent += `- **Highest Revenue Product:** ${summary.products.length > 0 ? products.find(p => p.id === summary.products.reduce((max, item) => getProductTotal(item) > getProductTotal(max) ? item : max).productId)?.name || 'N/A' : 'N/A'}\n`;
    
    // Save the markdown file to server
    try {
      const response = await fetch('/api/save-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: filename,
          content: markdownContent
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('Daily Sales Summary:', summary);
        console.log(products)
        alert(`Sales report saved successfully as: ${result.path}`);
      } else {
        console.error('Failed to save report:', result.error);
        alert(`Failed to save report: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report. Please try again.');
    }
  };

  const resetForm = () => {
    setSalesData(products.map(product => ({
      productId: product.id,
      quantity: 0,
      cash: 0,
      card: 0,
      digital: 0
    })));
  };

  const paymentTotals = getTotalsByPaymentMethod();

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
      {/* Date Selection */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          📅 Sales Date
        </label>
        <input
          type="date"
          id="date"
          value={currentDate}
          onChange={(e) => setCurrentDate(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Add Custom Product Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">🛍️ Custom Products</h3>
          <button
            type="button"
            onClick={() => setShowAddProduct(!showAddProduct)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200"
          >
            {showAddProduct ? '❌ Cancel' : '➕ Add Product'}
          </button>
        </div>

        {showAddProduct && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Custom Cupcake"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emoji
                </label>
                <select
                  value={newProduct.emoji}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, emoji: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="🍖">🍖 Jerk Chicken</option>
                  <option value="🍛">🍛 Rice & Peas</option>
                  <option value="🐟">🐟 Curry Fish</option>
                  <option value="🥥">🥥 Coconut Treats</option>
                  <option value="🌶️">🌶️ Spicy Caribbean</option>
                  <option value="🍰">🍰 Cake</option>
                  <option value="🧁">🧁 Cupcake</option>
                  <option value="🍪">🍪 Cookie</option>
                  <option value="🥐">🥐 Pastry</option>
                  <option value="🍞">🍞 Bread</option>
                  <option value="🥧">🥧 Pie</option>
                  <option value="��">🍩 Donut</option>
                  <option value="☕">☕ Coffee</option>
                  <option value="🥤">🥤 Drink</option>
                  <option value="🍯">🍯 Other</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addCustomProduct}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
                >
                  ✅ Add Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid gap-6 mb-6">
        {products.map((product) => {
          const saleItem = salesData.find(item => item.productId === product.id)!;
          const totalQuantity = saleItem.cash + saleItem.card + saleItem.digital;
          
          return (
            <div key={product.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{product.emoji}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                      {product.isCustom && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">£{product.price.toFixed(2)} each</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {product.isCustom && (
                    <button
                      type="button"
                      onClick={() => removeCustomProduct(product.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors duration-200"
                      title="Remove custom product"
                    >
                      🗑️
                    </button>
                  )}
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Sold: {totalQuantity}</p>
                    <p className="text-lg font-bold text-green-600">
                      £{getProductTotal(saleItem).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cash Sales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💵 Cash Sales
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={saleItem.cash}
                    onChange={(e) => updateSaleItem(product.id, 'cash', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Subtotal: £{(saleItem.cash * product.price).toFixed(2)}
                  </p>
                </div>

                {/* Card Sales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💳 Card Sales
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={saleItem.card}
                    onChange={(e) => updateSaleItem(product.id, 'card', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Subtotal: £{(saleItem.card * product.price).toFixed(2)}
                  </p>
                </div>

                {/* Digital Sales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📱 Digital Sales
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={saleItem.digital}
                    onChange={(e) => updateSaleItem(product.id, 'digital', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Subtotal: £{(saleItem.digital * product.price).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Daily Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">💵 Cash Total</p>
            <p className="text-2xl font-bold text-green-600">£{paymentTotals.cash.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">💳 Card Total</p>
            <p className="text-2xl font-bold text-blue-600">£{paymentTotals.card.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">📱 Digital Total</p>
            <p className="text-2xl font-bold text-purple-600">£{paymentTotals.digital.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center border-2 border-green-500">
            <p className="text-sm text-gray-600">💰 Grand Total</p>
            <p className="text-2xl font-bold text-green-700">£{getTotalRevenue().toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 justify-center">
        <button
          type="button"
          onClick={resetForm}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors duration-200"
        >
          🔄 Reset Form
        </button>
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition-colors duration-200 font-semibold"
        >
          💾 Record Daily Sales
        </button>
      </div>
    </form>
  );
}
