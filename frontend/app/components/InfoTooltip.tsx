import React from "react";

interface InfoTooltipProps {
  label: React.ReactNode;
  tooltip: React.ReactNode;
  className?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  label,
  tooltip,
  className = "",
}) => (
  <span className={`relative group inline-flex items-center ${className}`}>
    <span className="cursor-pointer inline-block">{label}</span>
    <span
      className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none text-sm rounded-lg px-5 py-3 shadow-xl max-w-2xl min-w-[300px] border bg-gray-900 text-white"
      style={{
        top: "100%",
        borderColor: "var(--card-border)",
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
    >
      {tooltip}
    </span>
  </span>
);

export default InfoTooltip;
