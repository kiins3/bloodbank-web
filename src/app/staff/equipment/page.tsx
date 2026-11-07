"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Thermometer, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import { equipmentStatus, percent, productType } from "@/lib/format";
import type { Equipment } from "@/lib/types";

/** Reports a broken fridge. The backend requires it to be empty first, so bags get moved out before. */
function ReportDialog({ eq, onClose }: { eq: Equipment | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const report = useApiMutation(
    () => api<string>(`/api/staff/storage-equipment/${eq!.equipmentId}/report-broken`, { method: "POST", body: { reason } }),
    { success: "Đã báo sự cố, quản trị viên sẽ xử lý", invalidate: [["staff"], ["equipment"]], onSuccess: () => { setReason(""); onClose(); } },
  );
  return (
    <Dialog open={!!eq} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo hỏng {eq?.name}</DialogTitle>
          <DialogDescription>
            {eq && eq.currentLoad > 0
              ? `Tủ đang chứa ${eq.currentLoad} túi. Chuyển hết túi sang tủ khác (trang Nhập kho & bảo quản) trước khi báo hỏng.`
              : "Tủ sẽ chuyển sang trạng thái bảo trì và không nhận thêm túi."}
          </DialogDescription>
        </DialogHeader>
        <Textarea rows={3} placeholder="Mô tả sự cố, ví dụ: nhiệt độ tăng lên 8°C, máy nén không chạy" value={reason} onChange={(e) => setReason(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button variant="destructive" onClick={() => report.mutate(undefined)} disabled={!reason.trim() || report.isPending}>
            {report.isPending && <Loader2 className="animate-spin" />} Báo hỏng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffEquipmentPage() {
  const [broken, setBroken] = useState<Equipment | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["staff", "equipment"],
    queryFn: () => api<Equipment[]>("/api/staff/storage-equipment/list-equipment"),
  });
  return (
    <>
      <PageHeader title="Thiết bị bảo quản" description="Tình trạng các tủ và số túi đang chứa. Báo hỏng khi tủ gặp sự cố." />
      {error && <ErrorState error={error} />}
      {isLoading && <Card><TableSkeleton /></Card>}
      {data?.length === 0 && <Card><EmptyState title="Chưa có thiết bị" /></Card>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((eq) => (
          <Card key={eq.equipmentId} className="gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-sky-50 text-sky-600"><Thermometer className="size-5" /></span>
                <div>
                  <h3 className="font-semibold">{eq.name}</h3>
                  <p className="text-xs text-muted-foreground">{productType[eq.productType]}</p>
                </div>
              </div>
              <StatusBadge {...equipmentStatus[eq.status]} />
            </div>
            <div className="grid gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Đang chứa</span>
                <span className="font-medium tabular-nums">{eq.currentLoad}/{eq.maxCapacity} túi</span>
              </div>
              <Progress value={percent(eq.currentLoad, eq.maxCapacity)} />
            </div>
            {eq.status === "ACTIVE" && (
              <Button variant="outline" size="sm" className="w-fit" onClick={() => setBroken(eq)}><Wrench /> Báo hỏng</Button>
            )}
          </Card>
        ))}
      </div>
      <ReportDialog eq={broken} onClose={() => setBroken(null)} />
    </>
  );
}
