"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterTabs } from "@/components/app/filter-tabs";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState } from "@/components/app/states";
import { DonorEventCard } from "@/components/donor/event-card";
import { api } from "@/lib/api";
import type { EventSummary } from "@/lib/types";

type Tab = "OPEN" | "DANG_MO" | "SAP_TOI" | "DA_DONG";
const tabs: { value: Tab; label: string }[] = [
  { value: "OPEN", label: "Đang nhận đăng ký" },
  { value: "DANG_MO", label: "Đang diễn ra" },
  { value: "SAP_TOI", label: "Sắp diễn ra" },
  { value: "DA_DONG", label: "Đã kết thúc" },
];
const inTab = (e: EventSummary, t: Tab) => (t === "OPEN" ? e.status === "SAP_TOI" || e.status === "DANG_MO" : e.status === t);

export default function DonorEventsPage() {
  const [tab, setTab] = useState<Tab>("OPEN");
  const [q, setQ] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["donor", "events"],
    queryFn: () => api<EventSummary[]>("/api/shared/event/get-list-event"),
  });

  const counts = useMemo(
    () => Object.fromEntries(tabs.map((t) => [t.value, (data ?? []).filter((e) => inTab(e, t.value)).length])) as Record<Tab, number>,
    [data],
  );
  const term = q.trim().toLowerCase();
  const rows = (data ?? [])
    .filter((e) => inTab(e, tab))
    .filter((e) => !term || e.eventName.toLowerCase().includes(term) || e.location.toLowerCase().includes(term))
    .sort((a, b) => (tab === "DA_DONG" ? b.startDate.localeCompare(a.startDate) : a.startDate.localeCompare(b.startDate)));

  return (
    <>
      <PageHeader title="Sự kiện hiến máu" description="Chọn một sự kiện gần bạn và đăng ký để nhận vé QR qua email." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs tabs={tabs} value={tab} onChange={setTab} counts={counts} />
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc địa điểm" className="pl-8" />
        </div>
      </div>
      {error && <ErrorState error={error} />}
      {isLoading && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>}
      {data && rows.length === 0 && <Card><EmptyState title="Không có sự kiện phù hợp" /></Card>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((e) => <DonorEventCard key={e.eventId} e={e} />)}
      </div>
    </>
  );
}
