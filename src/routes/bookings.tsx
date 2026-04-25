import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { bookings } from "@/lib/sample-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/bookings")({
  head: () => ({ meta: [{ title: "Bookings — Command Center" }] }),
  component: BookingsPage,
});

function BookingsPage() {
  return (
    <AppLayout title="Bookings">
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b">
          <div>
            <h2 className="text-sm font-semibold">All Bookings</h2>
            <p className="text-xs text-muted-foreground">{bookings.length} total reservations</p>
          </div>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />New</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Pax</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.id}</TableCell>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground">{b.phone}</TableCell>
                  <TableCell>{b.date}</TableCell>
                  <TableCell>{b.time}</TableCell>
                  <TableCell>{b.guests}</TableCell>
                  <TableCell className="text-muted-foreground">{b.source}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
