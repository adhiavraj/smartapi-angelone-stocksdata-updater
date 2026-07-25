"use client";

import { useState } from "react";
import { BookOpen, Copy, Check, Info } from "lucide-react";

interface GuideCardProps {
  publicIp: string;
}

export function GuideCard({ publicIp }: GuideCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const portalFields = [
    { label: "App Name", value: "SmartExcelUpdater" },
    { label: "Redirect URL", value: "http://127.0.0.1:5000/callback" },
    { label: "Post back URL (Optional)", value: "http://127.0.0.1:5000/postback" },
    { label: "Primary Static IP", value: publicIp || "127.0.0.1" },
    { label: "Secondary Static IP (Optional)", value: "Leave Empty" },
  ];

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="shadcn-panel p-5 md:p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            SmartAPI Portal Registration Guide
          </h2>
          <p className="text-xs text-zinc-400">
            Form values for creating an app on{" "}
            <a
              href="https://smartapi.angelone.in"
              target="_blank"
              rel="noreferrer"
              className="text-white underline font-medium"
            >
              smartapi.angelone.in
            </a>
          </p>
        </div>
      </div>

      {/* Field Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {portalFields.map((field, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-md bg-zinc-950 border border-zinc-800"
          >
            <div>
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                {field.label}
              </div>
              <div className="font-mono text-xs text-white font-semibold mt-0.5">
                {field.value}
              </div>
            </div>

            {field.value !== "Leave Empty" && (
              <button
                onClick={() => handleCopy(field.label, field.value)}
                className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800"
                title="Copy value"
              >
                {copiedKey === field.label ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* IP Note Callout */}
      <div className="p-3.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white font-semibold">Primary Static IP Notice:</strong> SmartAPI validates API requests against your static IP (<code className="font-mono text-white font-bold">{publicIp}</code>). If your IP changes, update the Primary Static IP field in the SmartAPI portal dashboard.
        </div>
      </div>
    </div>
  );
}
