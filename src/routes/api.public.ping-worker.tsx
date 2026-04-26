import { createFileRoute } from "@tanstack/react-router";

const WORKER_BASE_URL =
  "https://whatsapp-vapi-bridge.amitoffical17.workers.dev";

export const Route = createFileRoute("/api/public/ping-worker")({
  server: {
    handlers: {
      GET: async () => {
        const token = process.env.DASHBOARD_TOKEN ?? "";
        if (!token) {
          return new Response(
            JSON.stringify({
              ok: false,
              configured: false,
              message: "DASHBOARD_TOKEN not set on backend",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const url = `${WORKER_BASE_URL}/api/vapi-webhook`;
        const startedAt = Date.now();
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ping: true }),
          });
          const text = await res.text();
          return new Response(
            JSON.stringify({
              ok: res.ok,
              configured: true,
              status: res.status,
              statusText: res.statusText,
              body: text,
              url,
              durationMs: Date.now() - startedAt,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              ok: false,
              configured: true,
              status: 0,
              statusText: "Network error",
              body: err instanceof Error ? err.message : String(err),
              url,
              durationMs: Date.now() - startedAt,
            }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
