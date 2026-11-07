"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FilterTabs } from "@/components/app/filter-tabs";
import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { RequestRow } from "@/components/hospital/request-card";
import { api } from "@/lib/api";
import type { BloodRequestStatus, BloodRequestSummary } from "@/lib/types";

type Tab = "ALL" | "PENDING" | "APPROVED" | "TRANSIT" | "DONE" | "CLOSED";

const groups: Record<Exclude<Tab, "ALL">, BloodRequestStatus[]> = {
  PENDING: ["CHO_DUYET"],
  APPROVED: ["DA_DUYET_TOAN_BO", "DA_DUYET_MOT_PHAN"],
  TRANSIT: ["DANG_VAN_CHUYEN"],
  DONE: ["DA_NHAN", "DA_NHAN_MOT_PHAN", "HOAN_TRA_MOT_PHAN", "HOAN_TRA_TOAN_BO"],
  CLOSED: ["DA_HUY", "DA_TU_CHOI"],
};

const tabs: { value: Tab; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "TRANSIT", label: "Đang giao" },
  { value: "DONE", label: "Đã nhận" },
  { value: "CLOSED", label: "Hủy / từ chối" },
];

export default function HospitalRequestsPage() {
  const [tab, setTab] = useState<Tab>("ALL");
  const { data, isLoading, error } = useQuery({
    queryKey: ["hospital", "requests"],
    queryFn: () => api<BloodRequestSummary[]>("/api/hospital/blood-request/my-list-request"),
  });

  const sorted = useMemo(() => [...(data ?? [])].sort((a, b) => b.requestedDate.localeCompare(a.requestedDate)), [data]);
  const counts = useMemo(() => {
    const c: Partial<Record<Tab, number>> = { ALL: sorted.length };
    for (const [k, statuses] of Object.entries(groups)) c[k as Tab] = sorted.filter((r) => statuses.includes(r.status)).length;
    return c;
  }, [sorted]);
  const rows = tab === "ALL" ? sorted : sorted.filter((r) => groups[tab].includes(r.status));

  return (
    <>
      <PageHeader
        title="Yêu cầu của tôi"
        description="Yêu cầu đang chờ duyệt có thể sửa (một lần) hoặc hủy."
        actions={<LinkButton href="/hospital/requests/new"><PlusCircle /> Gửi yêu cầu máu</LinkButton>}
      />
      <div className="mb-4">
        <FilterTabs tabs={tabs} value={tab} onChange={setTab} counts={counts} />
      </div>
      {error && <ErrorState error={error} />}
      <Card className="gap-0 p-0">
        {isLoading && <TableSkeleton />}
        {data && rows.length === 0 && <EmptyState title="Không có yêu cầu nào" />}
        <div className="divide-y">
          {rows.map((r) => <RequestRow key={r.requestId} r={r} />)}
        </div>
      </Card>
    </>
  );
}
