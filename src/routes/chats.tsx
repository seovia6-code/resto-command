import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useList, useRestaurantId, useIsAdmin } from "@/lib/queries";
import { LoadingState, EmptyState } from "@/components/States";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Phone, User, Clock, Hash, Tag } from "lucide-react";

export const Route = createFileRoute("/chats")({
  head: () => ({ meta: [{ title: "WhatsApp Chats — Command Center" }] }),
  component: ChatsPage,
});

type Chat = {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  conversation_id: string | null;
  contact_name: string | null;
  phone: string;
  last_message: string | null;
  intent: string;
  status: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

function ChatsPage() {
  const { data: rid } = useRestaurantId();
  const { data: isAdmin } = useIsAdmin();
  const { data: rows, isLoading } = useList<Chat>("whatsapp_logs", rid, "last_message_at", !!isAdmin);
  const [selected, setSelected] = useState<Chat | null>(null);

  return (
    <AppLayout title="WhatsApp Chats">
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b">
          <h2 className="text-sm font-semibold">AI WhatsApp Conversations</h2>
          <p className="text-xs text-muted-foreground">{rows?.length ?? 0} threads · click a row for details</p>
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
                  <TableRow
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
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

      <ChatDetailsSheet chat={selected} onClose={() => setSelected(null)} />
    </AppLayout>
  );
}

function ChatDetailsSheet({ chat, onClose }: { chat: Chat | null; onClose: () => void }) {
  const { data: conv } = useQuery({
    queryKey: ["conversation", chat?.conversation_id],
    enabled: !!chat?.conversation_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", chat!.conversation_id!)
        .maybeSingle();
      return data;
    },
  });

  const { data: customer } = useQuery({
    queryKey: ["customer", chat?.customer_id],
    enabled: !!chat?.customer_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("id", chat!.customer_id!)
        .maybeSingle();
      return data;
    },
  });

  return (
    <Sheet open={!!chat} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {chat && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-success" />
                {chat.contact_name ?? "Unknown contact"}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> {chat.phone}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={chat.status} />
                <Badge variant="outline" className="capitalize">
                  <Tag className="h-3 w-3 mr-1" />
                  {chat.intent}
                </Badge>
                <Badge variant="outline">
                  <Hash className="h-3 w-3 mr-1" />
                  {chat.message_count} messages
                </Badge>
              </div>

              <DetailRow icon={Clock} label="Last message at">
                {new Date(chat.last_message_at).toLocaleString()}
              </DetailRow>
              <DetailRow icon={Clock} label="Started">
                {new Date(chat.created_at).toLocaleString()}
              </DetailRow>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Last message
                </p>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {chat.last_message ?? <span className="text-muted-foreground italic">No content</span>}
                </div>
              </div>

              {customer && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                    <User className="h-3 w-3" /> Customer
                  </p>
                  <div className="rounded-lg border p-3 text-sm space-y-1">
                    {(customer as any).name && <div><span className="text-muted-foreground">Name:</span> {(customer as any).name}</div>}
                    {(customer as any).phone && <div><span className="text-muted-foreground">Phone:</span> {(customer as any).phone}</div>}
                    {(customer as any).email && <div><span className="text-muted-foreground">Email:</span> {(customer as any).email}</div>}
                  </div>
                </div>
              )}

              {conv && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Conversation summary
                  </p>
                  <div className="rounded-lg border p-3 text-sm space-y-1">
                    <div><span className="text-muted-foreground">Channel:</span> {(conv as any).channel}</div>
                    <div><span className="text-muted-foreground">Status:</span> {(conv as any).status}</div>
                    {(conv as any).summary && (
                      <div className="pt-2 whitespace-pre-wrap">{(conv as any).summary}</div>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground pt-2 border-t">
                Tip: per-message transcripts come from the WhatsApp bridge. Connect a messages endpoint to view the full chat history here.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{children}</p>
      </div>
    </div>
  );
}
