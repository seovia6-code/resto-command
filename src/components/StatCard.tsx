import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down";
  icon: LucideIcon;
  tone?: "primary" | "info" | "success" | "warning" | "destructive" | "accent";
};

const toneMap: Record<NonNullable<Props["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  destructive: "bg-destructive/10 text-destructive",
  accent: "bg-accent text-accent-foreground",
};

export function StatCard({ label, value, change, trend, icon: Icon, tone = "primary" }: Props) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elegant)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">{label}</p>
          <p className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight truncate">{value}</p>
          {change && (
            <p
              className={cn(
                "mt-1.5 text-xs font-medium",
                trend === "up" ? "text-success" : "text-destructive"
              )}
            >
              {trend === "up" ? "▲" : "▼"} {change}
            </p>
          )}
        </div>
        <div className={cn("h-10 w-10 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center shrink-0", toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
