import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "rose",
  loading,
}: {
  label: string;
  value?: number | string;
  hint?: string;
  icon: LucideIcon;
  accent?: "rose" | "emerald" | "amber" | "sky" | "violet";
  loading?: boolean;
}) {
  const accents = {
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <Card className="flex flex-row items-start justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-16" />
        ) : (
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{value ?? "—"}</p>
        )}
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className={cn("rounded-lg p-2.5", accents[accent])}>
        <Icon className="size-5" />
      </div>
    </Card>
  );
}
