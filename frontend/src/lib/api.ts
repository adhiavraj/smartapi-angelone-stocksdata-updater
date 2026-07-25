const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface StatusResponse {
  is_connected: boolean;
  client_id: string;
  public_ip: string;
  excel_exists: boolean;
  excel_path: string;
}

export interface BankSummary {
  Sheet: string;
  Symbol: string;
  "Last Date": string;
  "Last Close": number | string;
  CMP: number | string;
  Beta: number | string;
  "VAR 90%": string;
  "VAR (Rs)": number | string;
  "Last Row": number;
}

export interface ConnectPayload {
  api_key: string;
  client_id: string;
  password: string;
  totp_type: string;
  totp_secret?: string;
  manual_totp?: string;
}

export interface UpdatePayload {
  mode: "live" | "demo";
  from_date?: string;
  to_date?: string;
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function connectSmartApi(payload: ConnectPayload) {
  const res = await fetch(`${API_BASE}/api/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Authentication failed");
  return data;
}

export async function disconnectSmartApi() {
  const res = await fetch(`${API_BASE}/api/disconnect`, { method: "POST" });
  return res.json();
}

export async function fetchSummary(): Promise<BankSummary[]> {
  const res = await fetch(`${API_BASE}/api/summary`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch summary");
  return data.data || [];
}

export async function triggerUpdate(payload: UpdatePayload) {
  const res = await fetch(`${API_BASE}/api/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Update execution failed");
  return data;
}

export async function fetchLogs(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/logs`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.logs || [];
}

export async function clearLogs() {
  const res = await fetch(`${API_BASE}/api/logs`, { method: "DELETE" });
  return res.json();
}

export function getDownloadUrl(): string {
  return `${API_BASE}/api/download`;
}
