"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Building2, CalendarClock, Check, CheckCircle2, Loader2, ScanLine, Send, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { LinkButton } from "@/components/app/link-button";
import { ErrorState, TableSkeleton } from "@/components/app/states";
import { BloodTypeBadge, StatusBadge } from "@/components/app/status-badge";
import { RequestProgress } from "@/components/hospital/request-progress";
import { QrScanner } from "@/components/staff/qr-scanner";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useBags } from "@/hooks/use-staff";
import { api } from "@/lib/api";
import { bagStatus, bloodGroup, fmtDate, fmtDateTime, priority, productType, requestStatus } from "@/lib/format";
import type { BloodRequestDetail, RequestItem, SuggestedBag } from "@/lib/types";
import { cn } from "@/lib/utils";

const REVIEWABLE = ["CHO_DUYET", "DA_DUYET_TOAN_BO", "DA_DUYET_MOT_PHAN", "DA_TU_CHOI"];
const EXPORTABLE = ["DA_DUYET_TOAN_BO", "DA_DUYET_MOT_PHAN"];

const matches = (item: RequestItem, bag: Pick<SuggestedBag, "productType" | "bloodType" | "rhFactor" | "volume">) =>
  item.productType === bag.productType && item.bloodType === `${bag.bloodType}${bag.rhFactor}` && item.volume === bag.volume;

