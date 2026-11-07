"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LinkButton } from "@/components/app/link-button";
import { ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { RegisterButton } from "@/components/donor/register-button";
import { api } from "@/lib/api";
import { eventStatus, fmtDate, fmtTime, percent } from "@/lib/format";
import type { EventDetail } from "@/lib/types";

const checklist = [
  "Mang theo CCCD hoặc mã QR trên vé",
  "Ngủ đủ giấc, ăn nhẹ trước khi hiến; không uống rượu bia",
  "Uống nhiều nước trước và sau khi hiến",
  "Cân nặng từ 45 kg (nữ) hoặc 50 kg (nam) trở lên",
];

export default function DonorEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: e, isLoading, error } = useQuery({
    queryKey: ["event", id],
    queryFn: () => api<EventDetail>(`/api/shared/event/event-detail/${id}`),
  });

  return (
    <>
      <LinkButton href="/donor/events" variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
        <ArrowLeft /> Sự kiện hiến máu
      </LinkButton>
      {error && <ErrorState error={error} />}
      {isLoading && <Card><TableSkeleton rows={5} /></Card>}
      {e && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="grid content-start gap-6">
            <Card className="overflow-hidden p-0">
              <div className="bg-linear-to-br from-primary to-rose-700 p-6 text-primary-foreground">
                <StatusBadge {...eventStatus[e.status]} className="bg-white/90" />
                <h1 className="mt-3 text-2xl font-semibold tracking-tight">{e.eventName}</h1>
              </div>
              <CardContent className="grid gap-3 py-5 text-sm sm:grid-cols-3">
                <p className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" />{fmtDate(e.startDate)}</p>
                <p className="flex items-center gap-2"><Clock className="size-4 text-primary" />{fmtTime(e.startDate)} – {fmtTime(e.endDate)}</p>
                <p className="flex items-center gap-2"><Users className="size-4 text-primary" />Cần {e.targetAmount} người</p>
                <p className="flex items-start gap-2 sm:col-span-3"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" />{e.location}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Trước khi đi hiến máu</CardTitle></CardHeader>
              <CardContent className="grid gap-2.5">
                {checklist.map((c) => (
                  <p key={c} className="flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />{c}</p>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card className="self-start lg:sticky lg:top-6">
            <CardHeader><CardTitle>Đăng ký tham gia</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đã đăng ký</span>
                  <span className="font-medium tabular-nums">{e.registeredCount}/{e.targetAmount}</span>
                </div>
                <Progress value={percent(e.registeredCount, e.targetAmount)} />
              </div>
              <RegisterButton
                size="lg"
                className="w-full"
                event={{ eventId: e.eventId, status: e.status, full: e.registeredCount >= e.targetAmount, startDate: e.startDate }}
              />
              <p className="text-xs text-muted-foreground">
                Mỗi lần hiến cách nhau ít nhất 84 ngày. Bạn có thể hủy vé trước khi sự kiện kết thúc.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
