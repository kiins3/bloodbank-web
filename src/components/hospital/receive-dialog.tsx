"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PackageCheck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/app/native-select";
import { BloodTypeBadge } from "@/components/app/status-badge";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import { bloodGroup, fmtDate, productType } from "@/lib/format";
import type { ExportedBag, RejectedBag } from "@/lib/types";
import { cn } from "@/lib/utils";

const REASONS = ["Túi rò rỉ hoặc hư hỏng", "Sai nhóm máu hoặc chế phẩm", "Nhiệt độ vận chuyển không đạt", "Sắp hết hạn sử dụng", "Khác"];

type Rejection = { reason: string; note: string };

function reasonText(r: Rejection) {
  const note = r.note.trim();
  if (r.reason === "Khác") return note || "Khác";
  return note ? `${r.reason}: ${note}` : r.reason;
}

/** Hospital confirms which delivered bags it accepts; the rest go back to the blood bank. */
export function ReceiveDialog({ requestId, bags }: { requestId: number; bags: ExportedBag[] }) {
  const [open, setOpen] = useState(false);
  const [rejected, setRejected] = useState<Record<number, Rejection>>({});

  const confirm = useApiMutation(
    () => {
      const rejectedBags: RejectedBag[] = Object.entries(rejected).map(([id, r]) => ({ bloodBagId: Number(id), reason: reasonText(r) }));
      return api<string>(`/api/hospital/blood-request/track-order/${requestId}`, { method: "PATCH", body: { rejectedBags } });
    },
    { success: "Đã xác nhận nhận máu", invalidate: [["hospital"]], onSuccess: () => setOpen(false) },
  );

  const toggle = (id: number) =>
    setRejected((r) => {
      const next = { ...r };
      if (next[id]) delete next[id];
      else next[id] = { reason: REASONS[0], note: "" };
      return next;
    });
  const update = (id: number, patch: Partial<Rejection>) => setRejected((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const count = Object.keys(rejected).length;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PackageCheck /> Xác nhận nhận máu
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Xác nhận nhận máu</DialogTitle>
            <DialogDescription>Kiểm tra từng túi. Bấm &quot;Trả lại&quot; cho túi không đạt và chọn lý do.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[55vh] gap-2 overflow-y-auto">
            {bags.map((b) => {
              const r = rejected[b.bloodBagId];
              return (
                <div key={b.bloodBagId} className={cn("rounded-lg border p-3 transition-colors", r && "border-amber-300 bg-amber-50/60")}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <BloodTypeBadge value={bloodGroup(b.bloodType, b.rhFactor)} />
                      <div>
                        <p className="text-sm font-medium">Túi #{b.bloodBagId} · {productType[b.productType]}</p>
                        <p className="text-xs text-muted-foreground">{b.volume} ml · HSD {fmtDate(b.expiredAt)}</p>
                      </div>
                    </div>
                    <Button size="sm" variant={r ? "outline" : "ghost"} onClick={() => toggle(b.bloodBagId)}>
                      {r ? <CheckCircle2 /> : <Undo2 />} {r ? "Nhận túi này" : "Trả lại"}
                    </Button>
                  </div>
                  {r && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <NativeSelect
                        aria-label="Lý do trả lại"
                        options={REASONS.map((x) => ({ value: x, label: x }))}
                        value={r.reason}
                        onChange={(e) => update(b.bloodBagId, { reason: e.target.value })}
                      />
                      <Input
                        placeholder={r.reason === "Khác" ? "Nhập lý do" : "Ghi chú thêm (không bắt buộc)"}
                        value={r.note}
                        onChange={(e) => update(b.bloodBagId, { note: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter className="items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Nhận {bags.length - count}/{bags.length} túi
              {count > 0 && <span className="text-amber-700"> · trả lại {count}</span>}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Đóng</Button>
              <Button onClick={() => confirm.mutate(undefined)} disabled={confirm.isPending}>
                {confirm.isPending && <Loader2 className="animate-spin" />} Xác nhận
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
