import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { LoadingState, EmptyState } from "@/components/States";
import { MessageCircle, Phone, Clock, Hash, Tag } from "lucide-react";
import { fetchChats, fetchChatMessages } from "@/api/dashboard";

export const Route = createFileRoute("/chats")({
  head: () => ({ meta: [{ title: "WhatsApp Chats — Command Center" }] }),
  component: ChatsPage,
});

type WorkerChat = {
  wa_from?: string;
  phone?: string;
  contact_name?: string | null;
  name?: string | null;
  last_message?: string | null;
  last_message_at?: string;
  updated_at?: string;
  message_count?: number;
  status?: string;
  intent?: string;
};

function normalize(c: WorkerChat) {
  return {
    id: c.wa_from ?? c.phone ?? Math.random().toString(36),
    wa_from: c.wa_from ?? c.phone ?? "",
    contact: c.contact_name ?? c.name ?? "Unknown",
    phone: c.phone ?? c.wa_from ?? "",
    last_message: c.last_message ?? "",
    when: c.last_message_at ?? c.updated_at ?? "",
    count: c.message_count ?? 0,
    status: c.status ?? "active",
    intent: c.intent ?? "other",
  };
}

function ChatsPage() {
  const fetchChatsFn = useServerFn(fetchChats);
  const { data: rawChats, isLoading, error } = useQuery({
    queryKey: ["worker", "chats"],
    queryFn: () => fetchChatsFn() as Promise<WorkerChat[]>,
    refetchInterval: 30_000,
  });

  const chats = (rawChats ?? []).map(normalize);
  const [selected, setSelected] = useState<ReturnType<typeof normalize> | null>(null);

  return (
    <AppLayout title="WhatsApp Chats">
      <div className="rounded-xl border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b">
          <h2 className="text-sm font-semibold">AI WhatsApp Conversations</h2>
          <p className="text-xs text-muted-foreground">
            {chats.length} threads · click a row to read the full conversation
          </p>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? <LoadingState /> :
           error ? <EmptyState title="Couldn't load chats" description={(error as Error).message} /> :
           !chats.length ? <EmptyState title="No chats yet" /> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Contact</TableHead><TableHead>Phone</TableHead>
                <TableHead>Last message</TableHead><TableHead>Msgs</TableHead>
                <TableHead>When</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {chats.map((c) => (
                  <TableRow
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{c.contact}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[260px] truncate">{c.last_message}</TableCell>
                    <TableCell>{c.count}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.when ? new Date(c.when).toLocaleString() : "—"}
                    </TableCell>
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

type Msg = {
  id?: string;
  direction?: "inbound" | "outbound" | string;
  role?: string;
  body?: string;
  text?: string;
  message?: string;
  content?: string;
  created_at?: string;
  timestamp?: string;
};

function ChatDetailsSheet({
  chat,
  onClose,
}: {
  chat: ReturnType<typeof normalize> | null;
  onClose: () => void;
}) {
  const fetchMsgs = useServerFn(fetchChatMessages);
  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["worker", "chat-messages", chat?.wa_from],
    enabled: !!chat?.wa_from,
    queryFn: () => fetchMsgs({ data: { wa_from: chat!.wa_from } }) as Promise<Msg[]>,
  });

  return (
    <Sheet open={!!chat} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {chat && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-success" />
                {chat.contact}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> {chat.phone}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge status={chat.status} />
              <Badge variant="outline" className="capitalize">
                <Tag className="h-3 w-3 mr-1" /> {chat.intent}
              </Badge>
              <Badge variant="outline">
                <Hash className="h-3 w-3 mr-1" /> {chat.count} messages
              </Badge>
              {chat.when && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" /> {new Date(chat.when).toLocaleString()}
                </Badge>
              )}
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Conversation
              </p>
              {isLoading ? (
                <LoadingState label="Loading messages..." />
              ) : error ? (
                <div className="rounded-lg border border-dashed p-4 text-sm">
                  <p className="font-medium mb-1">Couldn't load full transcript</p>
                  <p className="text-muted-foreground text-xs">{(error as Error).message}</p>
                  {chat.last_message && (
                    <div className="mt-3 rounded-md bg-muted/40 p-3 whitespace-pre-wrap text-sm">
                      {chat.last_message}
                    </div>
                  )}
                </div>
              ) : !messages?.length ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {chat.last_message || (
                    <span className="text-muted-foreground italic">No messages</span>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((m, i) => {
                    const text = m.body ?? m.text ?? m.message ?? m.content ?? "";
                    const dir = m.direction ?? m.role ?? "inbound";
                    const isOut = dir === "outbound" || dir === "assistant" || dir === "bot";
                    const ts = m.created_at ?? m.timestamp;
                    return (
                      <div
                        key={m.id ?? i}
                        className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            isOut
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{text}</div>
                          {ts && (
                            <div
                              className={`mt-1 text-[10px] ${
                                isOut ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {new Date(ts).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
