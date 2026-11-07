"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { useBagDetail } from "@/hooks/use-staff";
import { ApiError, api } from "@/lib/api";
import { BLOOD_TYPES, fmtDateTime } from "@/lib/format";
import type { TestValue } from "@/lib/types";
import { cn } from "@/lib/utils";

const TESTS = [
  ["hiv", "HIV"],
  ["hbv", "Viêm gan B (HBV)"],
  ["hcv", "Viêm gan C (HCV)"],
  ["syphilis", "Giang mai"],
  ["malaria", "Sốt rét"],
] as const;
type TestKey = (typeof TESTS)[number][0];

/** Enter ABO/Rh and the five screening tests. Any positive result sends the bag to the discard queue. */
export function TestDialog({ bagId, onClose }: { bagId: number | null; onClose: () => void }) {
  const qc = useQueryClient();
  const bag = useBagDetail(bagId);
  const [bloodType, setBloodType] = useState("");
  const [rh, setRh] = useState("+");
  const [values, setValues] = useState<Record<TestKey, TestValue>>({ hiv: "AM_TINH", hbv: "AM_TINH", hcv: "AM_TINH", syphilis: "AM_TINH", malaria: "AM_TINH" });
  const [damaged, setDamaged] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState<string | null>(null);

  const positive = Object.values(values).includes("DUONG_TINH");

  const save = useMutation({
    mutationFn: (force: boolean) =>
      api<string>(`/api/staff/bloodbag/test-result/${bagId}?forceUpdate=${force}`, {
        method: "POST",
        body: damaged ? { isPhysicalError: true } : { bloodType, rhFactor: rh, ...values, isPhysicalError: false },
      }),
    onSuccess: () => {
      toast.success(damaged ? "Đã ghi nhận túi hỏng, chuyển sang chờ hủy" : positive ? "Có kết quả dương tính, túi chuyển sang chờ hủy" : "Kết quả an toàn, túi chuyển sang chờ tách chế phẩm");
      qc.invalidateQueries({ queryKey: ["staff"] });
      setConfirmOverwrite(null);
      onClose();
    },
    onError: (e) => {
      // The backend answers 409 when a result already exists and wants an explicit overwrite.
      if (e instanceof ApiError && e.status === 409) setConfirmOverwrite(e.message);
      else toast.error(e.message);
    },
  });

  const b = bag.data;
  const valid = damaged || !!bloodType;

  return (
    <Dialog open={bagId !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FlaskConical className="size-4 text-primary" /> Kết quả xét nghiệm · túi #{bagId}</DialogTitle>
          <DialogDescription>{b ? `${b.donorName ?? "—"} · lấy lúc ${fmtDateTime(b.collectedAt)} · ${b.actualVolume ?? "?"} ml` : "Đang tải…"}</DialogDescription>
        </DialogHeader>

        <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={damaged} onChange={(e) => setDamaged(e.target.checked)} />
          Túi bị hỏng do sự cố kỹ thuật (không xét nghiệm được)
        </label>

        {!damaged && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nhóm máu ABO">
                <NativeSelect placeholder="Chọn" options={BLOOD_TYPES.map((t) => ({ value: t, label: t }))} value={bloodType} onChange={(e) => setBloodType(e.target.value)} />
              </Field>
              <Field label="Rh">
                <NativeSelect options={[{ value: "+", label: "Rh+ (dương)" }, { value: "-", label: "Rh− (âm)" }]} value={rh} onChange={(e) => setRh(e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-2">
              {TESTS.map(([k, label]) => (
                <div key={k} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
                  <span>{label}</span>
                  <div className="flex rounded-md bg-muted p-0.5">
                    {(["AM_TINH", "DUONG_TINH"] as const).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setValues((s) => ({ ...s, [k]: val }))}
                        className={cn(
                          "rounded px-2.5 py-1 text-xs font-medium",
                          values[k] === val ? (val === "AM_TINH" ? "bg-background text-emerald-700 shadow-sm" : "bg-rose-600 text-white shadow-sm") : "text-muted-foreground",
                        )}
                      >
                        {val === "AM_TINH" ? "Âm tính" : "Dương tính"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {positive && (
              <p className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
                <AlertTriangle className="size-4 shrink-0" /> Kết luận KHÔNG AN TOÀN. Túi sẽ chuyển sang chờ hủy.
              </p>
            )}
          </>
        )}

        {confirmOverwrite && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p>{confirmOverwrite}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setConfirmOverwrite(null)}>Không</Button>
              <Button size="sm" onClick={() => save.mutate(true)} disabled={save.isPending}>Ghi đè kết quả</Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          <Button onClick={() => save.mutate(false)} disabled={!valid || save.isPending || !!confirmOverwrite}>
            {save.isPending && <Loader2 className="animate-spin" />} Lưu kết quả
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
