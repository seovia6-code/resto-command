import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useList, useRestaurantId, useIsAdmin } from "@/lib/queries";
import { LoadingState, EmptyState } from "@/components/States";
import { MessageSquareText } from "lucide-react";

export const Route = createFileRoute("/calls")({
  head: () => ({ meta: [{ title: "Call Logs — Command Center" }] }),
  component: CallsPage,
});

type Call = {
  id: string; caller_name: string | null; phone: string;
  duration_seconds: number; intent: string; outcome: string; started_at: string;
  transcript: string | null; recording_url: string | null;
};

type TranscriptLine = { speaker: string; text: string };

function parseTranscript(transcript: string): TranscriptLine[] {
  return transcript
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(AI|User|Assistant|Agent|Customer|Caller)\s*:\s*(.*)$/i);
      if (m) return { speaker: m[1], text: m[2] };
      return { speaker: "", text: line };
    });
}

function CallsPage() {
  const { data: rid } = useRestaurantId();
  const { data: isAdmin } = useIsAdmin();
  const { data: rows, isLoading } = useList<Call>("call_logs", rid, "started_at", !!isAdmin);
  const [selected, setSelected] = useState<Call | null>(null);

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
                <TableHead className="text-right">Conversation</TableHead>
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!c.transcript && !c.recording_url}
                        onClick={() => setSelected(c)}
                      >
                        <MessageSquareText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Conversation with {selected?.caller_name ?? "Unknown"}
            </DialogTitle>
            <DialogDescription>
              {selected && new Date(selected.started_at).toLocaleString()} · {selected?.phone}
            </DialogDescription>
          </DialogHeader>

          {selected?.recording_url && (
            <audio controls src={selected.recording_url} className="w-full" />
          )}

          <div className="overflow-y-auto flex-1 space-y-3 pr-2">
            {selected?.transcript ? (
              parseTranscript(selected.transcript).map((line, i) => {
                const isAI = /^(ai|assistant|agent)$/i.test(line.speaker);
                return (
                  <div key={i} className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        isAI
                          ? "bg-muted text-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {line.speaker && (
                        <div className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">
                          {line.speaker}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{line.text}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No transcript available for this call.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
