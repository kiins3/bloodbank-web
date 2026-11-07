import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/format";

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

/** Pass a value and its label map entry, e.g. <StatusBadge {...eventStatus[e.status]} />. */
export function StatusBadge({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

export function BloodTypeBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex min-w-9 items-center justify-center rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary">
      {value}
    </span>
  );
}
