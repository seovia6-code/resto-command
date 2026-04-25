import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useList, useRestaurantId } from "@/lib/queries";
import { LoadingState, EmptyState } from "@/components/States";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — Command Center" }] }),
  component: OrdersPage,
});

type Order = {
  id: string; customer_name: string; item_count: number; total: number;
  order_type: string; status: string; placed_at: string;
};

function OrdersPage() {
  const { data: rid } = useRestaurantId();
  const { data: rows, isLoading } = useList<Order>("orders", rid, "placed_at");

  return (
    <AppLayout title="Orders">
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b">
          <h2 className="text-sm font-semibold">All Orders</h2>
          <p className="text-xs text-muted-foreground">{rows?.length ?? 0} orders</p>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <LoadingState /> : !rows?.length ? <EmptyState title="No orders yet" /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Customer</TableHead><TableHead>Items</TableHead><TableHead>Type</TableHead>
                <TableHead>Total</TableHead><TableHead>Placed</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.customer_name}</TableCell>
                    <TableCell>{o.item_count}</TableCell>
                    <TableCell className="text-muted-foreground capitalize">{String(o.order_type).replace("_", "-")}</TableCell>
                    <TableCell className="font-semibold">₹{Number(o.total).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(o.placed_at).toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
