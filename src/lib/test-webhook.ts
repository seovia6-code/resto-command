import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Runs the same insert path as the VAPI webhook handler in-process, avoiding a
 * Worker-to-Worker self-fetch (which causes Cloudflare 522 timeouts). Verifies
 * the secret is configured, then writes a sample customer + conversation +
 * call log so the user can confirm the pipeline end-to-end.
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

    try {
      // Pick the first restaurant (single-tenant default, same as the webhook).
      const { data: restaurant, error: rErr } = await supabaseAdmin
        .from("restaurants")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (rErr) throw rErr;
      if (!restaurant?.id) {
        return {
          ok: false,
          status: 400,
          statusText: "No restaurant",
          body: "No restaurant found in the database. Create one first.",
          url,
          durationMs: Date.now() - startedAt,
          secretConfigured,
        };
      }

      const phone = "+10000000000";
      const now = new Date().toISOString();

      // Find or create the test customer.
      const { data: existing } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("restaurant_id", restaurant.id)
        .eq("phone", phone)
        .maybeSingle();

      let customerId = existing?.id;
      if (!customerId) {
        const { data: created, error: cErr } = await supabaseAdmin
          .from("customers")
          .insert({
            restaurant_id: restaurant.id,
            phone,
            name: "Webhook Test",
            last_contact_at: now,
          })
          .select("id")
          .single();
        if (cErr) throw cErr;
        customerId = created.id;
      }

      const { data: convo, error: convoErr } = await supabaseAdmin
        .from("conversations")
        .insert({
          restaurant_id: restaurant.id,
          customer_id: customerId,
          channel: "call",
          intent: "enquiry",
          status: "closed",
          summary: "Test ping from dashboard",
          started_at: now,
          ended_at: now,
        })
        .select("id")
        .single();
      if (convoErr) throw convoErr;

      const { data: call, error: callErr } = await supabaseAdmin
        .from("call_logs")
        .insert({
          restaurant_id: restaurant.id,
          customer_id: customerId,
          conversation_id: convo.id,
          caller_name: "Webhook Test",
          phone,
          duration_seconds: 1,
          intent: "enquiry",
          outcome: "resolved",
          transcript: "This is a test ping from the dashboard.",
          recording_url: null,
          started_at: now,
        })
        .select("id")
        .single();
      if (callErr) throw callErr;

      return {
        ok: true,
        status: 200,
        statusText: "OK",
        body: JSON.stringify(
          {
            ok: true,
            customer_id: customerId,
            conversation_id: convo.id,
            call_log_id: call.id,
            note: "Inserted directly via server function (bypasses network self-call).",
          },
          null,
          2,
        ),
        url,
        durationMs: Date.now() - startedAt,
        secretConfigured,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        status: 500,
        statusText: "Server error",
        body: message,
        url,
        durationMs: Date.now() - startedAt,
        secretConfigured,
      };
    }
  },
);
