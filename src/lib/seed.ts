import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures the signed-in user has a restaurant. If none exists, creates an
 * empty one (no sample/dummy data). All operational data (customers,
 * conversations, calls, chats, bookings, orders) is populated exclusively
 * by the VAPI and WhatsApp webhooks.
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
      name: "My Restaurant",
    })
    .select("id")
    .single();
  if (error) throw error;

  return created.id;
}
