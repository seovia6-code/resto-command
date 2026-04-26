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

/**
 * Sends a sample WhatsApp message payload to the public WhatsApp webhook
 * using the configured shared secret. Useful for verifying the endpoint
 * end-to-end (auth + insert flow) from the Webhooks page.
 */
export const sendTestWhatsAppWebhook = createServerFn({ method: "POST" }).handler(
  async () => {
    const startedAt = Date.now();
    const url =
      "https://resto-command.lovable.app/api/public/whatsapp-webhook";
    const secret = process.env.WHATSAPP_WEBHOOK_SECRET ?? "";
    const secretConfigured = secret.length > 0;

    if (!secretConfigured) {
      return {
        ok: false,
        status: 500,
        statusText: "Missing secret",
        body: "WHATSAPP_WEBHOOK_SECRET is not set on the server. Add it in backend secrets before testing.",
        url,
        durationMs: Date.now() - startedAt,
        secretConfigured,
      };
    }

    const samplePayload = {
      phone: "+447000000001",
      contact_name: "Test Contact",
      message: "Hi, this is a test WhatsApp message from the dashboard.",
      intent: "enquiry",
      status: "active",
      summary: "Dashboard test message",
      received_at: new Date().toISOString(),
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-whatsapp-secret": secret,
        },
        body: JSON.stringify(samplePayload),
      });
      const text = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        body: text,
        url,
        durationMs: Date.now() - startedAt,
        secretConfigured,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        ok: false,
        status: 0,
        statusText: "Network error",
        body: message,
        url,
        durationMs: Date.now() - startedAt,
        secretConfigured,
      };
    }
  },
);

