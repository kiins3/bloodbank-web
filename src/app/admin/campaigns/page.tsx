"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, Pencil, Plus, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CampaignForm } from "@/components/admin/campaign-form";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import { eventStatus, fmtDate, fmtTime, percent } from "@/lib/format";
import type { EventStatus, EventSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

const tabs: { value: EventStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "DANG_MO", label: "Đang diễn ra" },
  { value: "SAP_TOI", label: "Sắp diễn ra" },
  { value: "DA_DONG", label: "Đã kết thúc" },
  { value: "DA_HUY", label: "Đã hủy" },
];

export default function CampaignsPage() {
  const [tab, setTab] = useState<EventStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: () => api<EventSummary[]>("/api/shared/event/get-list-event"),
  });

  const cancel = useApiMutation((id: number) => api(`/api/admin/event/cancel-event/${id}`, { method: "PATCH" }), {
    success: "Đã hủy chiến dịch",
    invalidate: [["events"], ["admin"]],
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: data?.length ?? 0 };
    data?.forEach((e) => (c[e.status] = (c[e.status] ?? 0) + 1));
    return c;
  }, [data]);

  const rows = (data ?? [])
    .filter((e) => tab === "ALL" || e.status === tab)
    .filter((e) => {
      const q = search.trim().toLowerCase();
      return !q || e.eventName.toLowerCase().includes(q) || e.location.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <>
      <PageHeader
        title="Chiến dịch hiến máu"
        description="Lên kế hoạch, phân công nhân sự và theo dõi số người tham gia."
        actions={<CampaignForm trigger={(open) => <Button onClick={open}><Plus /> Tạo chiến dịch</Button>} />}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label} <span className="ml-1 text-xs text-muted-foreground">{counts[t.value] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm theo tên hoặc địa điểm" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
      </div>

      {error && <ErrorState error={error} />}
      {isLoading && <Card><TableSkeleton /></Card>}
      {data && rows.length === 0 && <Card><EmptyState title="Không có chiến dịch phù hợp" /></Card>}

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((e) => {
          const pct = percent(e.currentAmount, e.targetAmount);
          const editable = e.status === "SAP_TOI";
          return (
            <Card key={e.eventId} className="gap-0 p-0">
              <Link href={`/admin/campaigns/${e.eventId}`} className="block p-5 transition-colors hover:bg-muted/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">#{e.eventId}</p>
                    <h3 className="font-semibold leading-snug">{e.eventName}</h3>
                  </div>
                  <StatusBadge {...eventStatus[e.status]} />
                </div>
                <div className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-4" /> {fmtDate(e.startDate)} · {fmtTime(e.startDate)} – {fmtTime(e.endDate)}
                  </p>
                  <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" /> <span className="line-clamp-1">{e.location}</span></p>
                </div>
                <div className="mt-4 grid gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Đăng ký</span>
                    <span className="font-medium tabular-nums">{e.currentAmount}/{e.targetAmount} · {pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>
              </Link>
              {editable && (
                <div className="flex justify-end gap-2 border-t px-5 py-3">
                  <CampaignForm event={e} trigger={(open) => <Button variant="ghost" size="sm" onClick={open}><Pencil /> Sửa</Button>} />
                  <ConfirmDialog
                    title="Hủy chiến dịch này?"
                    description="Nhân sự đã phân công sẽ được gỡ khỏi chiến dịch. Chỉ hủy được trước giờ bắt đầu ít nhất 48 giờ."
                    confirmLabel="Hủy chiến dịch"
                    destructive
                    onConfirm={() => cancel.mutateAsync(e.eventId)}
                    trigger={(open) => <Button variant="ghost" size="sm" className="text-destructive" onClick={open}><XCircle /> Hủy</Button>}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
