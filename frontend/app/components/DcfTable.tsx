import React from "react";
import { CashFlowRow } from "@/types/cashflow";
import { getNumberColor } from "@/lib/utils";

interface DcfTableProps {
  rows: CashFlowRow[];
  className?: string;
  title?: string;
}

function renderCell(value: number, colorFn: (n: number) => string) {
  return (
    <span className="font-bold" style={{ color: colorFn(value) }}>
      {value > 0
        ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : value < 0
        ? `-${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        : "0"}
    </span>
  );
}

export default function DcfTable({ rows, className = "", title }: DcfTableProps) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 mb-8 relative ${className}`}>
      {title && <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 px-4 text-left">Year</th>
              <th className="py-2 px-4 text-right">Gross Rent (£)</th>
              <th className="py-2 px-4 text-right">Vacancy Loss (£)</th>
              <th className="py-2 px-4 text-right">Effective Rent (£)</th>
              <th className="py-2 px-4 text-right">Operating Expenses (£)</th>
              <th className="py-2 px-4 text-right">NOI (£)</th>
              <th className="py-2 px-4 text-right">CapEx (£)</th>
              <th className="py-2 px-4 text-right">Net Cash Flow (£)</th>
              <th className="py-2 px-4 text-right">Discount Factor</th>
              <th className="py-2 px-4 text-right">Present Value (£)</th>
              <th className="py-2 px-4 text-right">Cumulative PV (£)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.year}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="py-2 px-4">{row.year}</td>
                <td className="py-2 px-4 text-right">
                  {renderCell(row.gross_rent, getNumberColor)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(-row.vacancy_loss, getNumberColor)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(row.effective_rent, getNumberColor)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(-row.operating_expenses, getNumberColor)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(row.noi, getNumberColor)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(-row.capex, getNumberColor)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(row.net_cash_flow, getNumberColor)}
                </td>
                <td className="py-2 px-4 text-right">
                  <span
                    className="font-bold"
                    style={{
                      color:
                        Number(row.discount_factor) === 0 ||
                        Object.is(row.discount_factor, -0)
                          ? "#6B7280"
                          : undefined,
                    }}
                  >
                    {Number(row.discount_factor) === 0 ||
                    Object.is(row.discount_factor, -0)
                      ? "0"
                      : row.discount_factor.toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}
                  </span>
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(row.present_value, getNumberColor)}
                </td>
                <td className="py-2 px-4 text-right">
                  {renderCell(row.cumulative_pv, getNumberColor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 