import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => (
  <div className={`pt-4 pb-12 ${className}`}>
    {children}
  </div>
);

export default PageContainer; 