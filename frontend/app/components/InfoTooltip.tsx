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
      <svg 
        width="16" 
        height="16" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        className="inline-block align-middle transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
        <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">i</text>
      </svg>
      <span 
        className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none text-sm rounded-lg px-4 py-3 shadow-xl max-w-2xl min-w-[300px] border"
        style={{
          top: '100%',
          background: 'var(--card)',
          color: 'var(--foreground)',
          borderColor: 'var(--card-border)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {tooltip}
      </span>
    </span>
  </div>
);

export default InfoTooltip; 