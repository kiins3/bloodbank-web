"use client";

import Link from "next/link";
import { ChevronRight, Droplet, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { useMyHistory } from "@/hooks/use-donor";
import { fmtDate, registrationStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

const DONATED = ["DA_LAY_MAU", "HOAN_THANH"];

export default function DonorHistoryPage() {
  const { data, isLoading, error } = useMyHistory();
  const rows = [...(data?.history ?? [])].sort((a, b) => b.donationDate.localeCompare(a.donationDate));

  return (
    <>
      <PageHeader title="Lịch sử hiến máu" description="Mỗi lần tham gia, kèm kết quả khám sàng lọc và xét nghiệm máu." />
      {error && <ErrorState error={error} />}
      <Card className="gap-0 p-0">
        {isLoading && <TableSkeleton />}
        {data && rows.length === 0 && <EmptyState title="Chưa có lần hiến nào" description="Lịch sử sẽ hiện ở đây sau lần hiến máu đầu tiên của bạn." />}
        <ol className="divide-y">
          {rows.map((h) => {
            const donated = DONATED.includes(h.status);
            return (
              <li key={h.registrationId}>
                <Link href={`/donor/history/${h.registrationId}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/40">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", donated ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    <Droplet className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{h.eventName}</p>
                    <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      {fmtDate(h.donationDate)}
                      {donated && h.volumeMl ? <> · {h.volumeMl} ml</> : null}
                      <MapPin className="ml-1 size-3.5 shrink-0" /> <span className="truncate">{h.location}</span>
                    </p>
                  </div>
                  <StatusBadge {...registrationStatus[h.status]} />
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ol>
      </Card>
    </>
  );
}
