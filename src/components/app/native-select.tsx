import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

/** Styled native <select>: reliable on every device and easy to drive from forms. */
export function NativeSelect({
  options,
  placeholder,
  className,
  ...props
}: React.ComponentProps<"select"> & { options: Option[]; placeholder?: string }) {
  return (
    <div className={cn("relative", className)}>
      <select
        className="h-8 w-full appearance-none rounded-lg border border-input bg-transparent pr-8 pl-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function toOptions<T extends string>(map: Record<T, string | { label: string }>): Option[] {
  return (Object.entries(map) as [T, string | { label: string }][]).map(([value, v]) => ({
    value,
    label: typeof v === "string" ? v : v.label,
  }));
}
