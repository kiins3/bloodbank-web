"use client";

import { CalendarDays, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { TicketDialog } from "@/components/donor/ticket-dialog";
import { useMyTickets } from "@/hooks/use-donor";
import { eventStatus, fmtDate, fmtTime, registrationStatus } from "@/lib/format";

export default function DonorTicketsPage() {
  const { data, isLoading, error } = useMyTickets();
  const rows = [...(data ?? [])].sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <>
      <PageHeader
        title="Vé của tôi"
        description="Vé của các sự kiện trong khoảng một tháng gần đây. Bấm vào vé để xem mã QR."
        actions={<LinkButton href="/donor/events" variant="outline">Tìm sự kiện</LinkButton>}
      />
      {error && <ErrorState error={error} />}
      <Card className="gap-0 p-0">
        {isLoading && <TableSkeleton />}
        {data && rows.length === 0 && <EmptyState title="Bạn chưa có vé nào" description="Đăng ký một sự kiện hiến máu để nhận vé QR." />}
        <div className="divide-y">
          {rows.map((t) => {
            const usable = t.registrationStatus !== "DA_HUY";
            return (
              <div key={t.registrationId} className="flex flex-wrap items-center gap-4 px-4 py-3.5">
                <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-center leading-none text-primary">
                  <span className="text-lg font-bold">{new Date(t.startDate).getDate()}</span>
                  <span className="text-[10px] uppercase">th {new Date(t.startDate).getMonth() + 1}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.eventName}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" />{fmtDate(t.startDate)} · {fmtTime(t.startDate)}
                    <span className="mx-1">·</span> Sự kiện {eventStatus[t.status].label.toLowerCase()}
                  </p>
                </div>
                <StatusBadge {...registrationStatus[t.registrationStatus]} />
                {usable ? (
                  <TicketDialog ticket={t} trigger={(open) => <Button variant="outline" size="sm" onClick={open}><QrCode /> Xem vé</Button>} />
                ) : (
                  <Button variant="ghost" size="sm" disabled>Đã hủy</Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