function ReviewCard({ request }: { request: BloodRequestDetail }) {
  const ready = useBags("SAN_SANG");
  // Ready stock per line (same group and product; the warehouse also checks bag volume when exporting).
  const stock = (i: RequestItem) =>
    (ready.data ?? []).filter((b) => b.productType === i.productType && bloodGroup(b.bloodType, b.rhFactor) === i.bloodType).length;
  const [qty, setQty] = useState<Record<number, string>>({});
  const value = (i: RequestItem) => qty[i.detailId] ?? String(i.approvedQuantity ?? Math.min(i.quantity, stock(i)));

  const review = useApiMutation(
    (zero: boolean) =>
      api(`/api/staff/blood-request/review-request/${request.requestId}`, {
        method: "PATCH",
        body: { approvedDetails: request.requestedItems.map((i) => ({ detailId: i.detailId, approvedQuantity: zero ? 0 : Number(value(i)) || 0 })) },
      }),
    {
      invalidate: [["staff"]],
      onSuccess: (_r, zero) => toast.success(zero ? "Đã từ chối yêu cầu" : "Đã duyệt. Chuyển sang quét túi để xuất kho."),
    },
  );
  const over = request.requestedItems.some((i) => Number(value(i)) > i.quantity);

  return (
    <Card className="gap-0 p-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Duyệt số lượng</CardTitle>
        <CardDescription>Gợi ý theo tồn kho sẵn sàng. Duyệt 0 cho tất cả nghĩa là từ chối.</CardDescription>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Nhóm máu</TableHead>
            <TableHead>Chế phẩm</TableHead>
            <TableHead className="text-right">Yêu cầu</TableHead>
            <TableHead className="text-right">Tồn kho</TableHead>
            <TableHead className="w-28 pr-4 text-right">Duyệt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {request.requestedItems.map((i) => {
            const s = stock(i);
            return (
              <TableRow key={i.detailId}>
                <TableCell className="pl-4"><BloodTypeBadge value={i.bloodType} /></TableCell>
                <TableCell>{productType[i.productType]} · {i.volume} ml</TableCell>
                <TableCell className="text-right tabular-nums">{i.quantity}</TableCell>
                <TableCell className={cn("text-right tabular-nums", s < i.quantity && "font-medium text-amber-700")}>{ready.isLoading ? "…" : s}</TableCell>
                <TableCell className="pr-4">
                  <Input type="number" min={0} max={i.quantity} className="ml-auto h-8 w-20 text-right" value={value(i)}
                    onChange={(e) => setQty((q) => ({ ...q, [i.detailId]: e.target.value }))} aria-label={`Duyệt ${i.bloodType}`} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t p-4">
        {over && <p className="mr-auto text-xs text-destructive">Số duyệt không được vượt số yêu cầu.</p>}
        <ConfirmDialog
          trigger={(o) => <Button variant="outline" onClick={o}><XCircle /> Từ chối</Button>}
          title={`Từ chối yêu cầu #${request.requestId}?`}
          description="Bệnh viện sẽ thấy yêu cầu bị từ chối."
          confirmLabel="Từ chối"
          destructive
          onConfirm={() => review.mutateAsync(true)}
        />
        <Button onClick={() => review.mutate(false)} disabled={review.isPending || over}>
          {review.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Duyệt
        </Button>
      </div>
    </Card>
  );
}

function ExportCard({ request }: { request: BloodRequestDetail }) {
  const suggested = useQuery({
    queryKey: ["staff", "suggested", request.requestId],
    queryFn: () => api<SuggestedBag[]>(`/api/staff/blood-request/list-suggested-bag/${request.requestId}`),
  });
  const [scanned, setScanned] = useState<SuggestedBag[]>([]);
  const [code, setCode] = useState("");
  const items = request.requestedItems.filter((i) => (i.approvedQuantity ?? 0) > 0);

  const countFor = useCallback((i: RequestItem, list: SuggestedBag[]) => list.filter((b) => matches(i, b)).length, []);

  const scan = useApiMutation(
    async (bagCode: string) => {
      const bag = suggested.data?.find((b) => b.bagCode.toUpperCase() === bagCode.toUpperCase());
      // The backend validates the bag; the suggestion list maps its code to an id for export.
      await api(`/api/staff/blood-request/scan-blood-bag/${request.requestId}`, { method: "POST", body: { bagCode } });
      if (!bag) throw new Error("Túi hợp lệ nhưng không có trong danh sách gợi ý. Hãy chọn túi trong danh sách.");
      return bag;
    },
    {
      onSuccess: (bag) => {
        setCode("");
        if (scanned.some((b) => b.bloodBagId === bag.bloodBagId)) return toast.info(`Túi ${bag.bagCode} đã được quét`);
        const item = items.find((i) => matches(i, bag));
        if (item && countFor(item, scanned) >= (item.approvedQuantity ?? 0))
          return toast.warning(`Đã đủ số túi cho ${item.bloodType} ${productType[item.productType].toLowerCase()}`);
        toast.success(`Đã quét ${bag.bagCode}`);
        setScanned([...scanned, bag]);
      },
    },
  );
  const { mutate: doScan } = scan;
  const onCamera = useCallback((c: string) => doScan(c), [doScan]);

  const exportMut = useApiMutation(
    () => api(`/api/staff/blood-request/export-blood/${request.requestId}`, { method: "POST", body: { bloodBagId: scanned.map((b) => b.bloodBagId) } }),
    { success: "Đã xuất kho. Bệnh viện sẽ xác nhận khi nhận máu.", invalidate: [["staff"]] },
  );

  const complete = items.every((i) => countFor(i, scanned) === i.approvedQuantity);
  const scannedIds = useMemo(() => new Set(scanned.map((b) => b.bloodBagId)), [scanned]);

  return (
    <Card className="gap-0 p-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center gap-2"><ScanLine className="size-4 text-primary" /> Quét túi để xuất kho</CardTitle>
        <CardDescription>Danh sách gợi ý theo hạn dùng gần nhất trước (FEFO). Quét mã vạch hoặc bấm chọn từng túi.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 py-4">
        <div className="flex flex-wrap gap-2">
          <form className="flex flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); if (code.trim()) scan.mutate(code.trim()); }}>
            <Input autoFocus placeholder="Mã túi, ví dụ BG12-RBC" value={code} onChange={(e) => setCode(e.target.value)} className="font-mono uppercase" />
            <Button type="submit" variant="outline" disabled={!code.trim() || scan.isPending}>{scan.isPending ? <Loader2 className="animate-spin" /> : "Quét"}</Button>
          </form>
          <QrScanner onResult={onCamera} label="Camera" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((i) => {
            const n = countFor(i, scanned);
            const done = n === i.approvedQuantity;
            return (
              <div key={i.detailId} className={cn("flex items-center justify-between rounded-lg border p-3 text-sm", done && "border-emerald-300 bg-emerald-50")}>
                <span className="flex items-center gap-2"><BloodTypeBadge value={i.bloodType} />{productType[i.productType]}</span>
                <span className="flex items-center gap-1.5 font-medium tabular-nums">{done && <Check className="size-4 text-emerald-600" />}{n}/{i.approvedQuantity}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
      {suggested.isLoading && <TableSkeleton rows={3} />}
      {suggested.data && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Mã túi</TableHead>
              <TableHead>Nhóm máu</TableHead>
              <TableHead>Chế phẩm</TableHead>
              <TableHead>Hạn dùng</TableHead>
              <TableHead>Vị trí</TableHead>
              <TableHead className="pr-4 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {suggested.data.map((b) => {
              const picked = scannedIds.has(b.bloodBagId);
              return (
                <TableRow key={b.bloodBagId} data-state={picked ? "selected" : undefined}>
                  <TableCell className="pl-4 font-mono text-xs">
                    {b.bagCode}
                    {b.suggested && !picked && <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 font-sans text-[10px] font-medium text-primary">Gợi ý</span>}
                  </TableCell>
                  <TableCell><BloodTypeBadge value={bloodGroup(b.bloodType, b.rhFactor)} /></TableCell>
                  <TableCell>{productType[b.productType]} · {b.volume} ml</TableCell>
                  <TableCell>{fmtDate(b.expiryDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{b.storageLocation}</TableCell>
                  <TableCell className="pr-4 text-right">
                    {picked ? (
                      <Button size="sm" variant="ghost" onClick={() => setScanned((l) => l.filter((x) => x.bloodBagId !== b.bloodBagId))}>Bỏ chọn</Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={scan.isPending} onClick={() => scan.mutate(b.bagCode)}>Chọn</Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      <div className="flex items-center justify-between gap-3 border-t p-4">
        <p className="text-sm text-muted-foreground">Đã chọn {scanned.length} túi</p>
        <Button onClick={() => exportMut.mutate(undefined)} disabled={!complete || exportMut.isPending}>
          {exportMut.isPending ? <Loader2 className="animate-spin" /> : <Truck />} Xuất kho
        </Button>
      </div>
    </Card>
  );
}

export default function StaffRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: r, isLoading, error } = useQuery({
    queryKey: ["staff", "request", id],
    queryFn: () => api<BloodRequestDetail>(`/api/shared/blood-request/detail/${id}`),
  });

  if (error) return <ErrorState error={error} />;
  if (isLoading || !r) return <Card><TableSkeleton rows={6} /></Card>;
  const bags = r.exportedBags ?? [];

  return (
    <>
      <LinkButton href="/staff/requests" variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground"><ArrowLeft /> Yêu cầu máu</LinkButton>
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Yêu cầu #{r.requestId}</h1>
          <StatusBadge {...requestStatus[r.status]} />
          {r.priority === "KHAN_CAP" && <StatusBadge {...priority.KHAN_CAP} />}
        </div>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Building2 className="size-3.5" />{r.hospitalName}</span>
          <span className="flex items-center gap-1.5"><Send className="size-3.5" />Gửi {fmtDateTime(r.requestedDate)}</span>
          <span className="flex items-center gap-1.5"><CalendarClock className="size-3.5" />Cần trước {fmtDate(r.deadlineDate)}</span>
        </p>
      </div>
      <Card className="mb-6 py-6"><CardContent><RequestProgress request={r} /></CardContent></Card>

      <div className="grid gap-6">
        {REVIEWABLE.includes(r.status) && <ReviewCard key={r.status} request={r} />}
        {EXPORTABLE.includes(r.status) && <ExportCard request={r} />}
        {bags.length > 0 && (
          <Card className="gap-0 p-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Túi đã xuất</CardTitle>
              <CardDescription>{fmtDateTime(r.exportDate)} · {r.exportedBy}</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Túi</TableHead>
                  <TableHead>Nhóm máu</TableHead>
                  <TableHead>Chế phẩm</TableHead>
                  <TableHead>Hạn dùng</TableHead>
                  <TableHead className="pr-4">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bags.map((b) => (
                  <TableRow key={b.bloodBagId}>
                    <TableCell className="pl-4 font-mono text-xs">#{b.bloodBagId}</TableCell>
                    <TableCell><BloodTypeBadge value={bloodGroup(b.bloodType, b.rhFactor)} /></TableCell>
                    <TableCell>{productType[b.productType]} · {b.volume} ml</TableCell>
                    <TableCell>{fmtDate(b.expiredAt)}</TableCell>
                    <TableCell className="pr-4">
                      <StatusBadge {...bagStatus[b.status]} />
                      {b.returnReasonNote && <p className="mt-1 text-xs text-muted-foreground">{b.returnReasonNote}</p>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </>
  );
}
