"use client";

import Link from "next/link";
import { CalendarHeart, ChevronRight, MapPin } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { useMyAssignments } from "@/hooks/use-staff";
import { assignmentRole, eventStatus, fmtDate, fmtTime } from "@/lib/format";

export function Assignments() {
  const { data, isLoading, error } = useMyAssignments();
  const rows = [...(data ?? [])].sort((a, b) => a.startDate.localeCompare(b.startDate));
  return (
    <Card className="gap-0 p-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Lịch phân công của tôi</CardTitle>
        <CardDescription>Bấm vào chiến dịch đang diễn ra để mở bàn làm việc</CardDescription>
      </CardHeader>
      {error && <div className="p-4"><ErrorState error={error} /></div>}
      {isLoading && <TableSkeleton rows={3} />}
      {data?.length === 0 && <EmptyState title="Chưa được phân công" description="Quản trị viên sẽ phân công bạn vào các chiến dịch sắp tới." />}
      <div className="divide-y">
        {rows.map((a) => (
          <Link key={a.eventId} href={`/staff/events/${a.eventId}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/40">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><CalendarHeart className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{a.eventName}</p>
                <StatusBadge {...eventStatus[a.eventStatus]} />
              </div>
              <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                <span>{fmtDate(a.startDate)} · {fmtTime(a.startDate)}–{fmtTime(a.endDate)}</span>
                <span className="flex items-center gap-1"><MapPin className="size-3" />{a.location}</span>
              </p>
            </div>
            <span className="hidden rounded-md bg-muted px-2 py-1 text-xs font-medium sm:block">{assignmentRole[a.role]}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </Card>
  );
}
