"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRightLeft, Loader2, PackagePlus, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FilterTabs } from "@/components/app/filter-tabs";
import { NativeSelect, toOptions } from "@/components/app/native-select";
import { PageHeader } from "@/components/app/page-header";
import { BagTable, toggleIn } from "@/components/staff/bag-table";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useBags } from "@/hooks/use-staff";
import { api } from "@/lib/api";
import { percent, productType } from "@/lib/format";
import type { Equipment, ProductType } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "incoming" | "stored";

/** Picks a fridge that matches the selected bags' product type and has room for them. */
function EquipmentPicker({
  equipment, type, count, value, onChange, excludeLocation,
}: {
  equipment: Equipment[]; type: ProductType | null; count: number; value: number | null; onChange: (id: number) => void; excludeLocation?: string;
}) {
  const options = equipment.filter((e) => e.status === "ACTIVE" && (!type || e.productType === type) && e.name !== excludeLocation);
  if (!type) return <p className="text-sm text-muted-foreground">Chọn túi cùng một loại chế phẩm để xem tủ phù hợp.</p>;
  if (!options.length) return <p className="text-sm text-amber-700">Không có tủ đang hoạt động cho {productType[type].toLowerCase()}.</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((e) => {
        const free = e.maxCapacity - e.currentLoad;
        const fits = free >= count;
        return (
          <button
            key={e.equipmentId}
            type="button"
            disabled={!fits}
            onClick={() => onChange(e.equipmentId)}
            className={cn(
              "grid gap-2 rounded-lg border p-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              value === e.equipmentId ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
            )}
          >
            <span className="flex items-center gap-2 font-medium"><Thermometer className="size-4 text-sky-600" />{e.name}</span>
            <Progress value={percent(e.currentLoad, e.maxCapacity)} />
            <span className="text-xs text-muted-foreground">{fits ? `Còn ${free} chỗ` : `Chỉ còn ${free} chỗ, không đủ cho ${count} túi`}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function StoragePage() {
  const [tab, setTab] = useState<Tab>("incoming");
  const [ptype, setPtype] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [target, setTarget] = useState<number | null>(null);

  const incoming = useBags("CHO_BAO_QUAN");
  const stored = useBags("SAN_SANG");
  const equipment = useQuery({ queryKey: ["staff", "equipment"], queryFn: () => api<Equipment[]>("/api/staff/storage-equipment/list-equipment") });

  const source = tab === "incoming" ? incoming : stored;
  const filtered = useMemo(
    () => ({ ...source, data: source.data?.filter((b) => !ptype || b.productType === ptype) }),
    [source, ptype],
  );
  const picked = (source.data ?? []).filter((b) => selected.has(b.bloodBagId));
  const types = new Set(picked.map((b) => b.productType));
  const type = types.size === 1 ? [...types][0] : null;
  const locations = new Set(picked.map((b) => b.storageLocation));

  const reset = () => { setSelected(new Set()); setTarget(null); };
  const store = useApiMutation(
    () => api<string>(tab === "incoming" ? `/api/staff/bloodbag/store-blood/${target}` : `/api/staff/bloodbag/transfer-storage/${target}`, {
      method: tab === "incoming" ? "POST" : "PATCH",
      body: [...selected],
    }),
    { invalidate: [["staff"], ["equipment"]], onSuccess: (m) => { toast.success(typeof m === "string" ? m : "Đã lưu"); reset(); } },
  );

  return (
    <>
      <PageHeader title="Nhập kho & bảo quản" description="Cất túi đã in nhãn vào đúng tủ, hoặc chuyển túi giữa các tủ cùng loại." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={[{ value: "incoming", label: "Chờ nhập kho" }, { value: "stored", label: "Đang trong kho" }]}
          value={tab}
          onChange={(t) => { setTab(t); reset(); }}
          counts={{ incoming: incoming.data?.length ?? 0, stored: stored.data?.length ?? 0 }}
        />
        <NativeSelect className="w-48" placeholder="Mọi chế phẩm" options={toOptions(productType)} value={ptype} onChange={(e) => { setPtype(e.target.value); reset(); }} />
      </div>

      {selected.size > 0 && (
        <Card className="mb-4 gap-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">
              <span className="font-medium">{selected.size} túi</span>
              {type ? ` · ${productType[type]}` : types.size > 1 ? " · nhiều loại chế phẩm, chọn lại cùng một loại" : ""}
            </p>
            <Button onClick={() => store.mutate(undefined)} disabled={!target || !type || store.isPending}>
              {store.isPending ? <Loader2 className="animate-spin" /> : tab === "incoming" ? <PackagePlus /> : <ArrowRightLeft />}
              {tab === "incoming" ? "Nhập vào tủ" : "Chuyển sang tủ"}
            </Button>
          </div>
          <EquipmentPicker
            equipment={equipment.data ?? []}
            type={type}
            count={selected.size}
            value={target}
            onChange={setTarget}
            excludeLocation={tab === "stored" && locations.size === 1 ? [...locations][0] : undefined}
          />
        </Card>
      )}

      <BagTable
        query={filtered}
        empty={tab === "incoming" ? "Không có túi chờ nhập kho" : "Kho trống"}
        selected={selected}
        onToggle={(id) => { setSelected((s) => toggleIn(s, id)); setTarget(null); }}
        onToggleAll={(ids) => { setSelected(new Set(ids)); setTarget(null); }}
        showLocation={tab === "stored"}
      />
    </>
  );
}
