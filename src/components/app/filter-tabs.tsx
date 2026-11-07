import { cn } from "@/lib/utils";

/** Segmented status filter with counts. */
export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
  counts,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  counts?: Partial<Record<T, number>>;
}) {
  return (
    <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === t.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
          {counts && <span className="ml-1 text-xs text-muted-foreground">{counts[t.value] ?? 0}</span>}
        </button>
      ))}
    </div>
  );
}
