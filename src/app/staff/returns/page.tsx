"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NativeSelect, toOptions } from "@/components/app/native-select";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { BloodTypeBadge, StatusBadge } from "@/components/app/status-badge";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useStaffProfile } from "@/hooks/use-staff";
import { api, qs } from "@/lib/api";
import { bagStatus, bloodGroup, fmtDate, fmtDateTime, productType, returnAction } from "@/lib/format";
import type { BulkInspectResult, Page, ReturnAction, ReturnLogItem, ReturnOrder } from "@/lib/types";
import { cn } from "@/lib/utils";

type Decision = { action: "TIEU_HUY" | "KIEM_DINH"; reason: string };

function ReturnSheet({ orderId, onClose }: { orderId: number | null; onClose: () => void }) {
  const profile = useStaffProfile();
  const { data, isLoading } = useQuery({
    queryKey: ["staff", "return", orderId],
    queryFn: () => api<ReturnOrder>(`/api/staff/return-log/return-detail/${orderId}`),
    enabled: orderId !== null,
  });
  const [decisions, setDecisions] = useState<Record<number, Decision>>({});
  const pending = (data?.bags ?? []).filter((b) => !b.actionTaken || b.actionTaken === "DANG_CHO");
  const decide = (id: number, d: Decision) => setDecisions((s) => ({ ...s, [id]: d }));
  const decisionFor = (b: ReturnOrder["bags"][number]): Decision =>
    decisions[b.bloodBagId] ?? { action: b.expired ? "TIEU_HUY" : "KIEM_DINH", reason: b.reason ?? "" };

  const inspect = useApiMutation(
    () =>
      api<BulkInspectResult>("/api/staff/return-log/inspect", {
        method: "POST",
        // The endpoint identifies the inspector by header rather than by token.
        headers: { "X-Staff-Id": String(profile.data?.staffId ?? "") },
        body: { returnOrderId: orderId, items: pending.map((b) => ({ bloodBagId: b.bloodBagId, ...decisionFor(b) })) },
      }),
    {
      invalidate: [["staff"]],
      onSuccess: (r) => {
        toast.success(r.summary);
        r.errors.forEach((e) => toast.error(e));
        setDecisions({});
      },
    },
  );

  return (
    <Sheet open={orderId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Đơn hoàn trả #{orderId}</SheetTitle>
          <SheetDescription>{data ? `${data.hospitalName} · ${fmtDateTime(data.createdAt)}` : "Đang tải…"}</SheetDescription>
        </SheetHeader>
        {isLoading && <TableSkeleton rows={3} />}
        {data && (
          <div className="grid gap-4 px-4 pb-6">
            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              Kiểm tra túi thực tế. Túi hết hạn hoặc có lý do hỏng, rách, vỡ, thủng luôn chuyển sang tiêu hủy; túi còn lại chuyển cho kỹ thuật kiểm định.
            </p>
            {data.bags.map((b) => {
              const done = b.actionTaken && b.actionTaken !== "DANG_CHO";
              const d = decisionFor(b);
              return (
                <div key={b.bloodBagId} className="grid gap-3 rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <BloodTypeBadge value={bloodGroup(b.bloodType, b.rhFactor)} />
                      <div>
                        <p className="font-mono text-sm font-medium">{b.bagCode}</p>
                        <p className="text-xs text-muted-foreground">{productType[b.productType]} · {b.volume} ml · HSD {fmtDate(b.expiredAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge {...bagStatus[b.currentStatus]} />
                      {b.expired && <span className="flex items-center gap-1 text-xs text-rose-600"><AlertTriangle className="size-3" />Hết hạn</span>}
                    </div>
                  </div>
                  {b.reason && <p className="text-sm"><span className="text-muted-foreground">Bệnh viện ghi: </span>{b.reason}</p>}
                  {done ? (
                    <StatusBadge {...returnAction[b.actionTaken as ReturnAction]} className="w-fit" />
                  ) : (
                    <div className="grid gap-2">
                      <div className="flex rounded-md bg-muted p-0.5 text-xs font-medium">
                        {(["KIEM_DINH", "TIEU_HUY"] as const).map((a) => (
                          <button key={a} type="button" disabled={b.expired && a === "KIEM_DINH"} onClick={() => decide(b.bloodBagId, { ...d, action: a })}
                            className={cn("flex-1 rounded px-2 py-1.5 disabled:opacity-40", d.action === a ? (a === "TIEU_HUY" ? "bg-rose-600 text-white" : "bg-background shadow-sm") : "text-muted-foreground")}>
                            {a === "KIEM_DINH" ? "Chuyển kiểm định" : "Tiêu hủy"}
                          </button>
                        ))}
                      </div>
                      <Input placeholder="Ghi chú kiểm tra" value={d.reason} onChange={(e) => decide(b.bloodBagId, { ...d, reason: e.target.value })} />
                    </div>
                  )}
                </div>
              );
            })}
            {pending.length > 0 ? (
              <Button onClick={() => inspect.mutate(undefined)} disabled={inspect.isPending || !profile.data}>
                {inspect.isPending && <Loader2 className="animate-spin" />} Xác nhận kiểm tra {pending.length} túi
              </Button>
            ) : (
              <p className="text-center text-sm text-muted-foreground">Đơn đã xử lý xong{data.processedBy ? ` bởi ${data.processedBy}` : ""}.</p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function ReturnsPage() {
  const [action, setAction] = useState("");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["staff", "returns", action, page],
    queryFn: () => api<Page<ReturnLogItem>>(`/api/staff/return-log/list-return${qs({ action, page, size: 15, sort: "createdAt,desc" })}`),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Hoàn trả" description="Túi bệnh viện trả lại khi nhận máu. Kiểm tra rồi chuyển tiêu hủy hoặc kiểm định." />
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <NativeSelect className="w-48" placeholder="Mọi trạng thái" options={toOptions(returnAction)} value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }} />
        </div>
        {error && <div className="p-4"><ErrorState error={error} /></div>}
        {isLoading && <TableSkeleton />}
        {data && data.content.length === 0 && <EmptyState title="Không có túi hoàn trả" />}
        {data && data.content.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Mã túi</TableHead>
                <TableHead>Bệnh viện</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Ngày trả</TableHead>
                <TableHead className="pr-4">Xử lý</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((r) => (
                <TableRow key={`${r.logId}-${r.bloodBagId}`} className="cursor-pointer" onClick={() => setOpen(r.logId)}>
                  <TableCell className="pl-4">
                    <p className="font-mono text-xs font-medium">{r.bagCode}</p>
                    <p className="text-xs text-muted-foreground">{productType[r.productType]}</p>
                  </TableCell>
                  <TableCell><span className="flex items-center gap-1.5"><Building2 className="size-3.5 text-muted-foreground" />{r.hospitalName}</span></TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground">{r.reason ?? "—"}</TableCell>
                  <TableCell>{fmtDateTime(r.createdAt)}</TableCell>
                  <TableCell className="pr-4"><StatusBadge {...returnAction[r.actionTaken ?? "DANG_CHO"]} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {data && <Pagination page={page} totalPages={data.page.totalPages} totalElements={data.page.totalElements} onChange={setPage} />}
      </Card>
      <ReturnSheet key={open ?? "none"} orderId={open} onClose={() => setOpen(null)} />
    </>
  );
}
