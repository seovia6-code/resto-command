import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { calls } from "@/lib/sample-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/calls")({
  head: () => ({ meta: [{ title: "Call Logs — Command Center" }] }),
  component: CallsPage,
});

function CallsPage() {
  return (
    <AppLayout title="Call Logs">
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b">
          <h2 className="text-sm font-semibold">AI Call Activity</h2>
          <p className="text-xs text-muted-foreground">{calls.length} recent calls handled</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Caller</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.id}</TableCell>
                  <TableCell className="font-medium">{c.caller}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                  <TableCell>{c.duration}</TableCell>
                  <TableCell className="text-muted-foreground">{c.intent}</TableCell>
                  <TableCell className="text-muted-foreground">{c.time}</TableCell>
                  <TableCell><StatusBadge status={c.outcome} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
