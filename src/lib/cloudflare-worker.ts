import { createServerFn } from "@tanstack/react-start";

/**
 * Cloudflare Worker bridge.
 *
 * Lovable (server-side) forwards requests to the Worker, attaching the
 * shared `DASHBOARD_TOKEN` as a Bearer token. The same token must be set
 * as a Worker secret on Cloudflare so the Worker can validate the caller.
 */
const WORKER_BASE_URL =
  "https://whatsapp-vapi-bridge.amitoffical17.workers.dev";

const PROTECTED_PATHS = [
  "/api/vapi-webhook",
  "/api/whatsapp-webhook",
] as const;

type ProtectedPath = (typeof PROTECTED_PATHS)[number];

async function callWorker(
  path: ProtectedPath,
  body: unknown,
  method: "POST" | "GET" = "POST",
) {
  const token = process.env.DASHBOARD_TOKEN ?? "";
  if (!token) {
    return {
      ok: false,
      status: 500,
      statusText: "Missing secret",
      body: "DASHBOARD_TOKEN is not set on the server. Add it in backend secrets.",
      url: `${WORKER_BASE_URL}${path}`,
    };
  }

  const url = `${WORKER_BASE_URL}${path}`;
  const startedAt = Date.now();

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: method === "GET" ? undefined : JSON.stringify(body ?? {}),
    });

    const text = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      body: text,
      url,
      durationMs: Date.now() - startedAt,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusText: "Network error",
      body: err instanceof Error ? err.message : String(err),
      url,
      durationMs: Date.now() - startedAt,
    };
  }
}

/** Forward a payload to the Worker's /api/vapi-webhook endpoint. */
export const callWorkerVapiWebhook = createServerFn({ method: "POST" })
  .inputValidator((data: { payload?: unknown }) => data ?? {})
  .handler(async ({ data }) => {
    return callWorker("/api/vapi-webhook", data.payload ?? {});
  });

/** Forward a payload to the Worker's /api/whatsapp-webhook endpoint. */
export const callWorkerWhatsAppWebhook = createServerFn({ method: "POST" })
  .inputValidator((data: { payload?: unknown }) => data ?? {})
  .handler(async ({ data }) => {
    return callWorker("/api/whatsapp-webhook", data.payload ?? {});
  });

/** Lightweight ping used by the dashboard to confirm both sides share the token. */
export const pingCloudflareWorker = createServerFn({ method: "POST" }).handler(
  async () => {
    const token = process.env.DASHBOARD_TOKEN ?? "";
    if (!token) {
      return {
        ok: false,
        configured: false,
        message:
          "DASHBOARD_TOKEN is missing on the Lovable backend. Add it in backend secrets.",
      };
    }
    // Hit the vapi endpoint with an empty body just to verify auth wiring.
    const res = await callWorker("/api/vapi-webhook", { ping: true });
    return {
      ok: res.ok,
      configured: true,
      status: res.status,
      statusText: res.statusText,
      body: res.body,
      url: res.url,
    };
  },
);
