import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Whatsapp-Secret, X-Restaurant-Id',
} as const;

// --- Meta WhatsApp Cloud API payload types ---
interface MetaWaMessage {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
  image?: { caption?: string };
  video?: { caption?: string };
  document?: { caption?: string; filename?: string };
}
interface MetaWaContact {
  wa_id?: string;
  profile?: { name?: string };
}
interface MetaWaValue {
  messaging_product?: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: MetaWaContact[];
  messages?: MetaWaMessage[];
}
interface MetaWaPayload {
  object?: string;
  entry?: Array<{ id?: string; changes?: Array<{ value?: MetaWaValue; field?: string }> }>;
}

function extractMetaMessage(body: unknown): {
  isMeta: boolean;
  messageId?: string;
  from?: string;
  contactName?: string;
  text?: string;
  timestamp?: string;
  type?: string;
} {
  const b = body as MetaWaPayload;
  if (!b || b.object !== 'whatsapp_business_account') return { isMeta: false };
  const value = b.entry?.[0]?.changes?.[0]?.value;
  const msg = value?.messages?.[0];
  if (!msg) return { isMeta: true };
  const contact = value?.contacts?.[0];
  const text =
    msg.text?.body ??
    msg.button?.text ??
    msg.interactive?.button_reply?.title ??
    msg.interactive?.list_reply?.title ??
    msg.image?.caption ??
    msg.video?.caption ??
    msg.document?.caption ??
    msg.document?.filename ??
    `[${msg.type ?? 'message'}]`;
  return {
    isMeta: true,
    messageId: msg.id,
    from: msg.from ?? contact?.wa_id,
    contactName: contact?.profile?.name,
    text,
    timestamp: msg.timestamp,
    type: msg.type,
  };
}


function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

type CallIntent = 'booking' | 'order' | 'enquiry' | 'complaint' | 'other';
type ChatStatus = 'active' | 'pending' | 'resolved' | 'closed';

interface WhatsAppPayload {
  restaurant_id?: string;
  phone: string;
  contact_name?: string | null;
  message: string;
  intent?: CallIntent;
  status?: ChatStatus;
  summary?: string | null;
  received_at?: string;

  // Optional booking details (used when intent === 'booking')
  booking?: {
    guest_name?: string;
    party_size?: number;
    booking_date?: string; // YYYY-MM-DD
    booking_time?: string; // HH:MM:SS
    notes?: string | null;
  };

  // Optional order details (used when intent === 'order')
  order?: {
    customer_name?: string;
    items?: Array<{ name: string; qty: number; price: number }>;
    total?: number;
    order_type?: 'dine_in' | 'takeaway' | 'delivery';
  };
}

