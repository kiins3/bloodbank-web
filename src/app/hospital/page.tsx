"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, Hourglass, PlusCircle, Truck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { RequestRow } from "@/components/hospital/request-card";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { BLOOD_GROUPS } from "@/lib/format";
import type { BloodRequestSummary, HospitalDashboard, HospitalProfile } from "@/lib/types";

const RECEIVED = ["DA_NHAN", "DA_NHAN_MOT_PHAN"];

export default function HospitalHome() {
  const session = useSession();
  const stats = useQuery({ queryKey: ["hospital", "stats"], queryFn: () => api<HospitalDashboard>("/api/hospital/stats") });
  const list = useQuery({
    queryKey: ["hospital", "requests"],
    queryFn: () => api<BloodRequestSummary[]>("/api/hospital/blood-request/my-list-request"),
  });
  const profile = useQuery({
    queryKey: ["hospital", "profile", session?.email],
    queryFn: () => api<HospitalProfile>("/api/shared/user/get-profile"),
    enabled: !!session,
  });

  const requests = [...(list.data ?? [])].sort((a, b) => b.requestedDate.localeCompare(a.requestedDate));
  const inTransit = requests.filter((r) => r.status === "DANG_VAN_CHUYEN");
  const received = requests.filter((r) => RECEIVED.includes(r.status)).length;

  // Bags requested per blood group, across requests that weren't cancelled.
  const byGroup = BLOOD_GROUPS.map((g) => ({
    group: g,
    bags: requests
      .filter((r) => r.status !== "DA_HUY")
      .flatMap((r) => r.detailRequests)
      .filter((d) => d.bloodType === g)
      .reduce((s, d) => s + d.quantity, 0),
  }));

  return (
    <>
      <PageHeader
        title={profile.data ? profile.data.hospitalName : "Tổng quan"}
        description="Theo dõi yêu cầu máu và xác nhận khi máu được giao tới."
        actions={<LinkButton href="/hospital/requests/new"><PlusCircle /> Gửi yêu cầu máu</LinkButton>}
      />
      {stats.error && <ErrorState error={stats.error} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Chờ duyệt" value={stats.data?.pendingApprovalCount} icon={Hourglass} accent="amber" loading={stats.isLoading} />
        <StatCard label="Đang vận chuyển" value={stats.data?.inTransitCount} icon={Truck} accent="sky" loading={stats.isLoading} />
        <StatCard label="Đã nhận" value={received} icon={CheckCircle2} accent="emerald" loading={list.isLoading} />
        <StatCard label="Tổng yêu cầu" value={requests.length} icon={ClipboardList} loading={list.isLoading} />
      </div>

      {inTransit.length > 0 && (
        <Card className="mt-6 gap-0 border-sky-200 bg-sky-50/50 p-0">
          <CardHeader className="border-b border-sky-200 py-4">
            <CardTitle className="flex items-center gap-2 text-sky-900"><Truck className="size-4" /> Máu đang trên đường tới</CardTitle>
            <CardDescription>Khi nhận được, mở yêu cầu để kiểm tra từng túi và xác nhận.</CardDescription>
          </CardHeader>
          <div className="divide-y divide-sky-100">
            {inTransit.map((r) => <RequestRow key={r.requestId} r={r} />)}
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="gap-0 p-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Yêu cầu gần đây</CardTitle>
            <CardAction><LinkButton href="/hospital/requests" variant="ghost" size="sm">Xem tất cả</LinkButton></CardAction>
          </CardHeader>
          {list.isLoading && <TableSkeleton rows={4} />}
          {list.data?.length === 0 && (
            <EmptyState title="Chưa có yêu cầu nào" description="Gửi yêu cầu đầu tiên khi bệnh viện cần máu cho bệnh nhân." />
          )}
          <div className="divide-y">
            {requests.slice(0, 5).map((r) => <RequestRow key={r.requestId} r={r} />)}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Số túi đã yêu cầu theo nhóm máu</CardTitle>
            <CardDescription>Không tính yêu cầu đã hủy</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byGroup} margin={{ left: -24, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="group" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "var(--muted)" }} formatter={(v) => [`${v} túi`, "Đã yêu cầu"]} />
                <Bar dataKey="bags" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
