import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useList, useRestaurantId } from "@/lib/queries";
import { LoadingState, EmptyState } from "@/components/States";

export const Route = createFileRoute("/chats")({
  head: () => ({ meta: [{ title: "WhatsApp Chats — Command Center" }] }),
  component: ChatsPage,
});

type Chat = {
  id: string; contact_name: string | null; phone: string;
  last_message: string | null; intent: string; status: string;
  message_count: number; last_message_at: string;
};

function ChatsPage() {
  const { data: rid } = useRestaurantId();
  const { data: rows, isLoading } = useList<Chat>("whatsapp_logs", rid, "last_message_at");

  return (
    <AppLayout title="WhatsApp Chats">
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b">
          <h2 className="text-sm font-semibold">AI WhatsApp Conversations</h2>
          <p className="text-xs text-muted-foreground">{rows?.length ?? 0} threads</p>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <LoadingState /> : !rows?.length ? <EmptyState title="No chats yet" /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Contact</TableHead><TableHead>Phone</TableHead><TableHead>Last message</TableHead>
                <TableHead>Msgs</TableHead><TableHead>When</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.contact_name ?? "Unknown"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[260px] truncate">{c.last_message}</TableCell>
                    <TableCell>{c.message_count}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(c.last_message_at).toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
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
