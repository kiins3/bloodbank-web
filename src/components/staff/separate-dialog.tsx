"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/app/field";
import { useBagDetail } from "@/hooks/use-staff";
import { api } from "@/lib/api";
import { bloodGroup } from "@/lib/format";

// Standard component volumes per parent bag size (BloodBagService.validateComponentVolume).
const RANGES: Record<number, { red: [number, number]; plasma: [number, number]; platelets: [number, number] }> = {
  250: { red: [120, 200], plasma: [80, 150], platelets: [15, 45] },
  350: { red: [190, 290], plasma: [110, 190], platelets: [20, 70] },
  450: { red: [250, 360], plasma: [150, 250], platelets: [30, 80] },
};
const DEFAULTS: Record<number, [number, number, number]> = { 250: [160, 100, 30], 350: [220, 140, 40], 450: [300, 180, 50] };

/** Splits a tested whole-blood bag into red cells, plasma and platelets. */
export function SeparateDialog({ bagId, onClose }: { bagId: number | null; onClose: () => void }) {
  const qc = useQueryClient();
  const bag = useBagDetail(bagId);
  const parent = bag.data?.actualVolume ?? 350;
  const [vols, setVols] = useState<[string, string, string] | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const current = vols ?? (DEFAULTS[parent] ?? DEFAULTS[350]).map(String) as [string, string, string];
  const range = RANGES[parent];

  const save = useMutation({
    mutationFn: () =>
      api<string>(`/api/staff/bloodbag/separate-blood/${bagId}`, {
        method: "POST",
        body: {
          redCellVolume: Number(current[0]) || 0,
          plasmaVolume: Number(current[1]) || 0,
          plateletsVolume: Number(current[2]) || 0,
          overrideReason: reason.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Đã tách chế phẩm. Các túi con đang chờ in nhãn.");
      qc.invalidateQueries({ queryKey: ["staff"] });
      close();
    },
    // An out-of-range volume comes back as a "Cảnh báo" message that needs a written reason.
    onError: (e) => (e.message.startsWith("Cảnh báo") ? setWarning(e.message) : toast.error(e.message)),
  });

  function close() {
    setVols(null);
    setWarning(null);
    setReason("");
    onClose();
  }

  const fields = [
    { label: "Hồng cầu", r: range?.red },
    { label: "Huyết tương", r: range?.plasma },
    { label: "Tiểu cầu", r: range?.platelets },
  ];
  const b = bag.data;

  return (
    <Dialog open={bagId !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Layers className="size-4 text-primary" /> Tách chế phẩm · {b?.bagCode ?? `túi #${bagId}`}</DialogTitle>
          <DialogDescription>
            {b ? `${bloodGroup(b.bloodType, b.rhFactor)} · túi ${parent} ml · ${b.donorName ?? ""}` : "Đang tải…"}. Nhập 0 nếu không tách loại đó.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          {fields.map((f, i) => {
            const v = Number(current[i]);
            const out = f.r && v > 0 && (v < f.r[0] || v > f.r[1]);
            return (
              <Field key={f.label} label={`${f.label} (ml)`} hint={f.r ? `Chuẩn ${f.r[0]}–${f.r[1]} ml` : undefined}>
                <Input
                  type="number"
                  min={0}
                  value={current[i]}
                  className={out ? "border-amber-400" : undefined}
                  onChange={(e) => {
                    const next = [...current] as [string, string, string];
                    next[i] = e.target.value;
                    setVols(next);
                  }}
                />
              </Field>
            );
          })}
        </div>
        {warning && (
          <div className="grid gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="flex gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{warning}</p>
            <Textarea rows={2} placeholder="Lý do ngoại lệ" value={reason} onChange={(e) => setReason(e.target.value)} className="bg-background" />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={close}>Đóng</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !b || (!!warning && !reason.trim())}>
            {save.isPending && <Loader2 className="animate-spin" />} Tách chế phẩm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
