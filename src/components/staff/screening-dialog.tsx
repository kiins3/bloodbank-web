"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Stethoscope, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import type { EventDonor } from "@/lib/types";
import { cn } from "@/lib/utils";

type Vitals = { weight: string; hemoglobin: string; systolic: string; diastolic: string; heartRate: string };

/** Rough eligibility check from common blood-donation criteria; the doctor makes the final call. */
function assess(v: Vitals) {
  const w = Number(v.weight), hb = Number(v.hemoglobin), sys = Number(v.systolic), dia = Number(v.diastolic), hr = Number(v.heartRate);
  const issues: string[] = [];
  if (v.weight && w < 42) issues.push("Cân nặng dưới 42 kg");
  if (v.hemoglobin && hb < 12) issues.push("Huyết sắc tố dưới 12 g/dL");
  if (v.systolic && (sys < 90 || sys >= 160)) issues.push("Huyết áp tâm thu ngoài 90–159 mmHg");
  if (v.diastolic && (dia < 60 || dia >= 100)) issues.push("Huyết áp tâm trương ngoài 60–99 mmHg");
  if (v.heartRate && (hr < 60 || hr > 100)) issues.push("Nhịp tim ngoài 60–100 lần/phút");
  const volume = w >= 60 ? 450 : w >= 50 ? 350 : 250;
  return { issues, volume };
}

export function ScreeningDialog({ donor, trigger }: { donor: EventDonor; trigger: (open: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<Vitals>({ weight: "", hemoglobin: "", systolic: "", diastolic: "", heartRate: "" });
  const [volume, setVolume] = useState<string>("");
  const [reason, setReason] = useState("");
  const { issues, volume: suggested } = assess(v);
  const complete = Object.values(v).every(Boolean);

  const save = useApiMutation(
    (eligible: boolean) =>
      api(`/api/staff/registration/screening/${donor.regisId}`, {
        method: "PUT",
        body: {
          donorId: donor.donorId,
          weight: Number(v.weight),
          hemoglobin: Number(v.hemoglobin),
          bloodPressure: `${v.systolic}/${v.diastolic}`,
          heartRate: Number(v.heartRate),
          expectedVolume: eligible ? Number(volume || suggested) : 0,
          isEligible: eligible,
          rejectionReason: eligible ? null : reason.trim() || issues.join("; "),
        },
      }),
    {
      invalidate: [["staff", "event-donors"]],
      onSuccess: (_r, eligible) => {
        setOpen(false);
        if (eligible) toast.success(`${donor.fullName} đủ điều kiện, chuyển sang lấy máu`);
        else toast.info(`Đã ghi nhận: ${donor.fullName} chưa đủ điều kiện`);
      },
    },
  );

  const set = (k: keyof Vitals) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  return (
    <>
      {trigger(() => setOpen(true))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Stethoscope className="size-4 text-primary" /> Khám sàng lọc</DialogTitle>
            <DialogDescription>{donor.fullName} · {donor.gender ?? "—"} · vé {donor.ticketCode}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cân nặng (kg)"><Input type="number" step="0.1" inputMode="decimal" autoFocus value={v.weight} onChange={set("weight")} /></Field>
            <Field label="Huyết sắc tố (g/dL)"><Input type="number" step="0.1" inputMode="decimal" value={v.hemoglobin} onChange={set("hemoglobin")} /></Field>
            <Field label="Huyết áp (mmHg)">
              <div className="flex items-center gap-1.5">
                <Input type="number" placeholder="120" value={v.systolic} onChange={set("systolic")} aria-label="Tâm thu" />
                <span className="text-muted-foreground">/</span>
                <Input type="number" placeholder="80" value={v.diastolic} onChange={set("diastolic")} aria-label="Tâm trương" />
              </div>
            </Field>
            <Field label="Nhịp tim (lần/phút)"><Input type="number" value={v.heartRate} onChange={set("heartRate")} /></Field>
          </div>

          {complete && (
            <div className={cn("rounded-lg p-3 text-sm", issues.length ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900")}>
              {issues.length ? (
                <ul className="list-inside list-disc">{issues.map((i) => <li key={i}>{i}</li>)}</ul>
              ) : (
                <p>Các chỉ số trong ngưỡng cho phép. Gợi ý lấy {suggested} ml.</p>
              )}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Thể tích chỉ định">
              <NativeSelect
                options={[250, 350, 450].map((x) => ({ value: String(x), label: `${x} ml${x === suggested ? " (gợi ý)" : ""}` }))}
                value={volume || String(suggested)}
                onChange={(e) => setVolume(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Lý do không đủ điều kiện" hint="Chỉ cần khi kết luận không đủ điều kiện; bỏ trống sẽ dùng các cảnh báo ở trên.">
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>

          <DialogFooter>
            <Button variant="outline" disabled={!complete || save.isPending} onClick={() => save.mutate(false)}>
              <XCircle /> Không đủ điều kiện
            </Button>
            <Button disabled={!complete || save.isPending} onClick={() => save.mutate(true)}>
              {save.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Đủ điều kiện
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
