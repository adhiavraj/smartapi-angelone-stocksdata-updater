"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown, Table as TableIcon } from "lucide-react";
import { BankSummary } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface StockTableProps {
  summary: BankSummary[];
  isLoading: boolean;
}

type SortField = "Sheet" | "Symbol" | "Last Close" | "CMP" | "Beta" | "VAR (Rs)";

export function StockTable({ summary, isLoading }: StockTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("Sheet");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredAndSorted = useMemo(() => {
    return summary
      .filter((item) => {
        const q = search.toLowerCase();
        return (
          item.Sheet.toLowerCase().includes(q) ||
          item.Symbol.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === "number" && typeof valB === "number") {
          return sortAsc ? valA - valB : valB - valA;
        }

        const strA = String(valA);
        const strB = String(valB);
        return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
  }, [summary, search, sortField, sortAsc]);

  return (
    <div className="shadcn-panel p-5 md:p-6 mb-6">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-zinc-400" />
            Banking Stocks VAR Summary
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Spreadsheet indicators, Value at Risk (VAR @ 90%), and Beta metrics.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Filter bank or symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-zinc-800 bg-zinc-950/60">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-medium uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("Sheet")}>
                <div className="flex items-center gap-1.5">
                  Bank Name <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("Symbol")}>
                <div className="flex items-center gap-1.5">
                  NSE Symbol <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                </div>
              </th>
              <th className="py-3 px-4">Last Date</th>
              <th className="py-3 px-4 cursor-pointer hover:text-white text-right" onClick={() => handleSort("Last Close")}>
                <div className="flex items-center justify-end gap-1.5">
                  Last Close <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white text-right" onClick={() => handleSort("CMP")}>
                <div className="flex items-center justify-end gap-1.5">
                  CMP (Current) <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white text-right" onClick={() => handleSort("Beta")}>
                <div className="flex items-center justify-end gap-1.5">
                  Beta vs Index <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">VAR 90%</th>
              <th className="py-3 px-4 cursor-pointer hover:text-white text-right" onClick={() => handleSort("VAR (Rs)")}>
                <div className="flex items-center justify-end gap-1.5">
                  VAR in Rs <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono text-white">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-zinc-500 font-sans">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    <span>Loading workbook data...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-500 font-sans">
                  No matching bank records found.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((item, idx) => {
                return (
                  <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                    {/* Bank Name */}
                    <td className="py-3 px-4 font-sans font-medium text-white">
                      {item.Sheet}
                    </td>

                    {/* Symbol */}
                    <td className="py-3 px-4 text-zinc-400">
                      <span className="bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 text-[11px]">
                        {item.Symbol}
                      </span>
                    </td>

                    {/* Last Date */}
                    <td className="py-3 px-4 text-zinc-400">{item["Last Date"]}</td>

                    {/* Last Close */}
                    <td className="py-3 px-4 text-right text-zinc-300">
                      {formatCurrency(item["Last Close"])}
                    </td>

                    {/* CMP */}
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      {formatCurrency(item.CMP)}
                    </td>

                    {/* Beta */}
                    <td className="py-3 px-4 text-right text-zinc-300">
                      <span className="bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 text-[11px]">
                        {item.Beta}
                      </span>
                    </td>

                    {/* VAR 90% */}
                    <td className="py-3 px-4 text-right text-zinc-200">
                      {item["VAR 90%"]}
                    </td>

                    {/* VAR Rs */}
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      {formatCurrency(item["VAR (Rs)"])}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
