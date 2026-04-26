import { createServerFn } from "@tanstack/react-start";

/**
 * Pings the VAPI webhook endpoint with a minimal test payload, including the
 * server-side x-vapi-secret header so the request passes signature validation.
 * Returns the HTTP status and a short body excerpt for display in the UI.
 */
export const sendTestVapiWebhook = createServerFn({ method: "POST" }).handler(
  async () => {
    const url =
      process.env.VAPI_WEBHOOK_URL ??
      "https://resto-command.lovable.app/api/public/vapi-webhook";
    const secret = process.env.VAPI_WEBHOOK_SECRET ?? "";

    const payload = {
      test: true,
      phone: "+10000000000",
      caller_name: "Webhook Test",
      intent: "enquiry" as const,
      outcome: "resolved" as const,
      duration_seconds: 1,
      transcript: "This is a test ping from the dashboard.",
      summary: "Test ping",
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
    };

    const startedAt = Date.now();
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vapi-secret": secret,
        },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        body: text.slice(0, 500),
        url,
        durationMs: Date.now() - startedAt,
        secretConfigured: secret.length > 0,
      };
    } catch (err) {
      return {
        ok: false,
        status: 0,
        statusText: "Network error",
        body: err instanceof Error ? err.message : String(err),
        url,
        durationMs: Date.now() - startedAt,
        secretConfigured: secret.length > 0,
      };
    }
  },
);
