"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbsProps {
  propertyId?: string;
  last?: string;
}

export default function Breadcrumbs({ propertyId, last }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Only homepage
  if (pathname === "/" || pathname === "") {
    return (
      <nav
        className="text-sm mb-4"
        aria-label="Breadcrumb"
        style={{ color: "var(--text-muted)" }}
      >
        <ol className="list-reset flex">
          <li>
            <span style={{ color: "var(--foreground)" }}>Home</span>
          </li>
        </ol>
      </nav>
    );
  }

  // Property valuation or compare pages
  const crumbs: { name: string; href?: string }[] = [
    { name: "Home", href: "/" },
  ];
  if (propertyId) {
    crumbs.push({ name: propertyId.substring(0, 8) + "..." });
  }
  if (pathname.includes("/valuation")) {
    crumbs.push({ name: "Valuation" });
  }
  if (last && !crumbs.some((c) => c.name === last)) {
    crumbs.push({ name: last });
  }

  return (
    <nav
      className="text-sm mb-4"
      aria-label="Breadcrumb"
      style={{ color: "var(--text-muted)" }}
    >
      <ol className="list-reset flex items-center">
        {crumbs.map((crumb, idx) => (
          <li key={idx} className="flex items-center">
            {idx > 0 && <span className="mx-3 text-gray-400">/</span>}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="hover:underline transition-colors"
                style={{ color: "var(--primary)" }}
              >
                {crumb.name}
              </Link>
            ) : (
              <span style={{ color: "var(--foreground)" }}>{crumb.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
