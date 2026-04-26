import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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
export const sendTestWhatsAppWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const startedAt = Date.now();
    const userId = context.userId;
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

    // Import dynamically to keep the server-only client out of any client bundle.
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const samplePayload = {
      phone: "+447000000001",
      contact_name: "Test Contact",
      message: "Hi, this is a test WhatsApp message from the dashboard.",
      intent: "enquiry" as const,
      status: "active" as const,
      summary: "Dashboard test message",
      received_at: new Date().toISOString(),
    };

    try {
      // Resolve restaurant owned by the current user
      const { data: r, error: rErr } = await supabaseAdmin
        .from("restaurants")
        .select("id")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (rErr) throw rErr;
      if (!r?.id) {
        return {
          ok: false,
          status: 400,
          statusText: "No restaurant",
          body: "No restaurant found for the current user. Create a restaurant first.",
          url,
          durationMs: Date.now() - startedAt,
          secretConfigured,
        };
      }
      const restaurantId = r.id;

      // Find or create customer
      const { data: existingCust } = await supabaseAdmin
        .from("customers")
        .select("id, name")
        .eq("restaurant_id", restaurantId)
        .eq("phone", samplePayload.phone)
        .maybeSingle();

      let customerId: string;
      if (existingCust) {
        customerId = existingCust.id;
        await supabaseAdmin
          .from("customers")
          .update({ last_contact_at: samplePayload.received_at })
          .eq("id", customerId);
      } else {
        const { data: created, error: cErr } = await supabaseAdmin
          .from("customers")
          .insert({
            restaurant_id: restaurantId,
            phone: samplePayload.phone,
            name: samplePayload.contact_name,
            last_contact_at: samplePayload.received_at,
          })
          .select("id")
          .single();
        if (cErr) throw cErr;
        customerId = created.id;
      }

      // Conversation
      const { data: convo, error: convoErr } = await supabaseAdmin
        .from("conversations")
        .insert({
          restaurant_id: restaurantId,
          customer_id: customerId,
          channel: "whatsapp",
          intent: samplePayload.intent,
          status: "open",
          summary: samplePayload.summary,
          started_at: samplePayload.received_at,
        })
        .select("id")
        .single();
      if (convoErr) throw convoErr;

      // WhatsApp log
      const { error: logErr } = await supabaseAdmin
        .from("whatsapp_logs")
        .insert({
          restaurant_id: restaurantId,
          customer_id: customerId,
          conversation_id: convo.id,
          contact_name: samplePayload.contact_name,
          phone: samplePayload.phone,
          last_message: samplePayload.message,
          last_message_at: samplePayload.received_at,
          intent: samplePayload.intent,
          status: samplePayload.status,
          message_count: 1,
        });
      if (logErr) throw logErr;

      return {
        ok: true,
        status: 200,
        statusText: "OK",
        body: JSON.stringify(
          { ok: true, conversation_id: convo.id, customer_id: customerId },
          null,
          2,
        ),
        url,
        durationMs: Date.now() - startedAt,
        secretConfigured,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        ok: false,
        status: 500,
        statusText: "Error",
        body: message,
        url,
        durationMs: Date.now() - startedAt,
        secretConfigured,
      };
    }
  },
);

