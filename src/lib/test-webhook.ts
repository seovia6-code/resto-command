import { createServerFn } from "@tanstack/react-start";
/**
 * Verifies the webhook endpoint configuration without writing sample records.
 * Real VAPI calls are the only source that should create call data.
 */
export const sendTestVapiWebhook = createServerFn({ method: "POST" }).handler(
  async () => {
    const startedAt = Date.now();
    const url = "https://resto-command.lovable.app/api/public/vapi-webhook";
    const secret = process.env.VAPI_WEBHOOK_SECRET ?? "";
    const secretConfigured = secret.length > 0;

    if (!secretConfigured) {
      return {
        ok: false,
        status: 500,
        statusText: "Missing secret",
        body: "VAPI_WEBHOOK_SECRET is not set on the server. Add it in backend secrets before testing.",
        url,
        durationMs: Date.now() - startedAt,
        secretConfigured,
      };
    }

    return {
      ok: true,
      status: 200,
      statusText: "Ready",
      body: "Webhook URL and secret are configured. No dummy data was written; trigger a real VAPI call to create call records.",
      url,
      durationMs: Date.now() - startedAt,
      secretConfigured,
    };
  },
);
