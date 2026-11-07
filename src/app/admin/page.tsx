"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarHeart, Droplets, FileHeart, UserRound } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { api } from "@/lib/api";
import { eventStatus, fmtDate, priority, requestStatus } from "@/lib/format";
import type {
  BloodRequestSummary, BloodTypeStat, DonorStat, EquipmentStat, EventCountStat, EventPerformance,
  EventSummary, GeneralStat, HospitalStat, StaffStat,
} from "@/lib/types";

const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function useStat<T>(path: string) {
  return useQuery({ queryKey: ["admin", path], queryFn: () => api<T>(path) });
}

const tooltipStyle = {
  contentStyle: { borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 },
  cursor: { fill: "var(--muted)" },
};

export default function AdminDashboard() {
  const general = useStat<GeneralStat>("/api/admin/general-stat");
  const donors = useStat<DonorStat>("/api/admin/donor-stat");
  const events = useStat<EventCountStat>("/api/admin/event/event-stat");
  const hospitals = useStat<HospitalStat>("/api/admin/hospital-stat");
  const staff = useStat<StaffStat>("/api/admin/staff-stat");
  const equipment = useStat<EquipmentStat>("/api/admin/storage-equipment-stat");
  const bloodStat = useStat<BloodTypeStat[]>("/api/admin/blood-stat");
  const performance = useStat<EventPerformance>("/api/admin/event-stat");
  const requests = useStat<BloodRequestSummary[]>("/api/staff/blood-request/list-request");
  const campaigns = useStat<EventSummary[]>("/api/shared/event/get-list-event");

  const stock = GROUPS.map((g) => ({
    group: g,
    total: bloodStat.data?.filter((s) => `${s.bloodType}${s.rhFactor}` === g).reduce((n, s) => n + s.total, 0) ?? 0,
  }));
  const perf = (performance.data?.events ?? []).slice(0, 6).map((e) => ({
    name: e.eventName.length > 22 ? e.eventName.slice(0, 22) + "…" : e.eventName,
    "Đăng ký": e.registeredCount,
    "Thực tế": e.actualCount,
  }));
  const pending = (requests.data ?? []).filter((r) => r.status === "CHO_DUYET").length;
  const upcoming = (campaigns.data ?? []).filter((e) => e.status === "SAP_TOI" || e.status === "DANG_MO").slice(0, 5);

  return (
    <>
      <PageHeader title="Tổng quan" description="Tình hình kho máu, chiến dịch và yêu cầu từ bệnh viện." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Túi máu trong hệ thống" value={general.data?.totalBloodBag} icon={Droplets} loading={general.isLoading}
          hint={equipment.data ? `${equipment.data.activeEquipment}/${equipment.data.totalEquipment} tủ bảo quản đang hoạt động` : undefined} />
        <StatCard label="Sắp hết hạn" value={general.data?.totalExpiringBloodBag} icon={AlertTriangle} accent="amber" loading={general.isLoading}
          hint="Cần ưu tiên xuất kho" />
        <StatCard label="Chiến dịch" value={events.data ? events.data.ongoingEvent + events.data.upcomingEvent : undefined} icon={CalendarHeart}
          accent="sky" loading={events.isLoading}
          hint={events.data ? `${events.data.ongoingEvent} đang diễn ra · ${events.data.upcomingEvent} sắp tới` : undefined} />
        <StatCard label="Yêu cầu máu chờ duyệt" value={requests.data ? pending : undefined} icon={FileHeart} accent="violet" loading={requests.isLoading}
          hint={hospitals.data ? `${hospitals.data.activeHospital} bệnh viện đang hợp tác` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Tồn kho theo nhóm máu</CardTitle>
            <CardDescription>Số túi theo nhóm máu và yếu tố Rh</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {bloodStat.isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stock} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="group" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v} túi`, "Tồn kho"]} />
                  <Bar dataKey="total" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Nhân sự & người hiến</CardTitle>
            <CardDescription>Số liệu hiện tại</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              { label: "Người hiến máu", value: donors.data?.totalDonor, sub: donors.data ? `${donors.data.donatedThisMonth} người hiến trong tháng` : "" },
              { label: "Nhân viên", value: staff.data?.totalStaff, sub: staff.data ? `${staff.data.techStaff} kỹ thuật · ${staff.data.inventoryStaff} kho` : "" },
              { label: "Bệnh viện", value: hospitals.data?.totalHospital, sub: hospitals.data ? `${hospitals.data.totalRequest} yêu cầu máu` : "" },
              { label: "Tủ gần đầy", value: equipment.data?.nearlyFullEquipment, sub: equipment.data ? `${equipment.data.maintenanceEquipment} tủ đang bảo trì` : "" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-muted"><UserRound className="size-4 text-muted-foreground" /></span>
                  <div>
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.sub}</p>
                  </div>
                </div>
                <span className="text-xl font-semibold tabular-nums">{row.value ?? "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hiệu quả chiến dịch</CardTitle>
            <CardDescription>Số người đăng ký so với số người đã hiến</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {performance.isLoading ? <Skeleton className="h-full w-full" /> : perf.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perf} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} interval={0} height={50} angle={-12} textAnchor="end" />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Đăng ký" fill="var(--chart-5)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Thực tế" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yêu cầu máu gần đây</CardTitle>
            <CardDescription>Từ các bệnh viện</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {requests.isLoading && <Skeleton className="h-40 w-full" />}
            {requests.data?.length === 0 && <EmptyState title="Chưa có yêu cầu nào" />}
            {requests.data?.slice(0, 5).map((r) => (
              <div key={r.requestId} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">#{r.requestId} · {r.hospitalName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.detailRequests.map((d) => `${d.bloodType} ×${d.quantity}`).join(", ")} · hạn {fmtDate(r.deadlineDate)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge {...requestStatus[r.status]} />
                  {r.priority === "KHAN_CAP" && <StatusBadge {...priority.KHAN_CAP} />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Chiến dịch sắp tới</CardTitle>
          <CardDescription>Đang diễn ra và sắp diễn ra</CardDescription>
          <CardAction>
            <Link href="/admin/campaigns" className="text-sm text-primary hover:underline">Xem tất cả</Link>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-2">
          {campaigns.isLoading && <Skeleton className="h-32 w-full" />}
          {campaigns.data && upcoming.length === 0 && <EmptyState title="Không có chiến dịch sắp tới" />}
          {upcoming.map((e) => (
            <Link key={e.eventId} href={`/admin/campaigns/${e.eventId}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
              <div className="min-w-0">
                <p className="text-sm font-medium">{e.eventName}</p>
                <p className="truncate text-xs text-muted-foreground">{fmtDate(e.startDate)} · {e.location}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm tabular-nums text-muted-foreground">{e.currentAmount}/{e.targetAmount}</span>
                <StatusBadge {...eventStatus[e.status]} />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
