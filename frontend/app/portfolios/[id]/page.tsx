import PageContainer from '@/components/PageContainer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { portfoliosAPI } from '@/lib/api/portfolios';
import Link from 'next/link';

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
  return (
    <PageContainer>
      <Breadcrumbs last={portfolioName} />
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{portfolioName}</h1>
      {properties.length === 0 ? (
        <div className="mt-4 text-gray-500">You have not added any properties yet.</div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
          {properties.map((prop) => (
            <li key={prop.id} className="">
              <Link href={`/properties/${prop.id}/valuation`} className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-5 text-lg font-medium text-gray-900 hover:shadow-md hover:bg-gray-50 transition-all group">
                <span>{prop.address}</span>
                <span className="text-gray-300 group-hover:text-blue-500 transition-colors">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
} 