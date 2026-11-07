"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlarmClock, ChevronRight, ClipboardList, FlaskConical, PackageOpen, TriangleAlert } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/app/link-button";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { RequestItemChips } from "@/components/hospital/request-items";
import { useSession } from "@/hooks/use-session";
import { useStaffProfile } from "@/hooks/use-staff";
import { Assignments } from "@/components/staff/assignments";
import { api } from "@/lib/api";
import { fmtDate, fmtDateTime, position, priority } from "@/lib/format";
import type { BloodRequestSummary, StaffGeneralStat } from "@/lib/types";

function PendingRequests() {
  const { data, isLoading } = useQuery({
    queryKey: ["staff", "requests"],
    queryFn: () => api<BloodRequestSummary[]>("/api/staff/blood-request/list-request"),
  });
  // Urgent first, then oldest first: the order the warehouse should work in.
  const rows = (data ?? [])
    .filter((r) => r.status === "CHO_DUYET")
    .sort((a, b) => (a.priority === b.priority ? a.requestedDate.localeCompare(b.requestedDate) : a.priority === "KHAN_CAP" ? -1 : 1));
  return (
    <Card className="gap-0 p-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Yêu cầu chờ duyệt</CardTitle>
        <CardDescription>Khẩn cấp trước, sau đó theo thứ tự gửi</CardDescription>
        <CardAction><LinkButton href="/staff/requests" variant="ghost" size="sm">Tất cả</LinkButton></CardAction>
      </CardHeader>
      {isLoading && <TableSkeleton rows={3} />}
      {data && rows.length === 0 && <EmptyState title="Không có yêu cầu chờ duyệt" />}
      <div className="divide-y">
        {rows.slice(0, 6).map((r) => (
          <Link key={r.requestId} href={`/staff/requests/${r.requestId}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40">
            <div className="grid min-w-0 flex-1 gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">#{r.requestId} · {r.hospitalName}</span>
                {r.priority === "KHAN_CAP" && <StatusBadge {...priority.KHAN_CAP} />}
              </div>
              <RequestItemChips items={r.detailRequests} />
              <p className="text-xs text-muted-foreground">Gửi {fmtDateTime(r.requestedDate)} · cần trước {fmtDate(r.deadlineDate)}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default function StaffHome() {
  const session = useSession();
  const profile = useStaffProfile();
  const stats = useQuery({ queryKey: ["staff", "stats"], queryFn: () => api<StaffGeneralStat>("/api/staff/general-stat") });
  const inventory = session?.role === "STAFF_INVENTORY";
  const s = stats.data;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{profile.data ? `Xin chào, ${profile.data.fullName}` : "Tổng quan"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{profile.data ? position[profile.data.position] : " "}</p>
      </div>
      {stats.error && <ErrorState error={stats.error} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {inventory ? (
          <>
            <StatCard label="Yêu cầu chờ duyệt" value={s?.pendingRequest} icon={ClipboardList} loading={stats.isLoading} />
            <StatCard label="Túi chờ nhập kho" value={s?.pendingStorageBloodBag} icon={PackageOpen} accent="violet" loading={stats.isLoading} />
          </>
        ) : (
          <>
            <StatCard label="Túi chờ xét nghiệm" value={s?.pendingTestBloodBag} icon={FlaskConical} loading={stats.isLoading} />
            <StatCard label="Túi chờ nhập kho" value={s?.pendingStorageBloodBag} icon={PackageOpen} accent="violet" loading={stats.isLoading} />
          </>
        )}
        <StatCard label="Sắp hết hạn (10 ngày)" value={s?.expiringBloodBag} icon={AlarmClock} accent="amber" loading={stats.isLoading} />
        <StatCard label="Đã hết hạn" value={s?.expiredBloodBag} icon={TriangleAlert} accent="sky" loading={stats.isLoading} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {inventory ? <PendingRequests /> : <Assignments />}
        <Card>
          <CardHeader><CardTitle>Việc cần làm</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {(inventory
              ? [
                  { href: "/staff/storage", label: "Nhập kho túi đã in nhãn", count: s?.pendingStorageBloodBag },
                  { href: "/staff/requests", label: "Duyệt và xuất máu cho bệnh viện", count: s?.pendingRequest },
                  { href: "/staff/returns", label: "Kiểm tra túi bệnh viện trả lại" },
                ]
              : [
                  { href: "/staff/lab", label: "Nhập kết quả xét nghiệm", count: s?.pendingTestBloodBag },
                  { href: "/staff/lab?tab=separate", label: "Tách chế phẩm và in nhãn" },
                  { href: "/staff/events", label: "Tiếp đón, khám và lấy máu tại chiến dịch" },
                ]
            ).map((t) => (
              <Link key={t.href} href={t.href} className="flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm hover:bg-muted/40">
                {t.label}
                <span className="flex items-center gap-2">
                  {!!t.count && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">{t.count}</span>}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
