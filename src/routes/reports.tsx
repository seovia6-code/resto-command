import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useDashboardData, useRestaurantId, useIsAdmin } from "@/lib/queries";
import { LoadingState } from "@/components/States";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Command Center" }] }),
  component: ReportsPage,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };
const grid = "var(--border)";
const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 };
const colors = ["var(--chart-2)", "var(--chart-3)", "var(--chart-1)"];

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
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

function ReportsPage() {
  const { data: rid } = useRestaurantId();
  const { data, isLoading } = useDashboardData(rid);

  if (isLoading || !data) return <AppLayout title="Reports"><LoadingState /></AppLayout>;

  const { stats, charts } = data;
  const sourceMix = [
    { name: "WhatsApp", value: stats.totalWhatsApp },
    { name: "Calls", value: stats.totalCalls },
  ].filter(s => s.value > 0);

  return (
    <AppLayout title="Reports">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Revenue Trend" subtitle="Last 7 days (₹, delivered)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.dailyRevenue}>
              <defs>
                <linearGradient id="r2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
              <YAxis {...axis} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#r2)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Channel Mix" subtitle="Where requests come from">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sourceMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {sourceMix.map((_, i) => <Cell key={i} fill={colors[i]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Bookings Trend" subtitle="Last 7 days">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.dailyBookings}>
              <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
              <YAxis {...axis} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="bookings" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Orders Trend" subtitle="Last 7 days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={charts.dailyOrders}>
              <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
              <YAxis {...axis} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="orders" stroke="var(--chart-4)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Calls vs WhatsApp" subtitle="Channel comparison">
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
        </Card>
      </div>
    </AppLayout>
  );
}
