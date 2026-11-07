import { BloodTypeBadge } from "@/components/app/status-badge";
import { productType } from "@/lib/format";
import type { RequestItem } from "@/lib/types";

/** Compact "A+ Hồng cầu ×2" chips for list rows. */
export function RequestItemChips({ items }: { items: RequestItem[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i.detailId} className="inline-flex items-center gap-1.5 rounded-md border bg-background px-1.5 py-0.5 text-xs">
          <BloodTypeBadge value={i.bloodType} />
          {productType[i.productType]} <span className="text-muted-foreground">×{i.quantity}</span>
        </span>
      ))}
    </div>
  );
}

export const totalBags = (items: RequestItem[]) => items.reduce((s, i) => s + i.quantity, 0);
