import PageContainer from '@/components/PageContainer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { portfoliosAPI } from '@/lib/api/portfolios';
import { valuationsAPI } from '@/lib/api/valuations';
import { CashFlowRow } from '@/types/cashflow';

function getNumberColorClass(n: number) {
  if (n > 0) return 'text-green-700 font-bold';
  if (n < 0) return 'text-red-600 font-bold';
  return 'text-gray-500 font-bold';
}

export default async function PortfolioDetailsPage({ params }: { params: { id: string } }) {
  let portfolioName = '';
  let properties: any[] = [];
  try {
    const portfolio = await portfoliosAPI.getById(params.id);
    portfolioName = portfolio.name;
    properties = await portfoliosAPI.getProperties(params.id) as any[];
  } catch {
    portfolioName = 'Portfolio Not Found';
    properties = [];
  }

  // Fetch all cash flows for properties
  const allCashFlows: CashFlowRow[][] = await Promise.all(
    properties.map(async (prop) => {
      const valuation = await valuationsAPI.getByPropertyId(prop.id);
      if (!valuation) return [];
      return await valuationsAPI.calculateCashFlows(valuation);
    })
  );

  // Aggregate cash flows by year
  const yearMap: Map<number, CashFlowRow> = new Map();
  for (const cashFlows of allCashFlows) {
    for (const row of cashFlows) {
      if (!yearMap.has(row.year)) {
        yearMap.set(row.year, { ...row });
      } else {
        const agg = yearMap.get(row.year)!;
        agg.revenue += row.revenue;
        agg.totalExpenses += row.totalExpenses;
        agg.netCashFlow += row.netCashFlow;
        agg.presentValue += row.presentValue;
        agg.cumulativePV += row.cumulativePV;
      }
    }
  }
  const aggregateRows = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

  return (
    <PageContainer>
      <Breadcrumbs last={portfolioName} />
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{portfolioName}</h1>
      {properties.length === 0 ? (
        <div className="mt-4 text-gray-500">You have not added any properties yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full bg-white rounded-xl shadow-sm border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Year</th>
                <th className="px-4 py-2 text-right">Revenue ($)</th>
                <th className="px-4 py-2 text-right">Expenses ($)</th>
                <th className="px-4 py-2 text-right">Net Cash Flow ($)</th>
                <th className="px-4 py-2 text-right">Present Value ($)</th>
                <th className="px-4 py-2 text-right">Cumulative PV ($)</th>
              </tr>
            </thead>
            <tbody>
              {aggregateRows.map((row) => (
                <tr key={row.year}>
                  <td className="px-4 py-2 text-gray-900">{row.year}</td>
                  <td className={`px-4 py-2 text-right ${getNumberColorClass(row.revenue)}`}>{row.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className={`px-4 py-2 text-right ${getNumberColorClass(row.totalExpenses)}`}>{row.totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className={`px-4 py-2 text-right ${getNumberColorClass(row.netCashFlow)}`}>{row.netCashFlow.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className={`px-4 py-2 text-right ${getNumberColorClass(row.presentValue)}`}>{row.presentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className={`px-4 py-2 text-right ${getNumberColorClass(row.cumulativePV)}`}>{row.cumulativePV.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
} 