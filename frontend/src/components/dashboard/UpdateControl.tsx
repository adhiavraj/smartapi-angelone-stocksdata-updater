"use client";

import { useState } from "react";
import { 
  Zap, 
  Play, 
  Download, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from "lucide-react";
import { triggerUpdate, getDownloadUrl } from "@/lib/api";

interface UpdateControlProps {
  isConnected: boolean;
  onUpdateSuccess: () => void;
}

export function UpdateControl({ isConnected, onUpdateSuccess }: UpdateControlProps) {
  const [mode, setMode] = useState<"live" | "demo">(isConnected ? "live" : "demo");
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 5);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatesLog, setUpdatesLog] = useState<string[]>([]);

  const handleExecute = async () => {
    setIsUpdating(true);
    setResultMessage(null);
    setErrorMessage(null);
    setUpdatesLog([]);

    try {
      const data = await triggerUpdate({
        mode,
        from_date: fromDate,
        to_date: toDate,
      });

      setResultMessage(data.message);
      if (data.updates && Array.isArray(data.updates)) {
        setUpdatesLog(data.updates);
      }
      onUpdateSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "Execution update failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="shadcn-panel p-5 md:p-6 mb-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            Fetch & Update Excel Data
          </h2>
          <p className="text-xs text-zinc-400">
            Fetch candle close data from SmartAPI or execute demo simulation mode to evaluate formulas.
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {/* Live Mode Card */}
        <div
          onClick={() => setMode("live")}
          className={`cursor-pointer rounded-md p-4 border transition-all ${
            mode === "live"
              ? "bg-zinc-900 border-zinc-500"
              : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              🚀 Live SmartAPI Market Data
            </span>
            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md ${isConnected ? "bg-emerald-950 border border-emerald-800 text-emerald-400" : "bg-amber-950 border border-amber-800 text-amber-400"}`}>
              {isConnected ? "Ready" : "Login Required"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Fetch daily candle close prices directly from Angel One SmartAPI and update Excel formulas automatically.
          </p>
        </div>

        {/* Demo Mode Card */}
        <div
          onClick={() => setMode("demo")}
          className={`cursor-pointer rounded-md p-4 border transition-all ${
            mode === "demo"
              ? "bg-zinc-900 border-zinc-500"
              : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              🎲 Demo Simulation Mode
            </span>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
              Offline Test
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Generate synthetic tick prices to simulate appending a new date row into the Excel workbook instantly.
          </p>
        </div>
      </div>

      {/* Date Pickers (Live Mode) */}
      {mode === "live" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 bg-zinc-950 p-4 rounded-md border border-zinc-800">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" /> From Date (Historical)
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" /> To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>
      )}

      {/* Execute Button */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleExecute}
          disabled={isUpdating}
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-colors disabled:opacity-50"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating Excel Workbook...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Execute Fetch & Update Excel</span>
            </>
          )}
        </button>

        <a
          href={getDownloadUrl()}
          download="Bank_Nifty_VAR_Updated.xlsx"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-medium text-xs transition-colors"
        >
          <Download className="w-4 h-4 text-zinc-400" />
          <span>Download Updated Workbook</span>
        </a>
      </div>

      {/* Execution Feedback Alerts */}
      {resultMessage && (
        <div className="mt-5 p-4 rounded-md bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs">
          <div className="flex items-center gap-2 font-semibold mb-1 text-sm text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            {resultMessage}
          </div>
          {updatesLog.length > 0 && (
            <ul className="list-disc list-inside mt-2 space-y-1 font-mono text-[11px] text-emerald-200/80">
              {updatesLog.slice(0, 5).map((log, i) => (
                <li key={i}>{log}</li>
              ))}
              {updatesLog.length > 5 && <li>...and {updatesLog.length - 5} more updates</li>}
            </ul>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="mt-5 p-4 rounded-md bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-400 mb-0.5">Execution Failed</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}
    </div>
  );
}
