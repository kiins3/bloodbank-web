"use client";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { BloodTypeBadge, StatusBadge } from "@/components/app/status-badge";
import { bagStatus, bloodGroup, fmtDateTime, productType } from "@/lib/format";
import type { BloodBagSummary } from "@/lib/types";

/** Bag list used by the lab and storage pages, with optional row selection and a per-row action. */
export function BagTable({
  query,
  empty,
  selected,
  onToggle,
  onToggleAll,
  action,
  showStatus,
  showLocation,
}: {
  query: { data?: BloodBagSummary[]; isLoading: boolean; error: unknown };
  empty: string;
  selected?: Set<number>;
  onToggle?: (id: number) => void;
  onToggleAll?: (ids: number[]) => void;
  action?: (b: BloodBagSummary) => React.ReactNode;
  showStatus?: boolean;
  showLocation?: boolean;
}) {
  const rows = query.data ?? [];
  const selectable = !!selected && !!onToggle;
  const allChecked = selectable && rows.length > 0 && rows.every((r) => selected!.has(r.bloodBagId));
  return (
    <Card className="gap-0 p-0">
      {!!query.error && <div className="p-4"><ErrorState error={query.error} /></div>}
      {query.isLoading && <TableSkeleton />}
      {query.data && rows.length === 0 && <EmptyState title={empty} />}
      {rows.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-10 pl-4">
                  <input type="checkbox" className="size-4 accent-[var(--primary)]" aria-label="Chọn tất cả" checked={allChecked}
                    onChange={() => onToggleAll?.(allChecked ? [] : rows.map((r) => r.bloodBagId))} />
                </TableHead>
              )}
              <TableHead className={selectable ? "" : "pl-4"}>Túi</TableHead>
              <TableHead>Nhóm máu</TableHead>
              <TableHead>Chế phẩm</TableHead>
              <TableHead>Ngày lấy</TableHead>
              {showLocation && <TableHead>Vị trí</TableHead>}
              {showStatus && <TableHead>Trạng thái</TableHead>}
              {action && <TableHead className="pr-4 text-right">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((b) => (
              <TableRow key={b.bloodBagId} data-state={selected?.has(b.bloodBagId) ? "selected" : undefined}>
                {selectable && (
                  <TableCell className="pl-4">
                    <input type="checkbox" className="size-4 accent-[var(--primary)]" aria-label={`Chọn túi ${b.bloodBagId}`}
                      checked={selected!.has(b.bloodBagId)} onChange={() => onToggle!(b.bloodBagId)} />
                  </TableCell>
                )}
                <TableCell className={selectable ? "font-mono text-xs" : "pl-4 font-mono text-xs"}>#{b.bloodBagId}</TableCell>
                <TableCell>{b.bloodType ? <BloodTypeBadge value={bloodGroup(b.bloodType, b.rhFactor)} /> : <span className="text-xs text-muted-foreground">Chưa xác định</span>}</TableCell>
                <TableCell>{productType[b.productType]}</TableCell>
                <TableCell>{fmtDateTime(b.collectedAt)}</TableCell>
                {showLocation && <TableCell className="text-muted-foreground">{b.storageLocation}</TableCell>}
                {showStatus && <TableCell><StatusBadge {...bagStatus[b.status]} /></TableCell>}
                {action && <TableCell className="pr-4 text-right">{action(b)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

/** Small helper for Set-based row selection. */
export function toggleIn(set: Set<number>, id: number) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
