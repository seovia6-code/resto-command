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

export function useDashboardData(restaurantId: string | undefined, isAdmin = false) {
  // Admins see all restaurants' data (RLS allows it via has_role policy).
  // Owners see only their own restaurant.
  const enabled = isAdmin || !!restaurantId;
  return useQuery({
    queryKey: ["dashboard", isAdmin ? "admin-all" : restaurantId],
    enabled,
    queryFn: async () => {
      const sevenAgo = new Date(Date.now() - 6 * DAY_MS).toISOString();
      const scope = <T extends { eq: (...a: any[]) => any }>(q: T): T =>
        (isAdmin ? q : q.eq("restaurant_id", restaurantId!)) as T;

      const [
        callsCount, waCount, bookingsCount, ordersCount,
        revenueAgg, failedCount,
        recentBookings, recentOrders, recentCalls, recentChats,
        convosWeek, bookingsWeek, ordersWeek,
      ] = await Promise.all([
        scope(supabase.from("conversations").select("id", { count: "exact", head: true }).eq("channel", "call")),
        scope(supabase.from("conversations").select("id", { count: "exact", head: true }).eq("channel", "whatsapp")),
        scope(supabase.from("bookings").select("id", { count: "exact", head: true })),
        scope(supabase.from("orders").select("id", { count: "exact", head: true })),
        scope(supabase.from("orders").select("total").eq("status", "delivered")),
        scope(supabase.from("conversations").select("id", { count: "exact", head: true }).eq("status", "failed")),
        scope(supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(5)),
        scope(supabase.from("orders").select("*").order("placed_at", { ascending: false }).limit(5)),
        scope(supabase.from("call_logs").select("*").order("started_at", { ascending: false }).limit(5)),
        scope(supabase.from("whatsapp_logs").select("*").order("last_message_at", { ascending: false }).limit(5)),
        scope(supabase.from("conversations").select("channel, started_at").gte("started_at", sevenAgo)),
        scope(supabase.from("bookings").select("created_at").gte("created_at", sevenAgo)),
        scope(supabase.from("orders").select("placed_at, total, status").gte("placed_at", sevenAgo)),
      ]);

      const revenue = (revenueAgg.data ?? []).reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);

      const days: { key: string; label: string; date: Date }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = startOfDay(new Date(Date.now() - i * DAY_MS));
        days.push({ key: d.toISOString().slice(0, 10), label: dayLabel(d), date: d });
      }
      const bucket = (iso: string) => iso.slice(0, 10);

      const callVsWhatsApp = days.map(d => ({
        day: d.label,
        calls: (convosWeek.data ?? []).filter((r: any) => r.channel === "call" && bucket(r.started_at) === d.key).length,
        whatsapp: (convosWeek.data ?? []).filter((r: any) => r.channel === "whatsapp" && bucket(r.started_at) === d.key).length,
      }));
      const dailyBookings = days.map(d => ({
        day: d.label,
        bookings: (bookingsWeek.data ?? []).filter((r: any) => bucket(r.created_at) === d.key).length,
      }));
      const dailyOrders = days.map(d => ({
        day: d.label,
        orders: (ordersWeek.data ?? []).filter((r: any) => bucket(r.placed_at) === d.key).length,
      }));
      const dailyRevenue = days.map(d => ({
        day: d.label,
        revenue: (ordersWeek.data ?? [])
          .filter((r: any) => r.status === "delivered" && bucket(r.placed_at) === d.key)
          .reduce((s: number, r: any) => s + Number(r.total ?? 0), 0),
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

export function useList<T>(table: string, restaurantId: string | undefined, orderBy: string, isAdmin = false) {
  const enabled = isAdmin || !!restaurantId;
  return useQuery<T[]>({
    queryKey: [table, isAdmin ? "admin-all" : restaurantId],
    enabled,
    queryFn: async () => {
      let q = supabase.from(table as never).select("*").order(orderBy, { ascending: false }).limit(200);
      if (!isAdmin) q = q.eq("restaurant_id", restaurantId!);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}
