"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, Pencil, Send, User, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { LinkButton } from "@/components/app/link-button";
import { ErrorState, TableSkeleton } from "@/components/app/states";
import { BloodTypeBadge, StatusBadge } from "@/components/app/status-badge";
import { ReceiveDialog } from "@/components/hospital/receive-dialog";
import { totalBags } from "@/components/hospital/request-items";
import { RequestProgress } from "@/components/hospital/request-progress";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import { bagStatus, bloodGroup, fmtDate, fmtDateTime, priority, productType, requestStatus } from "@/lib/format";
import type { BloodRequestDetail } from "@/lib/types";

export default function HospitalRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: r, isLoading, error } = useQuery({
    queryKey: ["hospital", "request", id],
    queryFn: () => api<BloodRequestDetail>(`/api/shared/blood-request/detail/${id}`),
  });
  const cancel = useApiMutation(() => api(`/api/hospital/blood-request/cancel/${id}`, { method: "PATCH" }), {
    success: "Đã hủy yêu cầu",
    invalidate: [["hospital"]],
    onSuccess: () => router.push("/hospital/requests"),
  });

  if (error) return <ErrorState error={error} />;
  if (isLoading || !r) return <Card><TableSkeleton rows={6} /></Card>;

  const pending = r.status === "CHO_DUYET";
  const approvedTotal = r.requestedItems.reduce((s, i) => s + (i.approvedQuantity ?? 0), 0);
  const bags = r.exportedBags ?? [];

  return (
    <>
      <LinkButton href="/hospital/requests" variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
        <ArrowLeft /> Yêu cầu của tôi
      </LinkButton>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Yêu cầu #{r.requestId}</h1>
            <StatusBadge {...requestStatus[r.status]} />
            {r.priority === "KHAN_CAP" && <StatusBadge {...priority.KHAN_CAP} />}
          </div>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Send className="size-3.5" />Gửi {fmtDateTime(r.requestedDate)}</span>
            <span className="flex items-center gap-1.5"><CalendarClock className="size-3.5" />Cần trước {fmtDate(r.deadlineDate)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pending && r.priority === "BINH_THUONG" && (
            <LinkButton href={`/hospital/requests/${r.requestId}/edit`} variant="outline"><Pencil /> Sửa</LinkButton>
          )}
          {pending && (
            <ConfirmDialog
              trigger={(open) => <Button variant="outline" onClick={open}><XCircle /> Hủy yêu cầu</Button>}
              title={`Hủy yêu cầu #${r.requestId}?`}
              description="Kho máu sẽ không xử lý yêu cầu này nữa. Bạn có thể gửi yêu cầu mới bất cứ lúc nào."
              confirmLabel="Hủy yêu cầu"
              destructive
              onConfirm={() => cancel.mutateAsync(undefined)}
            />
          )}
          {r.status === "DANG_VAN_CHUYEN" && bags.length > 0 && <ReceiveDialog requestId={r.requestId} bags={bags} />}
        </div>
      </div>

      <Card className="mb-6 py-6">
        <CardContent><RequestProgress request={r} /></CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="grid content-start gap-6">
          <Card className="gap-0 p-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Máu đã yêu cầu</CardTitle>
              <CardDescription>{totalBags(r.requestedItems)} túi · kho duyệt {approvedTotal} túi</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nhóm máu</TableHead>
                  <TableHead>Chế phẩm</TableHead>
                  <TableHead>Thể tích</TableHead>
                  <TableHead className="text-right">Yêu cầu</TableHead>
                  <TableHead className="pr-4 text-right">Được duyệt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.requestedItems.map((i) => (
                  <TableRow key={i.detailId}>
                    <TableCell className="pl-4"><BloodTypeBadge value={i.bloodType} /></TableCell>
                    <TableCell>{productType[i.productType]}</TableCell>
                    <TableCell>{i.volume} ml</TableCell>
                    <TableCell className="text-right tabular-nums">{i.quantity}</TableCell>
                    <TableCell className="pr-4 text-right tabular-nums">
                      {i.approvedQuantity === null ? <span className="text-muted-foreground">—</span> : (
                        <span className={i.approvedQuantity < i.quantity ? "font-medium text-amber-700" : "font-medium"}>{i.approvedQuantity}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {bags.length > 0 && (
            <Card className="gap-0 p-0">
              <CardHeader className="border-b py-4">
                <CardTitle>Túi máu được giao</CardTitle>
                <CardDescription>{bags.length} túi</CardDescription>
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

        <Card className="self-start">
          <CardHeader><CardTitle>Thông tin xuất kho</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {r.exportDate ? (
              <>
                <div><p className="text-xs text-muted-foreground">Thời gian xuất</p><p className="font-medium">{fmtDateTime(r.exportDate)}</p></div>
                <div>
                  <p className="text-xs text-muted-foreground">Người xuất</p>
                  <p className="flex items-center gap-1.5 font-medium"><User className="size-3.5" />{r.exportedBy}</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                {pending ? "Yêu cầu đang chờ kho máu duyệt." : r.status.startsWith("DA_DUYET") ? "Kho đang chuẩn bị túi máu để giao." : "Chưa xuất kho."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
