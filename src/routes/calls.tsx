import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useList, useRestaurantId } from "@/lib/queries";
import { LoadingState, EmptyState } from "@/components/States";

export const Route = createFileRoute("/calls")({
  head: () => ({ meta: [{ title: "Call Logs — Command Center" }] }),
  component: CallsPage,
});

type Call = {
  id: string; caller_name: string | null; phone: string;
  duration_seconds: number; intent: string; outcome: string; started_at: string;
};

function CallsPage() {
  const { data: rid } = useRestaurantId();
  const { data: rows, isLoading } = useList<Call>("call_logs", rid, "started_at");

  return (
    <AppLayout title="Call Logs">
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b">
          <h2 className="text-sm font-semibold">AI Call Activity</h2>
          <p className="text-xs text-muted-foreground">{rows?.length ?? 0} calls</p>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <LoadingState /> : !rows?.length ? <EmptyState title="No calls yet" /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Caller</TableHead><TableHead>Phone</TableHead><TableHead>Duration</TableHead>
                <TableHead>Intent</TableHead><TableHead>When</TableHead><TableHead>Outcome</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.caller_name ?? "Unknown"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                    <TableCell>{Math.floor(c.duration_seconds / 60)}m {c.duration_seconds % 60}s</TableCell>
                    <TableCell className="text-muted-foreground capitalize">{c.intent}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(c.started_at).toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={c.outcome} /></TableCell>
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
