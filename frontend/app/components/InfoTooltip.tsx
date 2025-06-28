import React from 'react';

interface InfoTooltipProps {
  label: React.ReactNode;
  tooltip: React.ReactNode;
  className?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ label, tooltip, className = '' }) => (
  <div className={`flex items-center justify-center gap-1 ${className}`}>
    {label}
    <span className="relative group ml-1 cursor-pointer">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block align-middle text-gray-400 group-hover:text-gray-700"><circle cx="12" cy="12" r="10" strokeWidth="2"/><text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">i</text></svg>
      <span className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-gray-900 text-white text-sm rounded-lg px-5 py-3 shadow-xl max-w-2xl min-w-[300px]" style={{top: '100%'}}>
        {tooltip}
      </span>
    </span>
  </div>
);

export default InfoTooltip; 