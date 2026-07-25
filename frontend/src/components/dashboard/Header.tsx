"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  Wifi, 
  WifiOff, 
  Globe, 
  Key, 
  Download, 
  Copy, 
  Check, 
  RefreshCw 
} from "lucide-react";
import { StatusResponse, getDownloadUrl } from "@/lib/api";

interface HeaderProps {
  status: StatusResponse | null;
  onOpenAuthModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({ status, onOpenAuthModal, onRefresh, isRefreshing }: HeaderProps) {
  const [copiedIp, setCopiedIp] = useState(false);

  const handleCopyIp = () => {
    if (status?.public_ip) {
      navigator.clipboard.writeText(status.public_ip);
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    }
  };

  return (
    <header className="shadcn-panel p-5 md:p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Title & Description */}
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-md text-white shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                SmartAPI Bank Nifty VAR Updater
              </h1>
              <span className="px-2 py-0.5 text-xs font-mono rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
                v2.0
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Automated Angel One SmartAPI daily candle fetcher & formula calculator for <code className="text-zinc-200 font-mono text-[11px] bg-zinc-900 px-1.5 py-0.5 rounded-md border border-zinc-800">Bank Nifty VAR-Final.xlsx</code>.
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* IP Card */}
          <button
            onClick={handleCopyIp}
            title="Click to copy public IP"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>IP: <strong className="text-white">{status?.public_ip || "Loading..."}</strong></span>
            {copiedIp ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-500" />
            )}
          </button>

          {/* Connection Status Badge (Accent Color Used Here) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-medium">
            {status?.is_connected ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" /> API Connected
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                <span className="text-amber-400 font-medium flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5" /> Disconnected
                </span>
              </>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh metrics & status"
            className="p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-white" : ""}`} />
          </button>

          {/* API Auth Modal Button (Shadcn Primary Style) */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Credentials</span>
          </button>

          {/* Download Workbook Button */}
          <a
            href={getDownloadUrl()}
            download="Bank_Nifty_VAR_Updated.xlsx"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-medium text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Download Excel</span>
          </a>
        </div>
      </div>
    </header>
  );
}
