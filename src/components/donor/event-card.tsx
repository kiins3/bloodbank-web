import Link from "next/link";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/app/status-badge";
import { eventStatus, fmtDate, fmtTime, percent } from "@/lib/format";
import type { EventSummary } from "@/lib/types";
import { RegisterButton } from "./register-button";

export function DonorEventCard({ e }: { e: EventSummary }) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/donor/events/${e.eventId}`} className="font-semibold leading-snug hover:text-primary">{e.eventName}</Link>
        <StatusBadge {...eventStatus[e.status]} />
      </div>
      <div className="grid gap-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" />{fmtDate(e.startDate)}</p>
        <p className="flex items-center gap-2"><Clock className="size-4 text-primary" />{fmtTime(e.startDate)} – {fmtTime(e.endDate)}</p>
        <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><span className="line-clamp-2">{e.location}</span></p>
      </div>
      <div className="mt-auto grid gap-3">
        <div className="grid gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Đã đăng ký</span>
            <span className="font-medium tabular-nums">{e.currentAmount}/{e.targetAmount}</span>
          </div>
          <Progress value={percent(e.currentAmount, e.targetAmount)} />
        </div>
        <RegisterButton event={{ eventId: e.eventId, status: e.status, full: e.currentAmount >= e.targetAmount, startDate: e.startDate }} className="w-full" />
      </div>
    </Card>
  );
}
