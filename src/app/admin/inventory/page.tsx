"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Droplet, FlaskConical, Layers, Thermometer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NativeSelect, toOptions } from "@/components/app/native-select";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { BloodTypeBadge, StatusBadge } from "@/components/app/status-badge";
import { api, qs } from "@/lib/api";
import { BLOOD_TYPES, bagStatus, bloodGroup, fmtDateTime, productType, testValue } from "@/lib/format";
import type { BloodBagStatus, BloodBagSummary, ProductType, TestValue } from "@/lib/types";

type BagDetail = {
  donorName: string | null;
  collectedAt: string;
  expirationDate: string | null;
  bloodType: string | null;
  rhFactor: string | null;
  actualVolume: number | null;
  bagCode: string;
  barcodeBase64: string | null;
  hiv: TestValue | null;
  hbv: TestValue | null;
  hcv: TestValue | null;
  syphilis: TestValue | null;
  malaria: TestValue | null;
  finalConclusion: string | null;
  storageLocation: string;
  status: BloodBagStatus;
  productType: ProductType;
};

const tests: [keyof BagDetail, string][] = [["hiv", "HIV"], ["hbv", "Viêm gan B"], ["hcv", "Viêm gan C"], ["syphilis", "Giang mai"], ["malaria", "Sốt rét"]];

function BagSheet({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data: b } = useQuery({
    queryKey: ["bag", id],
    queryFn: () => api<BagDetail>(`/api/staff/bloodbag/get-blood-bag-detail/${id}`),
    enabled: id !== null,
  });
  return (
    <Sheet open={id !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-mono">{b?.bagCode ?? "Túi máu"}</SheetTitle>
          <SheetDescription>{b ? `${productType[b.productType]} · ${b.storageLocation}` : ""}</SheetDescription>
        </SheetHeader>
        {b && (
          <div className="grid gap-5 px-4 pb-6">
            {b.barcodeBase64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`data:image/png;base64,${b.barcodeBase64}`} alt={`Mã vạch ${b.bagCode}`} className="h-16 w-full rounded-md border bg-white object-contain p-2" />
            )}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-xs text-muted-foreground">Nhóm máu</p>
                <p className="text-2xl font-bold text-primary">{bloodGroup(b.bloodType, b.rhFactor)}</p>
              </div>
              <StatusBadge {...bagStatus[b.status]} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">Người hiến</dt><dd className="font-medium">{b.donorName ?? "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Thể tích lấy</dt><dd className="font-medium">{b.actualVolume ? `${b.actualVolume} ml` : "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Ngày lấy</dt><dd className="font-medium">{fmtDateTime(b.collectedAt)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Hạn dùng</dt><dd className="font-medium">{fmtDateTime(b.expirationDate)}</dd></div>
            </dl>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Kết quả xét nghiệm</h3>
                {b.finalConclusion && <span className="text-xs font-medium">{b.finalConclusion}</span>}
              </div>
              <div className="grid gap-1.5">
                {tests.map(([k, label]) => {
                  const v = b[k] as TestValue | null;
                  return (
                    <div key={k} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span>{label}</span>
                      {v ? <StatusBadge {...testValue[v]} /> : <span className="text-xs text-muted-foreground">Chưa có</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

const groupOptions = BLOOD_TYPES.flatMap((t) => ["+", "-"].map((rh) => ({ value: `${t}${rh}`, label: `${t}${rh}` })));

export default function InventoryPage() {
  const [group, setGroup] = useState("");
  const [ptype, setPtype] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const all = useQuery({ queryKey: ["bags", "all"], queryFn: () => api<BloodBagSummary[]>("/api/staff/bloodbag/get-list-blood-bag") });
  const filtered = useQuery({
    queryKey: ["bags", group, ptype, status],
    queryFn: () =>
      api<BloodBagSummary[]>(
        `/api/staff/bloodbag/get-list-blood-bag${qs({
          bloodType: group.replace(/[+-]$/, "") || undefined,
          rhFactor: group ? group.slice(-1) : undefined,
          productType: ptype,
          status,
        })}`,
      ),
  });

  const ready = (all.data ?? []).filter((b) => b.status === "SAN_SANG");
  const count = (t: ProductType) => ready.filter((b) => b.productType === t).length;
  const pendingLab = (all.data ?? []).filter((b) => b.status === "CHO_XET_NGHIEM" || b.status === "CHO_TACH_CHIET").length;
  const rows = [...(filtered.data ?? [])].sort((a, b) => b.bloodBagId - a.bloodBagId);

  return (
    <>
      <PageHeader title="Kho máu" description="Toàn bộ túi máu và chế phẩm, từ lúc lấy đến khi xuất cho bệnh viện." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Hồng cầu sẵn sàng" value={count("TUI_HONG_CAU")} icon={Droplet} loading={all.isLoading} />
        <StatCard label="Huyết tương sẵn sàng" value={count("TUI_HUYET_TUONG")} icon={Layers} accent="amber" loading={all.isLoading} />
        <StatCard label="Tiểu cầu sẵn sàng" value={count("TUI_TIEU_CAU")} icon={Thermometer} accent="violet" loading={all.isLoading} />
        <StatCard label="Đang xét nghiệm / chờ tách" value={pendingLab} icon={FlaskConical} accent="sky" loading={all.isLoading} />
      </div>

      <Card className="mt-6 gap-0 p-0">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <NativeSelect className="w-36" placeholder="Mọi nhóm máu" options={groupOptions} value={group} onChange={(e) => setGroup(e.target.value)} />
          <NativeSelect className="w-44" placeholder="Mọi chế phẩm" options={toOptions(productType)} value={ptype} onChange={(e) => setPtype(e.target.value)} />
          <NativeSelect className="w-44" placeholder="Mọi trạng thái" options={toOptions(bagStatus)} value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
        {filtered.error && <div className="p-4"><ErrorState error={filtered.error} /></div>}
        {filtered.isLoading && <TableSkeleton />}
        {filtered.data && rows.length === 0 && <EmptyState title="Không có túi máu phù hợp" />}
        {rows.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Mã</TableHead>
                <TableHead>Nhóm máu</TableHead>
                <TableHead>Chế phẩm</TableHead>
                <TableHead>Ngày lấy</TableHead>
                <TableHead>Vị trí</TableHead>
                <TableHead className="pr-4">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.bloodBagId} className="cursor-pointer" onClick={() => setSelected(b.bloodBagId)}>
                  <TableCell className="pl-4 font-mono text-xs">#{b.bloodBagId}</TableCell>
                  <TableCell>{b.bloodType ? <BloodTypeBadge value={bloodGroup(b.bloodType, b.rhFactor)} /> : "—"}</TableCell>
                  <TableCell>{productType[b.productType]}</TableCell>
                  <TableCell>{fmtDateTime(b.collectedAt)}</TableCell>
                  <TableCell className="text-muted-foreground">{b.storageLocation}</TableCell>
                  <TableCell className="pr-4"><StatusBadge {...bagStatus[b.status]} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {rows.length > 0 && <p className="border-t px-4 py-3 text-xs text-muted-foreground">{rows.length} túi máu</p>}
      </Card>
      <BagSheet id={selected} onClose={() => setSelected(null)} />
    </>
  );
}
