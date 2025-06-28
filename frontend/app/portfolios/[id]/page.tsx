import PageContainer from '@/components/PageContainer';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function PortfolioDetailsPage({ params }: { params: { id: string } }) {
  // const id = params.id; // No longer needed
  return (
    <PageContainer>
      <Breadcrumbs last="Portfolio Details" />
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Portfolio Details</h1>
      <div className="mt-4 text-gray-500">You have not added any properties yet.</div>
    </PageContainer>
  );
} 