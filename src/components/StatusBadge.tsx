import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  confirmed: "bg-success/15 text-success",
  pending: "bg-warning/20 text-warning-foreground",
  cancelled: "bg-destructive/15 text-destructive",
  preparing: "bg-info/15 text-info",
  ready: "bg-warning/20 text-warning-foreground",
  delivered: "bg-success/15 text-success",
  Resolved: "bg-success/15 text-success",
  Booked: "bg-success/15 text-success",
  Missed: "bg-warning/20 text-warning-foreground",
  Failed: "bg-destructive/15 text-destructive",
  Active: "bg-info/15 text-info",
  Pending: "bg-warning/20 text-warning-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        map[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}
