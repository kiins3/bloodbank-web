"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { LinkButton } from "@/components/app/link-button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/states";
import { api } from "@/lib/api";
import { eventStatus, fmtDate, fmtTime, percent } from "@/lib/format";
import type { EventSummary } from "@/lib/types";

export function UpcomingEvents() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-events"],
    queryFn: () => api<EventSummary[]>("/api/shared/event/list-event-coming", { auth: false }),
  });

  if (isLoading)
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    );

  if (isError || !data?.length)
    return (
      <Card>
        <EmptyState
          title={isError ? "Chưa kết nối được máy chủ" : "Hiện chưa có sự kiện nào"}
          description="Máy chủ miễn phí có thể mất khoảng một phút để khởi động. Bạn thử tải lại trang sau ít phút."
        />
      </Card>
    );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.slice(0, 6).map((e) => {
        const pct = percent(e.currentAmount, e.targetAmount);
        return (
          <Card key={e.eventId} className="flex flex-col gap-4 p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold leading-snug">{e.eventName}</h3>
              <StatusBadge {...eventStatus[e.status]} />
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" />{fmtDate(e.startDate)}</p>
              <p className="flex items-center gap-2"><Clock className="size-4 text-primary" />{fmtTime(e.startDate)} – {fmtTime(e.endDate)}</p>
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><span className="line-clamp-2">{e.location}</span></p>
            </div>
            <div className="mt-auto grid gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Đã đăng ký</span>
                <span className="font-medium tabular-nums">{e.currentAmount}/{e.targetAmount} người</span>
              </div>
              <Progress value={pct} />
            </div>
            <LinkButton href={`/login?next=/donor/events/${e.eventId}`} variant="outline">
              Đăng ký tham gia
            </LinkButton>
          </Card>
        );
      })}
    </div>
  );
}
