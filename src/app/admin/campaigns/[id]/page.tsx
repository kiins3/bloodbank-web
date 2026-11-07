"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Download, MapPin, Pencil, Target, UserCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssignStaffDialog } from "@/components/admin/assign-staff-dialog";
import { CampaignForm } from "@/components/admin/campaign-form";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { api, download } from "@/lib/api";
import { eventStatus, fmtDate, fmtTime, percent, position, registrationStatus } from "@/lib/format";
import type { EventAssignmentList, EventDetail, EventSummary, RegistrationStatus } from "@/lib/types";

type EventDonor = {
  regisId: number;
  donorId: number;
  ticketCode: string | null;
  fullName: string;
  gender: string | null;
  dob: string | null;
  phone: string;
  status: RegistrationStatus;
};

export default function CampaignDetailPage() {
  const id = Number(useParams<{ id: string }>().id);
  const event = useQuery({ queryKey: ["event", id], queryFn: () => api<EventDetail>(`/api/shared/event/event-detail/${id}`) });
  const assignment = useQuery({
    queryKey: ["assignment", id],
    queryFn: () => api<EventAssignmentList>(`/api/admin/assignment/list-assignment-staff/${id}`),
  });
  const donors = useQuery({
    queryKey: ["event-donors", id],
    queryFn: () => api<EventDonor[]>(`/api/staff/registration/get-all-donors-of-event/${id}`),
  });

  if (event.error) return <ErrorState error={event.error} />;
  const e = event.data;
  const donated = donors.data?.filter((d) => d.status === "DA_LAY_MAU" || d.status === "HOAN_THANH").length ?? 0;
  const staff = assignment.data?.assignedStaff ?? [];
  const editable = e?.status === "SAP_TOI";

  return (
    <>
      <Link href="/admin/campaigns" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Tất cả chiến dịch
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{e?.eventName ?? "…"}</h1>
            {e && <StatusBadge {...eventStatus[e.status]} />}
          </div>
          {e && (
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CalendarDays className="size-4" /> {fmtDate(e.startDate)} · {fmtTime(e.startDate)} – {fmtTime(e.endDate)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {e.location}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              download(`/api/staff/reports/events/${id}/donors`, `nguoi-hien-chien-dich-${id}.xlsx`).catch((err) => toast.error(err.message))
            }
          >
            <Download /> Xuất Excel
          </Button>
          {e && editable && (
            <CampaignForm
              event={{ ...e, currentAmount: e.registeredCount } as EventSummary}
              trigger={(open) => <Button variant="outline" onClick={open}><Pencil /> Sửa</Button>}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Chỉ tiêu" value={e?.targetAmount} icon={Target} loading={event.isLoading} />
        <StatCard label="Đã đăng ký" value={e?.registeredCount} icon={Users} accent="sky" loading={event.isLoading}
          hint={e ? `${percent(e.registeredCount, e.targetAmount)}% chỉ tiêu` : undefined} />
        <StatCard label="Đã hiến máu" value={donors.data ? donated : undefined} icon={UserCheck} accent="emerald" loading={donors.isLoading}
          hint={e && donors.data ? `${percent(donated, e.registeredCount)}% người đăng ký` : undefined} />
        <StatCard label="Nhân sự" value={assignment.data ? staff.length : undefined} icon={UserPlus} accent="violet" loading={assignment.isLoading} />
      </div>

      {e && (
        <Card className="mt-6 p-5">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Tiến độ đăng ký</span>
            <span className="tabular-nums text-muted-foreground">{e.registeredCount}/{e.targetAmount}</span>
          </div>
          <Progress value={percent(e.registeredCount, e.targetAmount)} className="mt-3" />
        </Card>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Nhân sự phân công</CardTitle>
            <CardDescription>{editable ? "Có thể thay đổi đến trước giờ bắt đầu" : "Đã chốt danh sách"}</CardDescription>
            {editable && (
              <CardAction>
                <AssignStaffDialog eventId={id} assignedIds={staff.map((s) => s.staffId)}
                  trigger={(open) => <Button size="sm" variant="outline" onClick={open}><UserPlus /> Phân công</Button>} />
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="grid gap-2">
            {assignment.isLoading && <TableSkeleton rows={3} />}
            {assignment.data && staff.length === 0 && <EmptyState title="Chưa phân công ai" />}
            {staff.map((s) => (
              <div key={s.staffId} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {s.fullName.split(" ").slice(-1)[0].slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium">{s.fullName}</p>
                  <p className="text-xs text-muted-foreground">{position[s.position]}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Người tham gia</CardTitle>
            <CardDescription>{donors.data?.length ?? 0} lượt đăng ký, gồm cả khách vãng lai</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {donors.isLoading && <TableSkeleton />}
            {donors.data && donors.data.length === 0 && <EmptyState title="Chưa có người đăng ký" />}
            {donors.data && donors.data.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Họ tên</TableHead>
                    <TableHead>Giới tính</TableHead>
                    <TableHead>Ngày sinh</TableHead>
                    <TableHead>Điện thoại</TableHead>
                    <TableHead className="pr-4">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donors.data.map((d) => (
                    <TableRow key={d.regisId}>
                      <TableCell className="pl-4">
                        <p className="font-medium">{d.fullName}</p>
                        <p className="font-mono text-xs text-muted-foreground">{d.ticketCode ?? "Khách vãng lai"}</p>
                      </TableCell>
                      <TableCell>{d.gender ?? "—"}</TableCell>
                      <TableCell>{fmtDate(d.dob)}</TableCell>
                      <TableCell>{d.phone}</TableCell>
                      <TableCell className="pr-4"><StatusBadge {...registrationStatus[d.status]} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
