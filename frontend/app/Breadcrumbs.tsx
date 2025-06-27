import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbsProps {
  propertyId?: string;
  last?: string;
}

export default function Breadcrumbs({ propertyId, last }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Only homepage
  if (pathname === '/' || pathname === '') {
    return (
      <nav className="text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
        <ol className="list-reset flex">
          <li><span className="text-gray-700">Home</span></li>
        </ol>
      </nav>
    );
  }

  // Property valuation or compare pages
  const crumbs: { name: string; href?: string }[] = [
    { name: 'Home', href: '/' },
  ];
  if (propertyId) {
    crumbs.push({ name: propertyId.substring(0, 8) + '...' });
  }
  if (pathname.includes('/compare')) {
    if (propertyId) {
      crumbs.push({ name: 'Valuation', href: `/properties/${propertyId}/valuation` });
    } else {
      crumbs.push({ name: 'Valuation' });
    }
    crumbs.push({ name: 'Compare' });
  } else if (pathname.includes('/valuation')) {
    crumbs.push({ name: 'Valuation' });
  }
  if (last && !crumbs.some(c => c.name === last)) {
    crumbs.push({ name: last });
  }

  return (
    <nav className="text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
      <ol className="list-reset flex">
        {crumbs.map((crumb, idx) => (
          <li key={idx} className="flex items-center">
            {idx > 0 && <span className="mx-2">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:underline" style={{ color: 'var(--primary)' }}>{crumb.name}</Link>
            ) : (
              <span className="text-gray-700">{crumb.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 