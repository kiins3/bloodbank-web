"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateStaffDialog, EditStaffForm } from "@/components/admin/staff-form";
import { NativeSelect, toOptions } from "@/components/app/native-select";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { SearchInput } from "@/components/app/search-input";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { api, qs } from "@/lib/api";
import { assignmentRole, fmtDate, position, userStatus } from "@/lib/format";
import type { Page, Position, StaffAssignmentHistory, StaffDetail, StaffSummary } from "@/lib/types";

const positionOptions = toOptions(Object.fromEntries(Object.entries(position).filter(([k]) => k !== "ADMIN")) as Record<Position, string>);

function StaffSheet({ staffId, onClose }: { staffId: number | null; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  const detail = useQuery({
    queryKey: ["staff", "detail", staffId],
    queryFn: () => api<StaffDetail>(`/api/admin/staff/get-staff-detail/${staffId}`),
    enabled: staffId !== null,
  });
  const history = useQuery({
    queryKey: ["staff", "history", staffId],
    queryFn: () => api<Page<StaffAssignmentHistory>>(`/api/admin/staff/get-history-assignment/${staffId}?page=0&size=20`),
    enabled: staffId !== null,
  });
  const s = detail.data;

  return (
    <Sheet open={staffId !== null} onOpenChange={(o) => { if (!o) { onClose(); setEditing(false); } }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{s?.fullName ?? "Nhân viên"}</SheetTitle>
          <SheetDescription>{s ? `${position[s.position]} · ${s.email}` : ""}</SheetDescription>
        </SheetHeader>
        {s && (
          <div className="grid gap-6 px-4 pb-6">
            {editing ? (
              <EditStaffForm staff={s} onDone={() => setEditing(false)} />
            ) : (
              <div className="grid gap-3">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-4 text-sm">
                  {[
                    ["Điện thoại", s.phone],
                    ["Giới tính", s.gender ?? "—"],
                    ["Ngày sinh", fmtDate(s.dob)],
                    ["Trạng thái", userStatus[s.status].label],
                    ["Địa chỉ", s.address ?? "—"],
                  ].map(([k, v]) => (
                    <div key={k} className={k === "Địa chỉ" ? "col-span-2" : ""}>
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
                <Button variant="outline" onClick={() => setEditing(true)}><Pencil /> Sửa thông tin</Button>
              </div>
            )}
            <div>
              <h3 className="mb-2 text-sm font-semibold">Lịch sử phân công</h3>
              {history.data?.content.length === 0 && <p className="text-sm text-muted-foreground">Chưa tham gia chiến dịch nào.</p>}
              <div className="grid gap-2">
                {history.data?.content.map((h) => (
                  <div key={h.eventId} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{h.eventName}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(h.startDate)} · {assignmentRole[h.role]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function StaffPage() {
  const [keyword, setKeyword] = useState("");
  const [pos, setPos] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["staff", "list", keyword, pos, page],
    queryFn: () => api<Page<StaffSummary>>(`/api/admin/staff/get-list-staff${qs({ keyword, position: pos, page, size: 10 })}`),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Nhân sự"
        description="Bác sĩ, y tá, kỹ thuật viên và nhân viên kho."
        actions={<CreateStaffDialog trigger={(open) => <Button onClick={open}><Plus /> Thêm nhân viên</Button>} />}
      />
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <SearchInput placeholder="Tìm theo tên, email, điện thoại" onSearch={(v) => { setKeyword(v); setPage(0); }} className="w-full sm:w-72" />
          <NativeSelect className="w-44" placeholder="Tất cả chức vụ" options={positionOptions} value={pos}
            onChange={(e) => { setPos(e.target.value); setPage(0); }} />
        </div>
        {error && <div className="p-4"><ErrorState error={error} /></div>}
        {isLoading && <TableSkeleton />}
        {data && data.content.length === 0 && <EmptyState title="Không tìm thấy nhân viên" />}
        {data && data.content.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Họ tên</TableHead>
                <TableHead>Chức vụ</TableHead>
                <TableHead>Điện thoại</TableHead>
                <TableHead className="pr-4">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((s) => (
                <TableRow key={s.staffId} className="cursor-pointer" onClick={() => setSelected(s.staffId)}>
                  <TableCell className="pl-4">
                    <p className="font-medium">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </TableCell>
                  <TableCell>{position[s.position]}</TableCell>
                  <TableCell>{s.phone}</TableCell>
                  <TableCell className="pr-4"><StatusBadge {...userStatus[s.status]} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {data && <Pagination page={page} totalPages={data.page.totalPages} totalElements={data.page.totalElements} onChange={setPage} />}
      </Card>
      <StaffSheet staffId={selected} onClose={() => setSelected(null)} />
    </>
  );
}
