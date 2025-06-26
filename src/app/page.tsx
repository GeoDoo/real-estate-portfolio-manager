'use client';

import { useState } from 'react';

interface CashFlowRow {
  year: number;
  revenue: number;
  totalExpenses: number;
  netCashFlow: number;
  presentValue: number;
  cumulativePV: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [cashFlowData, setCashFlowData] = useState<CashFlowRow[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock calculation for now - we'll implement real DCF logic next
    const mockData: CashFlowRow[] = [
      { year: 0, revenue: 0, totalExpenses: 0, netCashFlow: -500000, presentValue: -500000, cumulativePV: -500000 },
      { year: 1, revenue: 60000, totalExpenses: 15000, netCashFlow: 45000, presentValue: 40909, cumulativePV: -459091 },
      { year: 2, revenue: 63000, totalExpenses: 15750, netCashFlow: 47250, presentValue: 39050, cumulativePV: -420041 },
      { year: 3, revenue: 66150, totalExpenses: 16538, netCashFlow: 49613, presentValue: 37285, cumulativePV: -382756 },
      { year: 4, revenue: 69458, totalExpenses: 17365, netCashFlow: 52093, presentValue: 35595, cumulativePV: -347161 },
      { year: 5, revenue: 72930, totalExpenses: 18233, netCashFlow: 54698, presentValue: 33995, cumulativePV: -313166 },
    ];
    
    setCashFlowData(mockData);
    setActiveTab('results');
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">DCF Calculator</h1>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('input')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'input'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Input Parameters
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                disabled={cashFlowData.length === 0}
              >
                Results
                {cashFlowData.length === 0 && (
                  <span className="ml-2 text-xs text-gray-400">(Calculate first)</span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'input' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Investment */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Investment</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Investment ($)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Revenue */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Revenue</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Rental Income ($)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Expenses */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Annual Expenses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Charge ($)
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ground Rent ($)
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance ($)
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Tax ($)
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance ($)
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Management Fees ($)
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    One-time Expenses ($)
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Assumptions */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Assumptions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cash Flow Growth Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Holding Period (years)
                    </label>
                    <input
                      type="number"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium text-lg transition-colors"
              >
                Calculate DCF
              </button>
            </form>
          </div>
        )}

        {activeTab === 'results' && cashFlowData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-6">Cash Flow Breakdown</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Year</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Revenue</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Total Expenses</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Net Cash Flow</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Present Value</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Cumulative PV</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlowData.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{row.year}</td>
                      <td className="py-3 px-2 text-right">${row.revenue.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right">${row.totalExpenses.toLocaleString()}</td>
                      <td className={`py-3 px-2 text-right font-medium ${row.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${row.netCashFlow.toLocaleString()}
                      </td>
                      <td className={`py-3 px-2 text-right ${row.presentValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${row.presentValue.toLocaleString()}
                      </td>
                      <td className={`py-3 px-2 text-right font-medium ${row.cumulativePV >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${row.cumulativePV.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'results' && cashFlowData.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">No results available. Please calculate DCF first.</p>
          </div>
        )}
      </div>
    </main>
  );
}
