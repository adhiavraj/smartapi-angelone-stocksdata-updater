"use client";

import { useState } from "react";
import { Terminal, Trash2, Search, RefreshCw } from "lucide-react";
import { clearLogs as clearLogsApi } from "@/lib/api";

interface LogsTerminalProps {
  logs: string[];
  onRefresh: () => void;
}

export function LogsTerminal({ logs, onRefresh }: LogsTerminalProps) {
  const [filter, setFilter] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const filteredLogs = logs.filter((log) =>
    log.toLowerCase().includes(filter.toLowerCase())
  );

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await clearLogsApi();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="shadcn-panel p-5 md:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Activity & Console Event Logs
            </h2>
            <p className="text-xs text-zinc-400">
              Audit log of API calls, SmartAPI requests, and Excel modifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            disabled={isClearing || logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium text-xs transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-zinc-950 rounded-md p-4 border border-zinc-800 font-mono text-xs text-zinc-300 max-h-72 overflow-y-auto space-y-1">
        {filteredLogs.length === 0 ? (
          <div className="text-zinc-600 text-center py-6 font-sans text-xs">
            No activity logs recorded yet.
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const isError = log.toLowerCase().includes("error") || log.toLowerCase().includes("failed");
            const isSuccess = log.toLowerCase().includes("success") || log.toLowerCase().includes("connected");

            return (
              <div
                key={idx}
                className={`py-0.5 px-2 rounded-md flex items-start gap-2 ${
                  isError
                    ? "text-rose-400 bg-rose-950/20"
                    : isSuccess
                    ? "text-emerald-400"
                    : "text-zinc-300"
                }`}
              >
                <span className="text-zinc-600 shrink-0 select-none">&gt;</span>
                <span className="break-all">{log}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
