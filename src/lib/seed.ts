import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures the signed-in user has a restaurant. If not, creates one with
 * realistic seed data (customers, conversations, bookings, orders, calls, chats).
 * Returns the active restaurant_id.
 */
export async function ensureRestaurant(userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("restaurants")
    .insert({
      owner_id: userId,
      name: "Spice Garden",
      phone: "+91 98201 11023",
      address: "221B Hill Road, Bandra West, Mumbai",
    })
    .select("id")
    .single();
  if (error) throw error;

  await seedSampleData(created.id);
  return created.id;
}

const NAMES = [
  "Aarav Sharma", "Priya Patel", "Rohan Mehta", "Neha Kapoor", "Vikram Singh",
  "Ananya Iyer", "Karan Desai", "Sneha Rao", "Manish Gupta", "Pooja Verma",
  "Rahul Joshi", "Divya Nair", "Aditya Bose", "Ishita Reddy", "Arjun Malhotra",
];
const PHONES = NAMES.map((_, i) => `+91 98${String(100000000 + i * 73219).slice(0, 8)}`);

function pick<T>(arr: T[], i: number) { return arr[i % arr.length]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function isoDaysAgo(d: number) { return new Date(Date.now() - d * 86400000).toISOString(); }

async function seedSampleData(restaurantId: string) {
  // Customers
  const customers = NAMES.map((name, i) => ({
    restaurant_id: restaurantId,
    name,
    phone: pick(PHONES, i),
    total_spent: randInt(500, 12000),
    last_contact_at: isoDaysAgo(randInt(0, 6)),
  }));
  const { data: insertedCustomers } = await supabase
    .from("customers").insert(customers).select("id, name, phone");
  const cust = insertedCustomers ?? [];

  // Conversations (mix of calls + whatsapp, with some failed)
  const channels: ("call" | "whatsapp")[] = ["call", "whatsapp"];
  const intents: ("booking" | "order" | "enquiry" | "complaint" | "other")[] =
    ["booking", "order", "enquiry", "complaint", "other"];
  const conversations = Array.from({ length: 80 }).map((_, i) => {
    const c = pick(cust, i);
    return {
      restaurant_id: restaurantId,
      customer_id: c?.id,
      channel: pick(channels, i),
      intent: pick(intents, i),
      status: i % 11 === 0 ? "failed" : i % 3 === 0 ? "resolved" : "open",
      started_at: isoDaysAgo(randInt(0, 6)),
    };
  });
  await supabase.from("conversations").insert(conversations);

  // Bookings
  const statuses: ("pending" | "confirmed" | "cancelled" | "completed")[] =
    ["confirmed", "confirmed", "confirmed", "pending", "cancelled", "completed"];
  const sources: ("call" | "whatsapp" | "web")[] = ["call", "whatsapp", "web"];
  const today = new Date();
  const bookings = Array.from({ length: 24 }).map((_, i) => {
    const c = pick(cust, i);
    const date = new Date(today);
    date.setDate(today.getDate() + randInt(-3, 4));
    return {
      restaurant_id: restaurantId,
      customer_id: c?.id,
      guest_name: c?.name ?? "Guest",
      phone: c?.phone ?? "+91 90000 00000",
      party_size: randInt(2, 8),
      booking_date: date.toISOString().slice(0, 10),
      booking_time: `${String(randInt(12, 22)).padStart(2, "0")}:${pick(["00", "30"], i)}`,
      status: pick(statuses, i),
      source: pick(sources, i),
    };
  });
  await supabase.from("bookings").insert(bookings);

  // Orders
  const orderStatuses: ("preparing" | "ready" | "delivered" | "cancelled")[] =
    ["delivered", "delivered", "delivered", "ready", "preparing", "cancelled"];
  const orderTypes: ("dine_in" | "takeaway" | "delivery")[] = ["dine_in", "takeaway", "delivery"];
  const orders = Array.from({ length: 60 }).map((_, i) => {
    const c = pick(cust, i);
    const itemCount = randInt(1, 6);
    return {
      restaurant_id: restaurantId,
      customer_id: c?.id,
      customer_name: c?.name ?? "Guest",
      phone: c?.phone,
      items: Array.from({ length: itemCount }).map((__, k) => ({
        name: pick(["Paneer Tikka", "Butter Chicken", "Biryani", "Naan", "Dal Makhani", "Gulab Jamun"], k + i),
        qty: randInt(1, 3),
      })),
      item_count: itemCount,
      total: randInt(250, 2800),
      order_type: pick(orderTypes, i),
      status: pick(orderStatuses, i),
      source: pick(sources, i),
      placed_at: isoDaysAgo(randInt(0, 6)),
    };
  });
  await supabase.from("orders").insert(orders);

  // Call logs
  const outcomes: ("resolved" | "booked" | "missed" | "failed")[] =
    ["resolved", "booked", "resolved", "missed", "failed"];
  const callLogs = Array.from({ length: 30 }).map((_, i) => {
    const c = pick(cust, i);
    return {
      restaurant_id: restaurantId,
      customer_id: c?.id,
      caller_name: c?.name,
      phone: c?.phone ?? "+91 90000 00000",
      duration_seconds: randInt(20, 240),
      intent: pick(intents, i),
      outcome: pick(outcomes, i),
      started_at: isoDaysAgo(randInt(0, 6)),
    };
  });
  await supabase.from("call_logs").insert(callLogs);

  // WhatsApp logs
  const chatStatuses: ("active" | "pending" | "resolved" | "closed")[] =
    ["resolved", "active", "pending", "resolved", "closed"];
  const messages = [
    "Table booked for 2 at 7 PM ✅",
    "Can I get the dessert menu?",
    "Order placed — paneer tikka x2",
    "Do you have outdoor seating?",
    "Order delivered, thank you!",
    "Need to cancel my booking",
    "What's today's special?",
  ];
  const whatsappLogs = Array.from({ length: 30 }).map((_, i) => {
    const c = pick(cust, i);
    return {
      restaurant_id: restaurantId,
      customer_id: c?.id,
      contact_name: c?.name,
      phone: c?.phone ?? "+91 90000 00000",
      last_message: pick(messages, i),
      intent: pick(intents, i),
      status: pick(chatStatuses, i),
      message_count: randInt(2, 18),
      last_message_at: isoDaysAgo(randInt(0, 6)),
    };
  });
  await supabase.from("whatsapp_logs").insert(whatsappLogs);
}
