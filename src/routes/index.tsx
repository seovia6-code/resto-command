import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState, EmptyState } from "@/components/States";
import { PhoneCall, MessageCircle, CalendarCheck, ShoppingBag, IndianRupee, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardData, useRestaurantId, useIsAdmin } from "@/lib/queries";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { fetchSummary, fetchOrders } from "@/api/dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Restaurant Command Center" },
      { name: "description", content: "Live overview of calls, WhatsApp chats, bookings, orders and revenue for your restaurant." },
    ],
  }),
  component: Dashboard,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };
const grid = "var(--border)";
const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 };

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

function RecentTable({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>{children}</Table>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data: rid, isLoading: ridLoading } = useRestaurantId();
  const { data, isLoading } = useDashboardData(rid);

  // Live data from the Cloudflare Worker (WhatsApp bridge)
  const summaryFn = useServerFn(fetchSummary);
  const ordersFn = useServerFn(fetchOrders);
  const { data: waSummary } = useQuery<any>({
    queryKey: ["worker", "summary"],
    queryFn: () => summaryFn(),
    refetchInterval: 30_000,
  });
  const { data: waOrders } = useQuery<any[]>({
    queryKey: ["worker", "orders"],
    queryFn: () => ordersFn() as any,
    refetchInterval: 30_000,
  });

  if (ridLoading || isLoading || !data) {
    return <AppLayout title="Dashboard"><LoadingState label="Loading your restaurant..." /></AppLayout>;
  }

  const base = data;
  const stats = {
    ...base.stats,
    totalWhatsApp: waSummary?.totalChats ?? base.stats.totalWhatsApp,
    totalOrders: Array.isArray(waSummary?.ordersByType)
      ? waSummary.ordersByType.reduce((n: number, r: any) => n + Number(r.total ?? 0), 0)
      : base.stats.totalOrders,
  };
  const { charts, recentBookings, recentCalls, recentChats } = base;
  const recentOrders = (waOrders && waOrders.length > 0)
    ? waOrders.map((o: any) => ({
        id: o.order_id,
        customer_name: o.customer_name ?? o.wa_from ?? "Unknown",
        order_type: o.order_type ?? "—",
        total: 0,
        status: "received",
      }))
    : base.recentOrders;

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard label="Total Calls" value={stats.totalCalls.toLocaleString()} icon={PhoneCall} tone="info" />
          <StatCard label="WhatsApp Chats" value={stats.totalWhatsApp.toLocaleString()} icon={MessageCircle} tone="success" />
          <StatCard label="Bookings" value={stats.totalBookings} icon={CalendarCheck} tone="primary" />
          <StatCard label="Orders" value={stats.totalOrders} icon={ShoppingBag} tone="accent" />
          <StatCard label="Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={IndianRupee} tone="success" />
          <StatCard label="Failed Requests" value={stats.failedRequests} icon={AlertTriangle} tone="destructive" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Calls vs WhatsApp" subtitle="Last 7 days">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.callVsWhatsApp}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="calls" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="whatsapp" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Daily Revenue" subtitle="Last 7 days (₹, delivered)">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailyRevenue}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Daily Bookings" subtitle="Last 7 days">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.dailyBookings}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="bookings" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Daily Orders" subtitle="Last 7 days">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.dailyOrders}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="orders" stroke="var(--chart-4)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <RecentTable title="Recent Bookings">
            <TableHeader><TableRow>
              <TableHead>Guest</TableHead><TableHead>Date</TableHead><TableHead>Pax</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {recentBookings.length === 0 ? (
                <TableRow><TableCell colSpan={4}><EmptyState title="No bookings yet" /></TableCell></TableRow>
              ) : recentBookings.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.guest_name}</TableCell>
                  <TableCell className="text-muted-foreground">{b.booking_date} · {String(b.booking_time).slice(0, 5)}</TableCell>
                  <TableCell>{b.party_size}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </RecentTable>

          <RecentTable title="Recent Orders">
            <TableHeader><TableRow>
              <TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow><TableCell colSpan={4}><EmptyState title="No orders yet" /></TableCell></TableRow>
              ) : recentOrders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground capitalize">{String(o.order_type).replace("_", "-")}</TableCell>
                  <TableCell>₹{Number(o.total).toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </RecentTable>

          <RecentTable title="Recent Calls">
            <TableHeader><TableRow>
              <TableHead>Caller</TableHead><TableHead>Intent</TableHead><TableHead>Duration</TableHead><TableHead>Outcome</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {recentCalls.length === 0 ? (
                <TableRow><TableCell colSpan={4}><EmptyState title="No calls yet" /></TableCell></TableRow>
              ) : recentCalls.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.caller_name ?? "Unknown"}</TableCell>
                  <TableCell className="text-muted-foreground capitalize">{c.intent}</TableCell>
                  <TableCell>{Math.floor(c.duration_seconds / 60)}m {c.duration_seconds % 60}s</TableCell>
                  <TableCell><StatusBadge status={c.outcome} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </RecentTable>

          <RecentTable title="Recent WhatsApp Chats">
            <TableHeader><TableRow>
              <TableHead>Contact</TableHead><TableHead>Last message</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {recentChats.length === 0 ? (
                <TableRow><TableCell colSpan={3}><EmptyState title="No chats yet" /></TableCell></TableRow>
              ) : recentChats.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.contact_name ?? "Unknown"}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[220px] truncate">{c.last_message}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </RecentTable>
        </div>
      </div>
    </AppLayout>
  );
}
