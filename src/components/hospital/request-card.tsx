import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/app/status-badge";
import { fmtDate, fmtDateTime, priority, requestStatus } from "@/lib/format";
import type { BloodRequestSummary } from "@/lib/types";
import { RequestItemChips, totalBags } from "./request-items";

/** One request row in the hospital's lists; links to the detail page. */
export function RequestRow({ r }: { r: BloodRequestSummary }) {
  return (
    <Link href={`/hospital/requests/${r.requestId}`} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40">
      <div className="grid min-w-0 flex-1 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">Yêu cầu #{r.requestId}</span>
          <StatusBadge {...requestStatus[r.status]} />
          {r.priority === "KHAN_CAP" && <StatusBadge {...priority.KHAN_CAP} />}
        </div>
        <RequestItemChips items={r.detailRequests} />
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Gửi {fmtDateTime(r.requestedDate)}</span>
          <span className="flex items-center gap-1"><CalendarClock className="size-3.5" />Cần trước {fmtDate(r.deadlineDate)}</span>
          <span>{totalBags(r.detailRequests)} túi</span>
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
