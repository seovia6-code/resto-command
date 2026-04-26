import { createFileRoute } from '@tanstack/react-router';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Vapi-Secret',
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

type CallIntent = 'booking' | 'order' | 'enquiry' | 'complaint' | 'other';
type CallOutcome = 'resolved' | 'booked' | 'missed' | 'failed' | 'transferred';

interface VapiPayload {
  restaurant_id?: string;
  phone: string;
  caller_name?: string | null;
  intent?: CallIntent;
  outcome?: CallOutcome;
  duration_seconds?: number;
  transcript?: string | null;
  recording_url?: string | null;
  summary?: string | null;
  started_at?: string;
  ended_at?: string | null;

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

export const Route = createFileRoute('/api/public/vapi-webhook')({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: CORS_HEADERS }),

      POST: async ({ request }) => {
        try {
          // --- Auth: shared secret ---
          const expected = process.env.VAPI_WEBHOOK_SECRET;
          if (!expected) {
            return json({ error: 'Webhook secret not configured' }, 500);
          }
          const provided =
            request.headers.get('x-vapi-secret') ||
            request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
          if (provided !== expected) {
            return json({ error: 'Unauthorized' }, 401);
          }

          // --- Parse body ---
          const raw = (await request.json()) as any;
          console.log('[vapi-webhook] received payload keys:', Object.keys(raw ?? {}));

          // Normalize: VAPI native end-of-call-report wraps everything in `message`.
          // Accept either our flat shape OR VAPI's native shape.
          const m = raw?.message ?? raw;
          const call = m?.call ?? raw?.call ?? {};
          const customer = m?.customer ?? call?.customer ?? {};

          const intentRaw = (m?.analysis?.structuredData?.intent ?? m?.intent ?? raw?.intent ?? 'other') as string;
          const allowedIntents = ['booking', 'order', 'enquiry', 'complaint', 'other'];
          const intent = (allowedIntents.includes(intentRaw) ? intentRaw : 'other') as CallIntent;

          const payload: VapiPayload = {
            restaurant_id: raw?.restaurant_id,
            phone:
              raw?.phone ??
              customer?.number ??
              m?.phoneNumber?.number ??
              call?.phoneNumber?.number ??
              '',
            caller_name:
              raw?.caller_name ?? customer?.name ?? m?.customer?.name ?? null,
            intent,
            outcome: (raw?.outcome ?? (m?.endedReason === 'customer-ended-call' ? 'resolved' : undefined)) as CallOutcome | undefined,
            duration_seconds:
              raw?.duration_seconds ??
              (typeof m?.durationSeconds === 'number' ? Math.round(m.durationSeconds) : undefined),
            transcript: raw?.transcript ?? m?.transcript ?? null,
            recording_url: raw?.recording_url ?? m?.recordingUrl ?? m?.stereoRecordingUrl ?? null,
            summary: raw?.summary ?? m?.summary ?? m?.analysis?.summary ?? null,
            started_at: raw?.started_at ?? m?.startedAt ?? call?.startedAt,
            ended_at: raw?.ended_at ?? m?.endedAt ?? call?.endedAt,
            booking: raw?.booking ?? m?.analysis?.structuredData?.booking,
            order: raw?.order ?? m?.analysis?.structuredData?.order,
          };

          if (!payload.phone) {
            console.warn('[vapi-webhook] missing phone in payload');
            return json({ error: 'phone is required (checked root, message.customer.number, message.phoneNumber.number)' }, 400);
          }

          // Resolve restaurant_id from payload, header, or fall back to the
          // first restaurant in the project (single-tenant friendly default).
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
          const outcome: CallOutcome = payload.outcome ?? 'resolved';
          const startedAt = payload.started_at ?? new Date().toISOString();
          const endedAt = payload.ended_at ?? new Date().toISOString();

          // 1 + 2. Find or create customer
          const customerId = await findOrCreateCustomer(
            restaurantId,
            payload.phone,
            payload.caller_name ?? null,
          );

          // 3. Create conversation (channel = call)
          const { data: convo, error: convoErr } = await supabaseAdmin
            .from('conversations')
            .insert({
              restaurant_id: restaurantId,
              customer_id: customerId,
              channel: 'call',
              intent,
              status: outcome === 'failed' ? 'failed' : 'closed',
              summary: payload.summary ?? null,
              started_at: startedAt,
              ended_at: endedAt,
            })
            .select('id')
            .single();
          if (convoErr) throw convoErr;

          // 4. Insert call log with transcript + recording
          const { data: call, error: callErr } = await supabaseAdmin
            .from('call_logs')
            .insert({
              restaurant_id: restaurantId!,
              customer_id: customerId,
              conversation_id: convo.id,
              caller_name: payload.caller_name ?? null,
              phone: payload.phone,
              duration_seconds: payload.duration_seconds ?? 0,
              intent,
              outcome,
              transcript: payload.transcript ?? null,
              recording_url: payload.recording_url ?? null,
              started_at: startedAt,
            })
            .select('id')
            .single();
          if (callErr) throw callErr;

          let bookingId: string | undefined;
          let orderId: string | undefined;

          // 5. Booking
          if (intent === 'booking' && payload.booking) {
            const b = payload.booking;
            const { data: booking, error: bErr } = await supabaseAdmin
              .from('bookings')
              .insert({
                restaurant_id: restaurantId,
                customer_id: customerId,
                guest_name: b.guest_name ?? payload.caller_name ?? 'Guest',
                phone: payload.phone,
                party_size: b.party_size ?? 2,
                booking_date:
                  b.booking_date ?? new Date().toISOString().slice(0, 10),
                booking_time: b.booking_time ?? '19:00:00',
                notes: b.notes ?? payload.summary ?? null,
                source: 'call',
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
                  o.customer_name ?? payload.caller_name ?? 'Guest',
                phone: payload.phone,
                items: items as never,
                item_count: items.reduce((n, it) => n + (it.qty ?? 1), 0),
                total,
                status: 'preparing',
                source: 'call',
                order_type: 'takeaway',
              })
              .select('id')
              .single();
            if (oErr) throw oErr;
            orderId = order.id;
          }

          return json({
            ok: true,
            customer_id: customerId,
            conversation_id: convo.id,
            call_log_id: call.id,
            booking_id: bookingId,
            order_id: orderId,
          });
        } catch (err) {
          console.error('vapi-webhook error', err);
          const message = err instanceof Error ? err.message : 'Unknown error';
          return json({ error: message }, 500);
        }
      },
    },
  },
});
