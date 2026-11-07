"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NativeSelect, toOptions } from "@/components/app/native-select";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { SearchInput } from "@/components/app/search-input";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { BloodTypeBadge, StatusBadge } from "@/components/app/status-badge";
import { api, qs } from "@/lib/api";
import { BLOOD_TYPES, bloodGroup, fmtDate, registrationStatus, userStatus } from "@/lib/format";
import type { DonationHistoryItem, DonorDetail, DonorSummary, Page } from "@/lib/types";

function DonorSheet({ donorId, onClose }: { donorId: number | null; onClose: () => void }) {
  const detail = useQuery({
    queryKey: ["donors", "detail", donorId],
    queryFn: () => api<DonorDetail>(`/api/staff/donor/donor-detail/${donorId}`),
    enabled: donorId !== null,
  });
  const history = useQuery({
    queryKey: ["donors", "history", donorId],
    queryFn: () => api<Page<DonationHistoryItem>>(`/api/staff/donor/history-donate/${donorId}?page=0&size=20`),
    enabled: donorId !== null,
  });
  const d = detail.data;
  return (
    <Sheet open={donorId !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{d?.fullName ?? "Người hiến máu"}</SheetTitle>
          <SheetDescription>{d?.email}</SheetDescription>
        </SheetHeader>
        {d && (
          <div className="grid gap-6 px-4 pb-6">
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <span className="grid size-14 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
                {bloodGroup(d.bloodType, d.rhFactor)}
              </span>
              <div>
                <p className="text-2xl font-semibold">{d.totalDonations} <span className="text-sm font-normal text-muted-foreground">lần hiến</span></p>
                <p className="text-sm text-muted-foreground">Lần gần nhất: {fmtDate(d.lastDonationDate)}</p>
              </div>
            </div>
            {d.hasUnsafeTest && (
              <p className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                <ShieldAlert className="size-4" /> Có kết quả xét nghiệm không an toàn
              </p>
            )}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-4 text-sm">
              {[
                ["Điện thoại", d.phone],
                ["Giới tính", d.gender ?? "—"],
                ["Ngày sinh", fmtDate(d.dob)],
                ["Tình trạng", d.displayStatus],
                ["Địa chỉ", d.address ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className={k === "Địa chỉ" ? "col-span-2" : ""}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Lịch sử hiến máu</h3>
              {history.data?.content.length === 0 && <p className="text-sm text-muted-foreground">Chưa hiến máu lần nào.</p>}
              <div className="grid gap-2">
                {history.data?.content.map((h) => (
                  <div key={h.registrationId} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{h.eventName}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(h.donationDate)} · {h.volumeMl} ml</p>
                    </div>
                    <StatusBadge {...registrationStatus[h.status]} />
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

const groupOptions = BLOOD_TYPES.flatMap((t) => ["+", "-"].map((rh) => ({ value: `${t}${rh}`, label: `${t}${rh}` })));

export default function DonorsPage() {
  const [keyword, setKeyword] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const bloodType = group.replace(/[+-]$/, "");
  const rhFactor = group.slice(-1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["donors", "list", keyword, group, status, page],
    queryFn: () =>
      api<Page<DonorSummary>>(
        `/api/staff/donor/get-list-donor${qs({ keyword, bloodType: group && bloodType, rhFactor: group && rhFactor, status, page, size: 10 })}`,
      ),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Người hiến máu" description="Người đăng ký trực tuyến và khách vãng lai đã từng tham gia." />
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <SearchInput placeholder="Tìm theo tên, email, điện thoại" onSearch={(v) => { setKeyword(v); setPage(0); }} className="w-full sm:w-72" />
          <NativeSelect className="w-36" placeholder="Mọi nhóm máu" options={groupOptions} value={group} onChange={(e) => { setGroup(e.target.value); setPage(0); }} />
          <NativeSelect className="w-44" placeholder="Mọi trạng thái" options={toOptions(userStatus)} value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} />
        </div>
        {error && <div className="p-4"><ErrorState error={error} /></div>}
        {isLoading && <TableSkeleton />}
        {data && data.content.length === 0 && <EmptyState title="Không tìm thấy người hiến" />}
        {data && data.content.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Họ tên</TableHead>
                <TableHead>Nhóm máu</TableHead>
                <TableHead>Điện thoại</TableHead>
                <TableHead className="text-right">Số lần hiến</TableHead>
                <TableHead>Lần gần nhất</TableHead>
                <TableHead className="pr-4">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((d) => (
                <TableRow key={d.donorId} className="cursor-pointer" onClick={() => setSelected(d.donorId)}>
                  <TableCell className="pl-4">
                    <p className="font-medium">{d.fullName}</p>
                    <p className="text-xs text-muted-foreground">{d.email}</p>
                  </TableCell>
                  <TableCell>{d.bloodType ? <BloodTypeBadge value={bloodGroup(d.bloodType, d.rhFactor)} /> : "—"}</TableCell>
                  <TableCell>{d.phone}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.totalDonations}</TableCell>
                  <TableCell>{fmtDate(d.lastDonationDate)}</TableCell>
                  <TableCell className="pr-4"><StatusBadge {...userStatus[d.userStatus]} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {data && <Pagination page={page} totalPages={data.page.totalPages} totalElements={data.page.totalElements} onChange={setPage} />}
      </Card>
      <DonorSheet donorId={selected} onClose={() => setSelected(null)} />
    </>
  );
}