async function findOrCreateCustomer(
  restaurantId: string,
  phone: string,
  name?: string | null,
) {
  const { data: existing, error: findErr } = await supabaseAdmin
    .from('customers')
    .select('id, name')
    .eq('restaurant_id', restaurantId)
    .eq('phone', phone)
    .maybeSingle();
  if (findErr) throw findErr;

  if (existing) {
    await supabaseAdmin
      .from('customers')
      .update({
        last_contact_at: new Date().toISOString(),
        ...(name && !existing.name ? { name } : {}),
      })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data: created, error: insertErr } = await supabaseAdmin
    .from('customers')
    .insert({
      restaurant_id: restaurantId,
      phone,
      name: name ?? null,
      last_contact_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (insertErr) throw insertErr;
  return created.id;
}

export const Route = createFileRoute('/api/public/whatsapp-webhook')({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: CORS_HEADERS }),

      // Meta WhatsApp Cloud API verification handshake
      // https://developers.facebook.com/docs/graph-api/webhooks/getting-started
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');
        const verifyToken =
          process.env.WHATSAPP_VERIFY_TOKEN ||
          process.env.WHATSAPP_WEBHOOK_SECRET;
        if (mode === 'subscribe' && token && token === verifyToken && challenge) {
          return new Response(challenge, {
            status: 200,
            headers: { 'Content-Type': 'text/plain', ...CORS_HEADERS },
          });
        }
        return new Response('Forbidden', { status: 403, headers: CORS_HEADERS });
      },

      POST: async ({ request }) => {
        try {
          const expected = process.env.WHATSAPP_WEBHOOK_SECRET;
          if (!expected) {
            return json({ error: 'Webhook secret not configured' }, 500);
          }

          // Read raw body so we can verify Meta's HMAC signature if present
          const rawBody = await request.text();
          let parsed: unknown;
          try {
            parsed = JSON.parse(rawBody);
          } catch {
            return json({ error: 'Invalid JSON' }, 400);
          }

          const meta = extractMetaMessage(parsed);

          // --- Auth ---
          if (meta.isMeta) {
            // Meta Cloud API: verify x-hub-signature-256 = HMAC_SHA256(appSecret, rawBody)
            const sig = request.headers.get('x-hub-signature-256') ?? '';
            const appSecret =
              process.env.WHATSAPP_APP_SECRET ||
              process.env.WHATSAPP_WEBHOOK_SECRET;
            if (appSecret && sig.startsWith('sha256=')) {
              const { createHmac, timingSafeEqual } = await import('node:crypto');
              const expectedSig =
                'sha256=' +
                createHmac('sha256', appSecret).update(rawBody).digest('hex');
              const a = Buffer.from(sig);
              const b = Buffer.from(expectedSig);
              if (a.length !== b.length || !timingSafeEqual(a, b)) {
                console.warn('[whatsapp-webhook] Meta signature mismatch');
                return json({ error: 'Invalid signature' }, 401);
              }
            } else {
              console.warn(
                '[whatsapp-webhook] Meta payload received without verifiable signature; accepting in dev mode',
              );
            }
          } else {
            // Legacy / dashboard test: simple shared-secret header
            const provided =
              request.headers.get('x-whatsapp-secret') ||
              request.headers
                .get('authorization')
                ?.replace(/^Bearer\s+/i, '');
            if (provided !== expected) {
              return json({ error: 'Unauthorized' }, 401);
            }
          }

          // --- Build a normalized WhatsAppPayload ---
          let payload: WhatsAppPayload;
          if (meta.isMeta) {
            if (!meta.messageId || !meta.from || !meta.text) {
              // Status updates and other non-message events — ack and skip
              return json({ ok: true, ignored: true, reason: 'no message' });
            }
            payload = {
              phone: meta.from.startsWith('+') ? meta.from : `+${meta.from}`,
              contact_name: meta.contactName ?? null,
              message: meta.text,
              received_at: meta.timestamp
                ? new Date(Number(meta.timestamp) * 1000).toISOString()
                : new Date().toISOString(),
              summary: `wamid:${meta.messageId}`,
            };
          } else {
            payload = parsed as WhatsAppPayload;
            if (!payload?.phone || !payload?.message) {
              return json({ error: 'phone and message are required' }, 400);
            }
          }

          // Resolve restaurant_id
          let restaurantId =
            payload.restaurant_id ||
            request.headers.get('x-restaurant-id') ||
            undefined;
          if (!restaurantId) {
            const { data: r } = await supabaseAdmin
              .from('restaurants')
              .select('id')
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle();
            restaurantId = r?.id;
          }
          if (!restaurantId) {
            return json({ error: 'No restaurant_id found' }, 400);
          }

          const intent: CallIntent = payload.intent ?? 'other';
          const chatStatus: ChatStatus = payload.status ?? 'active';
          const receivedAt = payload.received_at ?? new Date().toISOString();

          // 1 + 2. Find or create customer
          const customerId = await findOrCreateCustomer(
            restaurantId,
            payload.phone,
            payload.contact_name ?? null,
          );

          // 3. Find existing open whatsapp conversation, else create one.
          const { data: openConvo } = await supabaseAdmin
            .from('conversations')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('customer_id', customerId)
            .eq('channel', 'whatsapp')
            .eq('status', 'open')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let conversationId: string;
          if (openConvo) {
            conversationId = openConvo.id;
            await supabaseAdmin
              .from('conversations')
              .update({
                intent,
                summary: payload.summary ?? null,
              })
              .eq('id', openConvo.id);
          } else {
            const { data: convo, error: convoErr } = await supabaseAdmin
              .from('conversations')
              .insert({
                restaurant_id: restaurantId!,
                customer_id: customerId,
                channel: 'whatsapp',
                intent,
                status: 'open',
                summary: payload.summary ?? null,
                started_at: receivedAt,
              })
              .select('id')
              .single();
            if (convoErr) throw convoErr;
            conversationId = convo.id;
          }

          // 4. Upsert the whatsapp_logs row for this conversation, bumping
          // message_count and last_message.
          const { data: existingLog } = await supabaseAdmin
            .from('whatsapp_logs')
            .select('id, message_count')
            .eq('conversation_id', conversationId)
            .maybeSingle();

          let chatLogId: string;
          if (existingLog) {
            chatLogId = existingLog.id;
            await supabaseAdmin
              .from('whatsapp_logs')
              .update({
                last_message: payload.message,
                last_message_at: receivedAt,
                intent,
                status: chatStatus,
                message_count: (existingLog.message_count ?? 0) + 1,
                contact_name: payload.contact_name ?? undefined,
              })
              .eq('id', existingLog.id);
          } else {
            const { data: chat, error: chatErr } = await supabaseAdmin
              .from('whatsapp_logs')
              .insert({
                restaurant_id: restaurantId!,
                customer_id: customerId,
                conversation_id: conversationId,
                contact_name: payload.contact_name ?? null,
                phone: payload.phone,
                last_message: payload.message,
                last_message_at: receivedAt,
                intent,
                status: chatStatus,
                message_count: 1,
              })
              .select('id')
              .single();
            if (chatErr) throw chatErr;
            chatLogId = chat.id;
          }

          let bookingId: string | undefined;
          let orderId: string | undefined;

          // 5. Booking
          if (intent === 'booking' && payload.booking) {
            const b = payload.booking;
            const { data: booking, error: bErr } = await supabaseAdmin
              .from('bookings')
              .insert({
                restaurant_id: restaurantId!,
                customer_id: customerId,
                guest_name: b.guest_name ?? payload.contact_name ?? 'Guest',
                phone: payload.phone,
                party_size: b.party_size ?? 2,
                booking_date:
                  b.booking_date ?? new Date().toISOString().slice(0, 10),
                booking_time: b.booking_time ?? '19:00:00',
                notes: b.notes ?? payload.summary ?? payload.message,
                source: 'whatsapp',
                status: 'pending',
              })
              .select('id')
              .single();
            if (bErr) throw bErr;
            bookingId = booking.id;
          }

          // 6. Order
          if (intent === 'order' && payload.order) {
            const o = payload.order;
            const items = o.items ?? [];
            const total =
              o.total ??
              items.reduce(
                (sum, it) => sum + (it.price ?? 0) * (it.qty ?? 1),
                0,
              );
            const { data: order, error: oErr } = await supabaseAdmin
              .from('orders')
              .insert({
                restaurant_id: restaurantId!,
                customer_id: customerId,
                customer_name:
                  o.customer_name ?? payload.contact_name ?? 'Guest',
                phone: payload.phone,
                items: items as never,
                item_count: items.reduce((n, it) => n + (it.qty ?? 1), 0),
                total,
                status: 'preparing',
                source: 'whatsapp',
                order_type: o.order_type ?? 'delivery',
              })
              .select('id')
              .single();
            if (oErr) throw oErr;
            orderId = order.id;
          }

          return json({
            ok: true,
            customer_id: customerId,
            conversation_id: conversationId,
            whatsapp_log_id: chatLogId,
            wamid: meta.isMeta ? meta.messageId : undefined,
            booking_id: bookingId,
            order_id: orderId,
          });
        } catch (err) {
          console.error('whatsapp-webhook error', err);
          const message = err instanceof Error ? err.message : 'Unknown error';
          return json({ error: message }, 500);
        }
      },
    },
  },
});
