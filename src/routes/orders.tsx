import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { orders } from "@/lib/sample-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — Command Center" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <AppLayout title="Orders">
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b">
          <h2 className="text-sm font-semibold">All Orders</h2>
          <p className="text-xs text-muted-foreground">{orders.length} orders today</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell className="font-medium">{o.customer}</TableCell>
                  <TableCell>{o.items}</TableCell>
                  <TableCell className="text-muted-foreground">{o.type}</TableCell>
                  <TableCell className="font-semibold">₹{o.total}</TableCell>
                  <TableCell className="text-muted-foreground">{o.time}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
