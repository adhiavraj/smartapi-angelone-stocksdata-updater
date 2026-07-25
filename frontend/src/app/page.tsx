"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/dashboard/Header";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { StockTable } from "@/components/dashboard/StockTable";
import { UpdateControl } from "@/components/dashboard/UpdateControl";
import { GuideCard } from "@/components/dashboard/GuideCard";
import { LogsTerminal } from "@/components/dashboard/LogsTerminal";
import { ApiModal } from "@/components/dashboard/ApiModal";
import { 
  fetchStatus, 
  fetchSummary, 
  fetchLogs, 
  StatusResponse, 
  BankSummary 
} from "@/lib/api";

export default function Home() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [summary, setSummary] = useState<BankSummary[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const loadAllData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const [statusRes, summaryRes, logsRes] = await Promise.allSettled([
        fetchStatus(),
        fetchSummary(),
        fetchLogs(),
      ]);

      if (statusRes.status === "fulfilled") setStatus(statusRes.value);
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
      if (logsRes.status === "fulfilled") setLogs(logsRes.value);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    // Auto-poll status and logs every 10 seconds
    const interval = setInterval(() => {
      loadAllData();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Top Header Navigation */}
      <Header
        status={status}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onRefresh={() => loadAllData(true)}
        isRefreshing={isRefreshing}
      />

      {/* Top 4 Metrics Tiles */}
      <MetricsOverview summary={summary} isLoading={isLoading} />

      {/* Main Stock Data Grid Table */}
      <StockTable summary={summary} isLoading={isLoading} />

      {/* Fetch & Update Action Panel */}
      <UpdateControl
        isConnected={status?.is_connected || false}
        onUpdateSuccess={() => loadAllData(true)}
      />

      {/* Developer Portal Guide */}
      <GuideCard publicIp={status?.public_ip || "127.0.0.1"} />

      {/* Activity Logs Console */}
      <LogsTerminal logs={logs} onRefresh={() => loadAllData(true)} />

      {/* Credentials Modal */}
      <ApiModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        status={status}
        onStatusChange={() => loadAllData(true)}
      />

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-500 border-t border-slate-900 mt-12">
        SmartAPI Bank Nifty VAR Excel Updater • Next.js & Tailwind CSS v4 & FastAPI Backend
      </footer>
    </main>
  );
}
