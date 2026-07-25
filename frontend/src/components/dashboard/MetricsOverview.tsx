"use client";

import { Landmark, Calendar, Layers, Activity } from "lucide-react";
import { BankSummary } from "@/lib/api";

interface MetricsOverviewProps {
  summary: BankSummary[];
  isLoading: boolean;
}

export function MetricsOverview({ summary, isLoading }: MetricsOverviewProps) {
  const bankCount = summary.length || 14;
  const latestDate = summary.length > 0 ? summary[0]["Last Date"] : "-";
  const totalRows = summary.length > 0 ? summary[0]["Last Row"] : "-";

  const cards = [
    {
      title: "Banking Stocks Tracked",
      value: isLoading ? "..." : bankCount,
      subtitle: "Full Nifty Bank Sector",
      icon: Landmark,
    },
    {
      title: "Latest Date in Sheet",
      value: isLoading ? "..." : latestDate,
      subtitle: "Most Recent Close Data",
      icon: Calendar,
    },
    {
      title: "Total Rows per Sheet",
      value: isLoading ? "..." : totalRows,
      subtitle: "Historical Market Days",
      icon: Layers,
    },
    {
      title: "Benchmark Index",
      value: "Nifty Bank",
      subtitle: "NSE Sector Index",
      icon: Activity,
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="shadcn-panel p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl font-bold tracking-tight text-white mb-1">
              {card.value}
            </div>

            <div className="text-xs text-zinc-500 font-normal">
              {card.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
