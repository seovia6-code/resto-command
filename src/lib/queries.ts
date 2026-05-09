import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import { ensureRestaurant } from "./seed";

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
  });
}

export function useRestaurantId() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["restaurant-id", user?.id],
    enabled: !!user,
    queryFn: () => ensureRestaurant(user!.id),
    staleTime: Infinity,
  });
}

const DAY_MS = 86400000;
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function dayLabel(d: Date) { return d.toLocaleDateString("en-US", { weekday: "short" }); }

export function useDashboardData(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const rid = restaurantId!;
      const sevenAgo = new Date(Date.now() - 6 * DAY_MS).toISOString();

      const [
        callsCount, waCount, bookingsCount, ordersCount,
        revenueAgg, failedCount,
        recentBookings, recentOrders, recentCalls, recentChats,
        convosWeek, bookingsWeek, ordersWeek,
      ] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("restaurant_id", rid).eq("channel", "call"),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("restaurant_id", rid).eq("channel", "whatsapp"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("restaurant_id", rid),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("restaurant_id", rid),
        supabase.from("orders").select("total").eq("restaurant_id", rid).eq("status", "delivered"),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("restaurant_id", rid).eq("status", "failed"),
        supabase.from("bookings").select("*").eq("restaurant_id", rid).order("created_at", { ascending: false }).limit(5),
        supabase.from("orders").select("*").eq("restaurant_id", rid).order("placed_at", { ascending: false }).limit(5),
        supabase.from("call_logs").select("*").eq("restaurant_id", rid).order("started_at", { ascending: false }).limit(5),
        supabase.from("whatsapp_logs").select("*").eq("restaurant_id", rid).order("last_message_at", { ascending: false }).limit(5),
        supabase.from("conversations").select("channel, started_at").eq("restaurant_id", rid).gte("started_at", sevenAgo),
        supabase.from("bookings").select("created_at").eq("restaurant_id", rid).gte("created_at", sevenAgo),
        supabase.from("orders").select("placed_at, total, status").eq("restaurant_id", rid).gte("placed_at", sevenAgo),
      ]);

      const revenue = (revenueAgg.data ?? []).reduce((s, r) => s + Number(r.total ?? 0), 0);

      // Build 7-day buckets
      const days: { key: string; label: string; date: Date }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = startOfDay(new Date(Date.now() - i * DAY_MS));
        days.push({ key: d.toISOString().slice(0, 10), label: dayLabel(d), date: d });
      }
      const bucket = (iso: string) => iso.slice(0, 10);

      const callVsWhatsApp = days.map(d => ({
        day: d.label,
        calls: (convosWeek.data ?? []).filter(r => r.channel === "call" && bucket(r.started_at) === d.key).length,
        whatsapp: (convosWeek.data ?? []).filter(r => r.channel === "whatsapp" && bucket(r.started_at) === d.key).length,
      }));
      const dailyBookings = days.map(d => ({
        day: d.label,
        bookings: (bookingsWeek.data ?? []).filter(r => bucket(r.created_at) === d.key).length,
      }));
      const dailyOrders = days.map(d => ({
        day: d.label,
        orders: (ordersWeek.data ?? []).filter(r => bucket(r.placed_at) === d.key).length,
      }));
      const dailyRevenue = days.map(d => ({
        day: d.label,
        revenue: (ordersWeek.data ?? [])
          .filter(r => r.status === "delivered" && bucket(r.placed_at) === d.key)
          .reduce((s, r) => s + Number(r.total ?? 0), 0),
      }));

      return {
        stats: {
          totalCalls: callsCount.count ?? 0,
          totalWhatsApp: waCount.count ?? 0,
          totalBookings: bookingsCount.count ?? 0,
          totalOrders: ordersCount.count ?? 0,
          totalRevenue: revenue,
          failedRequests: failedCount.count ?? 0,
        },
        charts: { callVsWhatsApp, dailyBookings, dailyOrders, dailyRevenue },
        recentBookings: recentBookings.data ?? [],
        recentOrders: recentOrders.data ?? [],
        recentCalls: recentCalls.data ?? [],
        recentChats: recentChats.data ?? [],
      };
    },
  });
}

export function useList<T>(table: string, restaurantId: string | undefined, orderBy: string) {
  return useQuery<T[]>({
    queryKey: [table, restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table as never)
        .select("*")
        .eq("restaurant_id", restaurantId!)
        .order(orderBy, { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}
