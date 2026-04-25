import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  PhoneCall, MessageCircle, CalendarCheck, ShoppingBag, IndianRupee, AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  stats, callVsWhatsApp, dailyBookings, dailyOrders, dailyRevenue,
  bookings, orders, calls, chats,
} from "@/lib/sample-data";

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

function Dashboard() {
  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard label="Total Calls" value={stats.totalCalls.toLocaleString()} change="12.4% this week" trend="up" icon={PhoneCall} tone="info" />
          <StatCard label="WhatsApp Chats" value={stats.totalWhatsApp.toLocaleString()} change="18.2% this week" trend="up" icon={MessageCircle} tone="success" />
          <StatCard label="Bookings" value={stats.totalBookings} change="6.1% this week" trend="up" icon={CalendarCheck} tone="primary" />
          <StatCard label="Orders" value={stats.totalOrders} change="9.3% this week" trend="up" icon={ShoppingBag} tone="accent" />
          <StatCard label="Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} change="14.8% this week" trend="up" icon={IndianRupee} tone="success" />
          <StatCard label="Failed Requests" value={stats.failedRequests} change="3.2% this week" trend="down" icon={AlertTriangle} tone="destructive" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Calls vs WhatsApp" subtitle="Last 7 days">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={callVsWhatsApp}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="calls" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="whatsapp" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Daily Revenue" subtitle="Last 7 days (₹)">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Daily Bookings" subtitle="Last 7 days">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyBookings}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="bookings" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Daily Orders" subtitle="Last 7 days">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyOrders}>
                <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="orders" stroke="var(--chart-4)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <RecentTable title="Recent Bookings">
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Pax</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.slice(0, 5).map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground">{b.date} · {b.time}</TableCell>
                  <TableCell>{b.guests}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </RecentTable>

          <RecentTable title="Recent Orders">
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 5).map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{o.type}</TableCell>
                  <TableCell>₹{o.total}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </RecentTable>

          <RecentTable title="Recent Calls">
            <TableHeader>
              <TableRow>
                <TableHead>Caller</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.slice(0, 5).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.caller}</TableCell>
                  <TableCell className="text-muted-foreground">{c.intent}</TableCell>
                  <TableCell>{c.duration}</TableCell>
                  <TableCell><StatusBadge status={c.outcome} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </RecentTable>

          <RecentTable title="Recent WhatsApp Chats">
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Last message</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chats.slice(0, 5).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.contact}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[220px] truncate">{c.lastMessage}</TableCell>
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
