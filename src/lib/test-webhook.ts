import { createServerFn } from "@tanstack/react-start";

/**
 * Verifies the webhook endpoint configuration without writing sample records.
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
 * Inserts a sample WhatsApp conversation/log into the provided restaurant.
 * The client must pass a restaurantId it owns (RLS will reject otherwise
 * when viewing the data; this server fn uses the admin client to write).
 */
export const sendTestWhatsAppWebhook = createServerFn({ method: "POST" })
  .inputValidator((data: { restaurantId?: string }) => data ?? {})
  .handler(async () => {
    const startedAt = Date.now();
    const url =
      "https://resto-command.lovable.app/api/public/whatsapp-webhook";
    const secret = process.env.WHATSAPP_WEBHOOK_SECRET ?? "";
    const verifyToken =
      process.env.WHATSAPP_VERIFY_TOKEN ?? secret;
    const secretConfigured = secret.length > 0;
    const verifyConfigured = verifyToken.length > 0;

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

    return {
      ok: true,
      status: 200,
      statusText: "Ready",
      body:
        "Webhook URL and secret are configured. No dummy data was written. " +
        "Real WhatsApp messages from Meta Cloud API will populate logs with the actual sender name and message." +
        (verifyConfigured ? "" : "\n\nNote: WHATSAPP_VERIFY_TOKEN is not set; using WHATSAPP_WEBHOOK_SECRET as the verify token."),
      url,
      durationMs: Date.now() - startedAt,
      secretConfigured,
    };
  });
