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
        <ul className="mt-4 space-y-4">
          {properties.map((prop) => (
            <li key={prop.id} className="bg-white rounded shadow px-6 py-4">
              <Link href={`/properties/${prop.id}/valuation`} className="text-lg text-blue-700 hover:underline">
                {prop.address}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
} 