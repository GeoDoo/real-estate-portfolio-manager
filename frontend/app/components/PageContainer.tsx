import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = "",
}) => (
  <div className={` ${className}`} style={{ background: "var(--background)" }}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </div>
);

export default PageContainer;
