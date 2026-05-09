import { createServerFn } from "@tanstack/react-start";
import { WORKER_BASE_URL } from "../config";

/**
 * Dashboard API client.
 *
 * Calls go through TanStack server functions so the DASHBOARD_TOKEN stays
 * on the server (read from process.env) and is never shipped in the
 * browser bundle. Components import `fetchSummary` / `fetchOrders` and call
 * them like normal async functions — the runtime turns each call into an
 * RPC to the server, which then talks to the Cloudflare Worker.
 */

async function callWorker(path: string) {
  const token = process.env.DASHBOARD_TOKEN ?? "";
  if (!token) {
    throw new Error(
      "DASHBOARD_TOKEN is not set on the server. Add it in backend secrets.",
    );
  }
  const res = await fetch(`${WORKER_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Worker request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const fetchSummary = createServerFn({ method: "GET" }).handler(
  async () => {
    return callWorker("/api/dashboard/summary");
  },
);

export const fetchOrders = createServerFn({ method: "GET" }).handler(
  async () => {
    const data = (await callWorker("/api/dashboard/orders?limit=50")) as {
      results?: unknown;
    };
    return data.results ?? [];
  },
);

export const fetchChats = createServerFn({ method: "GET" }).handler(
  async () => {
    const data = (await callWorker("/api/dashboard/chats?limit=100")) as {
      results?: unknown;
    };
    return (data.results ?? data ?? []) as unknown[];
  },
);

export const fetchChatMessages = createServerFn({ method: "GET" })
  .inputValidator((data: { wa_from: string }) => data)
  .handler(async ({ data }) => {
    const path = `/api/dashboard/chats/${encodeURIComponent(data.wa_from)}/messages?limit=200`;
    const res = (await callWorker(path)) as { results?: unknown };
    return (res.results ?? res ?? []) as unknown[];
  });
