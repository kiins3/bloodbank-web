"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Droplet, Loader2, MapPin, ScanLine, Stethoscope, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { FilterTabs } from "@/components/app/filter-tabs";
import { LinkButton } from "@/components/app/link-button";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { CollectDialog } from "@/components/staff/collect-dialog";
import { QrScanner } from "@/components/staff/qr-scanner";
import { ScreeningDialog } from "@/components/staff/screening-dialog";
import { WalkInDialog } from "@/components/staff/walk-in-dialog";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useMyAssignments } from "@/hooks/use-staff";
import { useStomp } from "@/hooks/use-stomp";
import { api } from "@/lib/api";
import { eventStatus, fmtDate, fmtTime, registrationStatus } from "@/lib/format";
import type { AssignmentRole, EventDetail, EventDonor, RegistrationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "RECEPTION" | "SCREENING" | "COLLECTION" | "ALL";
const tabForRole: Record<AssignmentRole, Tab> = { TIEP_DON: "RECEPTION", KHAM_SANG_LOC: "SCREENING", LAY_MAU: "COLLECTION" };

const age = (dob: string | null) => (dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null);

function DonorLine({ d, children }: { d: EventDonor; children?: React.ReactNode }) {
  const a = age(d.dob);
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
        {d.fullName.split(/\s+/).pop()?.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{d.fullName}</p>
        <p className="text-xs text-muted-foreground">
          {[d.gender, a ? `${a} tuổi` : null, d.phone].filter(Boolean).join(" · ")} · <span className="font-mono">{d.ticketCode}</span>
        </p>
      </div>
      <StatusBadge {...registrationStatus[d.status]} />
      {children}
    </div>
  );
}

function Queue({ title, description, rows, empty, render }: {
  title: string; description?: string; rows: EventDonor[]; empty: string; render: (d: EventDonor) => React.ReactNode;
}) {
  return (
    <Card className="gap-0 p-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center gap-2">{title} <span className="rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">{rows.length}</span></CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {rows.length === 0 ? <EmptyState title={empty} /> : <div className="divide-y">{rows.map((d) => <div key={d.regisId}>{render(d)}</div>)}</div>}
    </Card>
  );
}

export default function EventDeskPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const qc = useQueryClient();
  const assignments = useMyAssignments();
  const myRole = assignments.data?.find((a) => a.eventId === eventId)?.role;
  const [tab, setTab] = useState<Tab | null>(null);
  const current: Tab = tab ?? (myRole ? tabForRole[myRole] : "RECEPTION");
  const [code, setCode] = useState("");

  const event = useQuery({ queryKey: ["event", id], queryFn: () => api<EventDetail>(`/api/shared/event/event-detail/${id}`) });
  const donors = useQuery({
    queryKey: ["staff", "event-donors", eventId],
    queryFn: () => api<EventDonor[]>(`/api/staff/registration/get-all-donors-of-event/${eventId}`),
    // Screening and collection by other staff are not broadcast, so poll as a fallback.
    refetchInterval: 15000,
  });

  const live = useStomp([`/topic/event/${eventId}/new-visitor`, `/topic/event/${eventId}/cancel-visitor`], (_t, body) => {
    const n = (body ?? {}) as { donorName?: string; message?: string };
    toast.info(n.message ?? "Danh sách vừa thay đổi", { description: n.donorName });
    qc.invalidateQueries({ queryKey: ["staff", "event-donors", eventId] });
  });

  const checkin = useApiMutation(
    (ticket: string) => api<EventDonor>(`/api/staff/registration/checkin/${encodeURIComponent(ticket)}/${eventId}`, { method: "POST" }),
    {
      invalidate: [["staff", "event-donors", eventId]],
      onSuccess: (d) => {
        toast.success(`Đã check-in: ${d.fullName}`, { description: "Mời người hiến sang bàn khám sàng lọc." });
        setCode("");
      },
    },
  );
  const cancel = useApiMutation((regisId: number) => api(`/api/staff/donor/cancel-visitor/${regisId}`, { method: "PATCH" }), {
    success: "Đã hủy lượt đăng ký",
    invalidate: [["staff", "event-donors", eventId]],
  });
  const { mutate: doCheckin } = checkin;
  const onScan = useCallback((c: string) => doCheckin(c.toUpperCase()), [doCheckin]);

  const list = useMemo(() => donors.data ?? [], [donors.data]);
  const by = (...s: RegistrationStatus[]) => list.filter((d) => s.includes(d.status));
  const counts: Record<Tab, number> = {
    RECEPTION: by("DA_DANG_KY").length,
    SCREENING: by("CHO_KHAM").length,
    COLLECTION: by("DONG_Y").length,
    ALL: list.length,
  };
  const e = event.data;
  const open = e?.status === "DANG_MO";

  return (
    <>
      <LinkButton href="/staff/events" variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground"><ArrowLeft /> Ngày hiến máu</LinkButton>
      {event.error && <ErrorState error={event.error} />}
      {e && (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{e.eventName}</h1>
              <StatusBadge {...eventStatus[e.status]} />
              <span className={cn("flex items-center gap-1.5 text-xs", live ? "text-emerald-600" : "text-muted-foreground")}>
                <span className={cn("size-2 rounded-full", live ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40")} />
                {live ? "Trực tiếp" : "Đang kết nối"}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{fmtDate(e.startDate)} · {fmtTime(e.startDate)}–{fmtTime(e.endDate)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{e.location}</span>
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ["Chưa đến", counts.RECEPTION],
              ["Chờ khám", counts.SCREENING],
              ["Chờ lấy máu", counts.COLLECTION],
              ["Đã lấy máu", by("DA_LAY_MAU", "HOAN_THANH").length],
            ].map(([l, n]) => (
              <div key={l} className="rounded-lg border bg-background px-3 py-2">
                <p className="text-lg font-semibold tabular-nums">{n}</p>
                <p className="text-[11px] text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {e && !open && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Chiến dịch {eventStatus[e.status].label.toLowerCase()}. Chỉ check-in được khi chiến dịch đang diễn ra.
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            { value: "RECEPTION", label: "Tiếp đón" },
            { value: "SCREENING", label: "Khám sàng lọc" },
            { value: "COLLECTION", label: "Lấy máu" },
            { value: "ALL", label: "Tất cả" },
          ]}
          value={current}
          onChange={setTab}
          counts={counts}
        />
        {myRole && <p className="text-xs text-muted-foreground">Bạn được phân công: <span className="font-medium text-foreground">{tabLabel[tabForRole[myRole]]}</span></p>}
      </div>

      {donors.error && <ErrorState error={donors.error} />}
      {donors.isLoading && <Card><TableSkeleton /></Card>}

      {donors.data && current === "RECEPTION" && (
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <Card className="self-start">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ScanLine className="size-4 text-primary" /> Check-in</CardTitle>
              <CardDescription>Quét QR trên vé (máy quét hoặc camera) hoặc gõ mã vé rồi nhấn Enter.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <form onSubmit={(ev) => { ev.preventDefault(); if (code.trim()) checkin.mutate(code.trim().toUpperCase()); }} className="flex gap-2">
                <Input autoFocus placeholder="HM-XXXXXXXX" value={code} onChange={(ev) => setCode(ev.target.value)} className="font-mono uppercase" disabled={!open} />
                <Button type="submit" disabled={!open || !code.trim() || checkin.isPending}>
                  {checkin.isPending ? <Loader2 className="animate-spin" /> : <UserCheck />}
                </Button>
              </form>
              <div className="flex flex-wrap gap-2">
                {open && <QrScanner onResult={onScan} />}
                {open && <WalkInDialog eventId={eventId} />}
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-6">
            <Queue
              title="Đã đăng ký, chưa đến"
              rows={by("DA_DANG_KY")}
              empty="Tất cả người đăng ký đã check-in"
              render={(d) => (
                <DonorLine d={d}>
                  <Button size="sm" variant="outline" disabled={!open || checkin.isPending} onClick={() => checkin.mutate(d.ticketCode)}>
                    <UserCheck /> Check-in
                  </Button>
                </DonorLine>
              )}
            />
            <Queue
              title="Đang chờ khám"
              description="Có thể hủy lượt nếu người hiến rời đi trước khi khám"
              rows={by("CHO_KHAM")}
              empty="Chưa có ai chờ khám"
              render={(d) => (
                <DonorLine d={d}>
                  <ConfirmDialog
                    trigger={(o) => <Button size="icon-sm" variant="ghost" aria-label="Hủy lượt" onClick={o}><XCircle /></Button>}
                    title={`Hủy lượt của ${d.fullName}?`}
                    description="Người hiến sẽ được đưa khỏi hàng chờ khám."
                    confirmLabel="Hủy lượt"
                    destructive
                    onConfirm={() => cancel.mutateAsync(d.regisId)}
                  />
                </DonorLine>
              )}
            />
          </div>
        </div>
      )}

      {donors.data && current === "SCREENING" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Queue
            title="Chờ khám"
            rows={by("CHO_KHAM")}
            empty="Không có ai đang chờ khám"
            render={(d) => (
              <DonorLine d={d}>
                <ScreeningDialog donor={d} trigger={(o) => <Button size="sm" onClick={o}><Stethoscope /> Khám</Button>} />
              </DonorLine>
            )}
          />
          <Queue
            title="Đã khám"
            description="Sửa được kết quả cho tới khi người hiến sang bàn lấy máu"
            rows={by("DONG_Y", "TU_CHOI")}
            empty="Chưa khám ai"
            render={(d) => (
              <DonorLine d={d}>
                <ScreeningDialog donor={d} trigger={(o) => <Button size="sm" variant="ghost" onClick={o}>Sửa</Button>} />
              </DonorLine>
            )}
          />
        </div>
      )}

      {donors.data && current === "COLLECTION" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Queue
            title="Chờ lấy máu"
            description="Người hiến đã qua khám sàng lọc"
            rows={by("DONG_Y")}
            empty="Không có ai chờ lấy máu"
            render={(d) => (
              <DonorLine d={d}>
                <CollectDialog donor={d} trigger={(o) => <Button size="sm" onClick={o}><Droplet /> Lấy máu</Button>} />
              </DonorLine>
            )}
          />
          <Queue title="Đã xong" rows={by("DA_LAY_MAU", "HOAN_THANH", "THAT_BAI")} empty="Chưa lấy máu cho ai" render={(d) => <DonorLine d={d} />} />
        </div>
      )}

      {donors.data && current === "ALL" && (
        <Card className="gap-0 p-0">
          {list.length === 0 ? <EmptyState title="Chưa có người tham gia" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Họ tên</TableHead>
                  <TableHead>Mã vé</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Điện thoại</TableHead>
                  <TableHead className="pr-4">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((d) => (
                  <TableRow key={d.regisId}>
                    <TableCell className="pl-4 font-medium">{d.fullName}</TableCell>
                    <TableCell className="font-mono text-xs">{d.ticketCode}</TableCell>
                    <TableCell>{d.gender ?? "—"}</TableCell>
                    <TableCell>{d.phone}</TableCell>
                    <TableCell className="pr-4"><StatusBadge {...registrationStatus[d.status]} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </>
  );
}

const tabLabel: Record<Tab, string> = { RECEPTION: "Tiếp đón", SCREENING: "Khám sàng lọc", COLLECTION: "Lấy máu", ALL: "Tất cả" };
