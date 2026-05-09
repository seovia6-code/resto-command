import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useList, useRestaurantId, useIsAdmin } from "@/lib/queries";
import { LoadingState, EmptyState } from "@/components/States";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Command Center" }] }),
  component: BookingsPage,
});

type Booking = {
  id: string; guest_name: string; phone: string; party_size: number;
  booking_date: string; booking_time: string; status: string; source: string;
};

function BookingsPage() {
  const { data: rid } = useRestaurantId();
  const { data: isAdmin } = useIsAdmin();
  const { data: rows, isLoading } = useList<Booking>("bookings", rid, "created_at", !!isAdmin);

  return (
    <AppLayout title="Bookings">
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b">
          <h2 className="text-sm font-semibold">All Bookings</h2>
          <p className="text-xs text-muted-foreground">{rows?.length ?? 0} reservations</p>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <LoadingState /> : !rows?.length ? <EmptyState title="No bookings yet" hint="They'll appear here as the AI takes calls and chats." /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Guest</TableHead><TableHead>Phone</TableHead><TableHead>Date</TableHead>
                <TableHead>Time</TableHead><TableHead>Pax</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.guest_name}</TableCell>
                    <TableCell className="text-muted-foreground">{b.phone}</TableCell>
                    <TableCell>{b.booking_date}</TableCell>
                    <TableCell>{String(b.booking_time).slice(0, 5)}</TableCell>
                    <TableCell>{b.party_size}</TableCell>
                    <TableCell className="text-muted-foreground capitalize">{b.source}</TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
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
