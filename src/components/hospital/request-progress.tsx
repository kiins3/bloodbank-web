import { Check, X } from "lucide-react";
import { fmtDateTime } from "@/lib/format";
import type { BloodRequestDetail, BloodRequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const stepOf: Record<BloodRequestStatus, number> = {
  CHO_DUYET: 1,
  DA_DUYET_TOAN_BO: 2,
  DA_DUYET_MOT_PHAN: 2,
  DANG_VAN_CHUYEN: 3,
  DA_NHAN: 4,
  DA_NHAN_MOT_PHAN: 4,
  HOAN_TRA_MOT_PHAN: 4,
  HOAN_TRA_TOAN_BO: 4,
  DA_HUY: -1,
  DA_TU_CHOI: -1,
};

const finalLabel: Partial<Record<BloodRequestStatus, string>> = {
  DA_NHAN_MOT_PHAN: "Nhận một phần",
  HOAN_TRA_MOT_PHAN: "Hoàn trả một phần",
  HOAN_TRA_TOAN_BO: "Hoàn trả toàn bộ",
};

/** Sent → approved → in transit → received. */
export function RequestProgress({ request }: { request: BloodRequestDetail }) {
  const step = stepOf[request.status];
  if (step === -1) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-muted p-4 text-sm">
        <span className="grid size-8 place-items-center rounded-full bg-background text-muted-foreground">
          <X className="size-4" />
        </span>
        {request.status === "DA_HUY" ? "Yêu cầu đã được hủy." : "Ngân hàng máu đã từ chối yêu cầu này."}
      </div>
    );
  }
  const steps = [
    { label: "Đã gửi", time: request.requestedDate },
    { label: "Đã duyệt", time: null },
    { label: "Đang vận chuyển", time: request.exportDate },
    { label: finalLabel[request.status] ?? "Đã nhận", time: null },
  ];
  return (
    <ol className="grid grid-cols-4">
      {steps.map((s, i) => {
        const done = i < step || step === 4;
        const current = i === step && step !== 4;
        return (
          <li key={s.label} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <span className={cn("absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2", i <= step ? "bg-primary" : "bg-border")} />
            )}
            <span
              className={cn(
                "relative grid size-8 place-items-center rounded-full border-2 bg-background text-xs font-semibold",
                done ? "border-primary bg-primary text-primary-foreground" : current ? "border-primary text-primary" : "text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn("mt-2 text-xs font-medium sm:text-sm", !done && !current && "text-muted-foreground")}>{s.label}</span>
            {s.time && done && <span className="hidden text-xs text-muted-foreground sm:block">{fmtDateTime(s.time)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
