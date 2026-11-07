"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { FilterTabs } from "@/components/app/filter-tabs";
import { PageHeader } from "@/components/app/page-header";
import { SearchInput } from "@/components/app/search-input";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { RequestRow } from "@/components/hospital/request-card";
import { api } from "@/lib/api";
import type { BloodRequestStatus, BloodRequestSummary } from "@/lib/types";

type Tab = "PENDING" | "TO_EXPORT" | "TRANSIT" | "DONE" | "CLOSED";
const groups: Record<Tab, BloodRequestStatus[]> = {
  PENDING: ["CHO_DUYET"],
  TO_EXPORT: ["DA_DUYET_TOAN_BO", "DA_DUYET_MOT_PHAN"],
  TRANSIT: ["DANG_VAN_CHUYEN"],
  DONE: ["DA_NHAN", "DA_NHAN_MOT_PHAN", "HOAN_TRA_MOT_PHAN", "HOAN_TRA_TOAN_BO"],
  CLOSED: ["DA_HUY", "DA_TU_CHOI"],
};
const tabs: { value: Tab; label: string }[] = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "TO_EXPORT", label: "Chờ xuất kho" },
  { value: "TRANSIT", label: "Đang giao" },
  { value: "DONE", label: "Hoàn tất" },
  { value: "CLOSED", label: "Hủy / từ chối" },
];

export default function StaffRequestsPage() {
  const [tab, setTab] = useState<Tab>("PENDING");
  const [hospital, setHospital] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["staff", "requests"],
    queryFn: () => api<BloodRequestSummary[]>("/api/staff/blood-request/list-request"),
  });

  const filtered = useMemo(() => {
    const q = hospital.trim().toLowerCase();
    return (data ?? []).filter((r) => !q || r.hospitalName.toLowerCase().includes(q));
  }, [data, hospital]);
  const counts = useMemo(
    () => Object.fromEntries(tabs.map((t) => [t.value, filtered.filter((r) => groups[t.value].includes(r.status)).length])) as Record<Tab, number>,
    [filtered],
  );
  // Work queues: urgent first, then first come first served. History: newest first.
  const queue = tab === "PENDING" || tab === "TO_EXPORT";
  const rows = filtered
    .filter((r) => groups[tab].includes(r.status))
    .sort((a, b) =>
      queue
        ? a.priority === b.priority ? a.requestedDate.localeCompare(b.requestedDate) : a.priority === "KHAN_CAP" ? -1 : 1
        : b.requestedDate.localeCompare(a.requestedDate),
    );

  return (
    <>
      <PageHeader title="Yêu cầu máu" description="Duyệt số lượng theo tồn kho, quét túi và xuất cho bệnh viện." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs tabs={tabs} value={tab} onChange={setTab} counts={counts} />
        <SearchInput placeholder="Lọc theo bệnh viện" onSearch={setHospital} className="w-full sm:w-64" />
      </div>
      {error && <ErrorState error={error} />}
      <Card className="gap-0 p-0">
        {isLoading && <TableSkeleton />}
        {data && rows.length === 0 && <EmptyState title="Không có yêu cầu nào" />}
        <div className="divide-y">
          {rows.map((r) => <RequestRow key={r.requestId} r={r} href={`/staff/requests/${r.requestId}`} showHospital />)}
        </div>
      </Card>
    </>
  );
}
