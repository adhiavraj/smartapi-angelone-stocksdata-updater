"use client";

import { useState } from "react";
import { X, Key, ShieldCheck, LogOut, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { connectSmartApi, disconnectSmartApi, StatusResponse } from "@/lib/api";

interface ApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: StatusResponse | null;
  onStatusChange: () => void;
}

export function ApiModal({ isOpen, onClose, status, onStatusChange }: ApiModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [clientId, setClientId] = useState(status?.client_id || "");
  const [password, setPassword] = useState("");
  const [totpType, setTotpType] = useState<"auto" | "manual">("auto");
  const [totpSecret, setTotpSecret] = useState("");
  const [manualTotp, setManualTotp] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMessage(null);

    try {
      const data = await connectSmartApi({
        api_key: apiKey,
        client_id: clientId,
        password: password,
        totp_type: totpType === "auto" ? "TOTP Secret (Auto)" : "Manual TOTP Code",
        totp_secret: totpSecret,
        manual_totp: manualTotp,
      });

      setSuccessMessage(data.message);
      onStatusChange();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "SmartAPI Login Failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await disconnectSmartApi();
      onStatusChange();
      setSuccessMessage("Disconnected from SmartAPI.");
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setErrorMsg("Failed to disconnect.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-950 w-full max-w-lg rounded-md p-6 border border-zinc-800 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">SmartAPI Authentication</h3>
              <p className="text-xs text-zinc-400">Angel One Login & TOTP Credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status info */}
        {status?.is_connected && (
          <div className="mb-4 p-3 rounded-md bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between text-xs text-emerald-300 font-medium">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Connected as Client ID: <strong className="text-white">{status.client_id}</strong>
            </span>
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-md bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 font-semibold border border-rose-800/60 text-[11px] flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3 h-3" /> Disconnect
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleConnect} className="space-y-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              SmartAPI Key
            </label>
            <input
              type="password"
              placeholder="e.g. your_smartapi_key_str"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                Client ID / User ID
              </label>
              <input
                type="text"
                placeholder="e.g. A12345"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                PIN / Password
              </label>
              <input
                type="password"
                placeholder="Account PIN"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {/* TOTP Selection */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1.5">
              TOTP Method
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setTotpType("auto")}
                className={`py-1.5 px-3 rounded-md border text-center font-medium transition-colors ${
                  totpType === "auto"
                    ? "bg-zinc-800 border-zinc-600 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                TOTP Secret (Auto)
              </button>
              <button
                type="button"
                onClick={() => setTotpType("manual")}
                className={`py-1.5 px-3 rounded-md border text-center font-medium transition-colors ${
                  totpType === "manual"
                    ? "bg-zinc-800 border-zinc-600 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Manual 6-Digit TOTP
              </button>
            </div>

            {totpType === "auto" ? (
              <input
                type="password"
                placeholder="32-character TOTP Secret Key"
                value={totpSecret}
                onChange={(e) => setTotpSecret(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            ) : (
              <input
                type="text"
                maxLength={6}
                placeholder="Current 6-digit TOTP code"
                value={manualTotp}
                onChange={(e) => setManualTotp(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono text-center tracking-widest"
              />
            )}
          </div>

          {/* Feedback */}
          {successMessage && (
            <div className="p-3 rounded-md bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-950/40 border border-rose-800/50 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Connect API</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
