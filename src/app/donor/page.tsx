"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CalendarCheck2, ChevronRight, Droplet, HeartPulse, Ticket } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LinkButton } from "@/components/app/link-button";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { DonorEventCard } from "@/components/donor/event-card";
import { TicketDialog } from "@/components/donor/ticket-dialog";
import { DONATION_GAP_DAYS, isProfileComplete, useDonorProfile, useEligibility, useMyHistory, useMyTickets } from "@/hooks/use-donor";
import { api } from "@/lib/api";
import { bloodGroup, fmtDate, fmtTime, registrationStatus } from "@/lib/format";
import type { DonorHealthRecord, EventSummary } from "@/lib/types";

const ACTIVE_TICKET = ["DA_DANG_KY", "CHO_KHAM", "DONG_Y"];

export default function DonorHome() {
  const profile = useDonorProfile();
  const tickets = useMyTickets();
  const history = useMyHistory();
  const record = useQuery({ queryKey: ["donor", "record"], queryFn: () => api<DonorHealthRecord>("/api/donor/my-health-record") });
  const events = useQuery({ queryKey: ["donor", "events"], queryFn: () => api<EventSummary[]>("/api/shared/event/get-list-event") });

  const firstName = profile.data?.fullName?.trim().split(/\s+/).pop();
  const { nextEligible } = useEligibility();
  // eslint-disable-next-line react-hooks/purity -- client-only page, "now" is fine here
  const eligibleNow = !nextEligible || nextEligible.getTime() <= Date.now();

  const upcoming = (tickets.data ?? [])
    .filter((t) => ACTIVE_TICKET.includes(t.registrationStatus) && t.status !== "DA_DONG" && t.status !== "DA_HUY")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const openEvents = (events.data ?? [])
    .filter((e) => e.status === "SAP_TOI" || e.status === "DANG_MO")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{firstName ? `Xin chào, ${firstName}` : "Xin chào"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Cảm ơn bạn đã đồng hành cùng ngân hàng máu.</p>
      </div>

      {profile.data && !isProfileComplete(profile.data) && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="flex items-center gap-2"><AlertCircle className="size-4" /> Bổ sung ngày sinh, giới tính và địa chỉ để đăng ký hiến máu trực tuyến.</p>
          <LinkButton href="/donor/profile" size="sm" variant="outline">Cập nhật hồ sơ</LinkButton>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex flex-row items-center gap-4 bg-primary p-5 text-primary-foreground">
          <span className="grid size-14 place-items-center rounded-xl bg-white/15 text-xl font-bold">
            {record.isLoading ? "…" : bloodGroup(record.data?.bloodType, record.data?.rhFactor)}
          </span>
          <div>
            <p className="text-sm opacity-80">Nhóm máu</p>
            <p className="text-xs opacity-70">{record.data?.bloodType ? "Theo kết quả xét nghiệm" : "Sẽ có sau lần hiến đầu tiên"}</p>
          </div>
        </Card>
        <StatCard label="Số lần hiến" value={record.data?.totalDonation} icon={HeartPulse} loading={record.isLoading} />
        <StatCard label="Tổng lượng máu đã hiến" value={record.data ? `${record.data.totalVolumeMl} ml` : undefined} icon={Droplet} accent="violet" loading={record.isLoading} />
        <StatCard
          label="Có thể hiến lại"
          value={history.isLoading ? undefined : eligibleNow ? "Ngay bây giờ" : fmtDate(nextEligible!.toISOString())}
          hint={`Cách lần trước ít nhất ${DONATION_GAP_DAYS} ngày`}
          icon={CalendarCheck2}
          accent="emerald"
          loading={history.isLoading}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Sự kiện sắp tới</h2>
            <LinkButton href="/donor/events" variant="ghost" size="sm">Xem tất cả</LinkButton>
          </div>
          {events.isLoading && <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>}
          {events.data && openEvents.length === 0 && <Card><EmptyState title="Chưa có sự kiện mới" description="Chúng tôi sẽ cập nhật khi có chiến dịch hiến máu mới." /></Card>}
          <div className="grid gap-4 md:grid-cols-2">
            {openEvents.slice(0, 4).map((e) => <DonorEventCard key={e.eventId} e={e} />)}
          </div>
        </div>

        <Card className="gap-0 self-start p-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Lịch hẹn của bạn</CardTitle>
            <CardDescription>Vé đang còn hiệu lực</CardDescription>
            <CardAction><LinkButton href="/donor/tickets" variant="ghost" size="sm">Tất cả vé</LinkButton></CardAction>
          </CardHeader>
          <CardContent className="p-0">
            {tickets.isLoading && <Skeleton className="m-4 h-16" />}
            {tickets.data && upcoming.length === 0 && <EmptyState title="Chưa có lịch hẹn" description="Đăng ký một sự kiện để nhận vé QR." />}
            <div className="divide-y">
              {upcoming.map((t) => (
                <TicketDialog
                  key={t.registrationId}
                  ticket={t}
                  trigger={(open) => (
                    <button onClick={open} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Ticket className="size-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{t.eventName}</span>
                        <span className="block text-xs text-muted-foreground">{fmtDate(t.startDate)} · {fmtTime(t.startDate)}</span>
                      </span>
                      <StatusBadge {...registrationStatus[t.registrationStatus]} />
                    </button>
                  )}
                />
              ))}
            </div>
            {(history.data?.history.length ?? 0) > 0 && (
              <Link href="/donor/history" className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground hover:bg-muted/40">
                Xem lịch sử và kết quả xét nghiệm <ChevronRight className="size-4" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
