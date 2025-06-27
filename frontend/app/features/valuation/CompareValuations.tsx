"use client";
import { useEffect, useState } from 'react';
import { DCFRow, CashFlowRow } from '@/types/dcf';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useParams } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { valuationsAPI } from '@/lib/api/valuations';

export default function CompareValuationsPage() {
  const [valuations, setValuations] = useState<DCFRow[]>([]);
  const [selectedValuations, setSelectedValuations] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<{[key: string]: CashFlowRow[]}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();
  const propertyId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    async function fetchData() {
      if (!propertyId) return;
      
      setLoading(true);
      setError(null);
      try {
        const json = await valuationsAPI.getByPropertyId(propertyId);
        if (json && json.id) {
          setValuations([json]);
        } else {
          setValuations([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch valuation';
        setError(errorMessage);
        setValuations([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [propertyId]);

  useEffect(() => {
    async function fetchComparisonData() {
      if (!propertyId || selectedValuations.length === 0) {
        setComparisonData({});
        return;
      }

      const newComparisonData: {[key: string]: CashFlowRow[]} = {};
      
      for (const valuationId of selectedValuations) {
        try {
          const cashFlows = await valuationsAPI.getCashFlows(propertyId, valuationId);
          newComparisonData[valuationId] = cashFlows;
        } catch {
          console.error(`Failed to fetch cash flows for valuation ${valuationId}`);
        }
      }
      
      setComparisonData(newComparisonData);
    }

    fetchComparisonData();
  }, [selectedValuations, propertyId]);

  const toggleValuationSelection = (valuationId: string) => {
    setSelectedValuations(prev => 
      prev.includes(valuationId) 
        ? prev.filter(id => id !== valuationId)
        : [...prev, valuationId]
    );
  };

  const getValuationById = (id: string) => {
    return valuations.find(v => v.id === id);
  };

  const getMaxYears = () => {
    const allCashFlows = Object.values(comparisonData);
    if (allCashFlows.length === 0) return 0;
    return Math.max(...allCashFlows.map(cf => cf.length));
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs propertyId={propertyId} last="Compare" />
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Compare Valuations</h1>
        
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <>
            {/* Valuation Selection */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Select Valuations to Compare</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {valuations.map((valuation) => (
                  <div
                    key={valuation.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedValuations.includes(valuation.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleValuationSelection(valuation.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {valuation.id.substring(0, 8)}...
                      </span>
                      {selectedValuations.includes(valuation.id) ? (
                        <CheckIcon className="w-5 h-5 text-blue-600" />
                      ) : (
                        <XMarkIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>Investment: ${valuation.initial_investment.toLocaleString()}</div>
                      <div>Rental: ${valuation.annual_rental_income.toLocaleString()}</div>
                      <div>Discount: {valuation.discount_rate}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Results */}
            {selectedValuations.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Comparison Results</h2>
                
                {/* Summary Table */}
                <div className="overflow-x-auto mb-8">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2 px-4 text-left">Valuation</th>
                        <th className="py-2 px-4 text-right">Initial Investment ($)</th>
                        <th className="py-2 px-4 text-right">Annual Rental ($)</th>
                        <th className="py-2 px-4 text-right">Discount Rate (%)</th>
                        <th className="py-2 px-4 text-right">NPV ($)</th>
                        <th className="py-2 px-4 text-right">IRR (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedValuations.map((valuationId, index) => {
                        const valuation = getValuationById(valuationId);
                        const cashFlows = comparisonData[valuationId] || [];
                        const npv = cashFlows.length > 0 ? cashFlows[cashFlows.length - 1].cumulativePV : 0;
                        
                        return (
                          <tr key={valuationId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-2 px-4 font-medium">
                              Scenario {index + 1}
                            </td>
                            <td className="py-2 px-4 text-right">
                              ${valuation?.initial_investment.toLocaleString()}
                            </td>
                            <td className="py-2 px-4 text-right">
                              ${valuation?.annual_rental_income.toLocaleString()}
                            </td>
                            <td className="py-2 px-4 text-right">
                              {valuation?.discount_rate}%
                            </td>
                            <td className={`py-2 px-4 text-right font-semibold ${
                              npv < 0 ? 'text-red-600' : 'text-green-700'
                            }`}>
                              ${formatCurrency(npv)}
                            </td>
                            <td className="py-2 px-4 text-right">
                              {/* IRR calculation would go here */}
                              -
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Detailed Cash Flow Comparison */}
                <div className="overflow-x-auto">
                  <h3 className="text-lg font-bold mb-4">Cash Flow Comparison</h3>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2 px-4 text-left">Year</th>
                        {selectedValuations.map((valuationId, index) => (
                          <th key={valuationId} className="py-2 px-4 text-right">
                            Scenario {index + 1} NPV ($)
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: getMaxYears() }, (_, yearIndex) => (
                        <tr key={yearIndex} className={yearIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-2 px-4 font-medium">{yearIndex + 1}</td>
                          {selectedValuations.map((valuationId) => {
                            const cashFlows = comparisonData[valuationId] || [];
                            const yearData = cashFlows[yearIndex];
                            const npv = yearData ? yearData.cumulativePV : 0;
                            
                            return (
                              <td key={valuationId} className={`py-2 px-4 text-right ${
                                npv < 0 ? 'text-red-600' : 'text-green-700'
                              }`}>
                                ${formatCurrency(npv)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
} 