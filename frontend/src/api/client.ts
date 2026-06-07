const BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) || "http://127.0.0.1:8000";

export const API_BASE = BASE;
export const SNIPPET_ORIGIN =
  (import.meta.env.VITE_SNIPPET_ORIGIN as string | undefined) || BASE;

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      detail = j.detail || JSON.stringify(j);
    } catch {}
    throw new Error(detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type UIChangeItem = {
  modHeight?: string;
  modWidth?: string;
  modColor?: string;
  selector: string;
  element_type: string;
  element_text: string;
  change_type: string;
  value_a: string;
  value_b: string;
};

export type Experiment = {
  id: number;
  site_id: number;
  name: string;
  algorithm: string;
  expected_cr: number;
  status: string;
};

export type Analytics = {
  experiment_name: string;
  status: string;
  expected_cr: number;
  algorithm: string;
  variants: {
    A: { views: number; clicks: number; cr: number };
    B: { views: number; clicks: number; cr: number };
  };
  statistics: { p_value: number; significant: boolean; lift: number };
  devices: {         
    Desktop: { A: number; B: number };
    Mobile: { A: number; B: number };
    Tablet: { A: number; B: number };
  };
};

export type ParsedElement = { text: string; selector: string; type: string };

export const api = {
  listExperiments: () => request<Experiment[]>("/experiments"),
  createExperiment: (body: {
    name: string;
    algorithm: string;
    expected_cr: number;
    status: string;
    changes: UIChangeItem[];
  }) =>
    request<Experiment>("/experiments", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteExperiment: (id: number) =>
    request<{ status: string }>(`/experiments/${id}`, { method: "DELETE" }),
  updateStatus: (id: number, status: string) =>
    request<{ status: string; new_status: string }>(
      `/experiments/${id}/status?status=${encodeURIComponent(status)}`,
      { method: "PUT" }
    ),
  analytics: (name: string) =>
    request<Analytics>(`/analytics?experiment_name=${encodeURIComponent(name)}`),
  exportCsvUrl: (name: string) =>
    `${BASE}/export_csv?experiment_name=${encodeURIComponent(name)}`,
  parseElements: (url: string) =>
    request<{ url: string; elements: ParsedElement[] }>(
      `/parse_elements?url=${encodeURIComponent(url)}`
    ),
};
