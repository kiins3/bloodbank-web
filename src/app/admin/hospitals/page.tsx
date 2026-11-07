"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, Mail, MapPin, Pencil, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Field } from "@/components/app/field";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { SearchInput } from "@/components/app/search-input";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api, qs } from "@/lib/api";
import { fmtDate, fmtDateTime, priority, requestStatus, userStatus } from "@/lib/format";
import type { BloodRequestDetail, Hospital, HospitalRequestHistory, Page } from "@/lib/types";

const schema = z.object({
  hospitalName: z.string().trim().min(3, "Nhập tên bệnh viện"),
  email: z.email("Email không hợp lệ"),
  address: z.string().trim().min(5, "Nhập địa chỉ"),
  hotline: z.string().regex(/^[0-9+ ]{8,15}$/, "Số hotline không hợp lệ"),
});
type Values = z.infer<typeof schema>;

function HospitalDialog({ hospital, trigger }: { hospital?: Hospital; trigger: (open: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: hospital
      ? { hospitalName: hospital.hospitalName, email: hospital.email, address: hospital.address, hotline: hospital.hotline }
      : { hospitalName: "", email: "", address: "", hotline: "" },
  });
  const { errors } = form.formState;
  const save = useApiMutation(
    (v: Values) =>
      hospital
        ? api(`/api/admin/hospital/update-hospital/${hospital.hospitalId}`, { method: "PATCH", body: v })
        : api("/api/admin/user/create-hospital-account", { method: "POST", body: { ...v, password: "123456", status: "ACTIVE" } }),
    {
      success: hospital ? "Đã lưu thông tin bệnh viện" : "Đã tạo tài khoản bệnh viện. Mật khẩu mặc định: 123456",
      invalidate: [["hospitals"], ["admin"]],
      onSuccess: () => {
        setOpen(false);
        if (!hospital) form.reset();
      },
    },
  );

  return (
    <>
      {trigger(() => setOpen(true))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{hospital ? "Sửa thông tin bệnh viện" : "Thêm bệnh viện"}</DialogTitle>
            {!hospital && <DialogDescription>Bệnh viện đăng nhập bằng email này để gửi yêu cầu máu.</DialogDescription>}
          </DialogHeader>
          <form id="hospital-form" onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4">
            <Field label="Tên bệnh viện" error={errors.hospitalName?.message}><Input {...form.register("hospitalName")} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" error={errors.email?.message}><Input type="email" {...form.register("email")} /></Field>
              <Field label="Hotline" error={errors.hotline?.message}><Input type="tel" {...form.register("hotline")} /></Field>
            </div>
            <Field label="Địa chỉ" error={errors.address?.message}><Input {...form.register("address")} /></Field>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" form="hospital-form" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />} {hospital ? "Lưu" : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RequestDetail({ requestId }: { requestId: number }) {
  const { data } = useQuery({
    queryKey: ["hospitals", "request", requestId],
    queryFn: () => api<BloodRequestDetail>(`/api/admin/hospital/get-detail-request/${requestId}`),
  });
  if (!data) return <p className="p-3 text-xs text-muted-foreground">Đang tải…</p>;
  return (
    <div className="grid gap-2 border-t bg-muted/30 p-3 text-sm">
      {data.requestedItems.map((i) => (
        <div key={i.detailId} className="flex justify-between">
          <span>{i.bloodType} · {i.volume} ml</span>
          <span className="tabular-nums text-muted-foreground">duyệt {i.approvedQuantity ?? 0}/{i.quantity} túi</span>
        </div>
      ))}
      {data.exportDate && (
        <p className="text-xs text-muted-foreground">Xuất kho {fmtDateTime(data.exportDate)} bởi {data.exportedBy}</p>
      )}
    </div>
  );
}

function HospitalSheet({ hospital, onClose }: { hospital: Hospital | null; onClose: () => void }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const history = useQuery({
    queryKey: ["hospitals", "history", hospital?.hospitalId],
    queryFn: () => api<Page<HospitalRequestHistory>>(`/api/admin/hospital/get-history-request/${hospital!.hospitalId}?page=0&size=20`),
    enabled: !!hospital,
  });
  return (
    <Sheet open={!!hospital} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{hospital?.hospitalName}</SheetTitle>
          <SheetDescription>{hospital?.address}</SheetDescription>
        </SheetHeader>
        {hospital && (
          <div className="grid gap-6 px-4 pb-6">
            <div className="grid gap-2 rounded-lg border p-4 text-sm">
              <p className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{hospital.email}</p>
              <p className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{hospital.hotline}</p>
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 text-muted-foreground" />{hospital.address}</p>
            </div>
            <HospitalDialog hospital={hospital} trigger={(open) => <Button variant="outline" onClick={open}><Pencil /> Sửa thông tin</Button>} />
            <div>
              <h3 className="mb-2 text-sm font-semibold">Lịch sử yêu cầu máu</h3>
              {history.data?.content.length === 0 && <p className="text-sm text-muted-foreground">Chưa có yêu cầu nào.</p>}
              <div className="grid gap-2">
                {history.data?.content.map((r) => (
                  <div key={r.requestId} className="overflow-hidden rounded-lg border">
                    <button className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/40"
                      onClick={() => setOpenId(openId === r.requestId ? null : r.requestId)}>
                      <div>
                        <p className="text-sm font-medium">Yêu cầu #{r.requestId} · {r.totalQuantity} túi</p>
                        <p className="text-xs text-muted-foreground">Gửi {fmtDate(r.requestedDate)} · hạn {fmtDate(r.deadlineDate)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge {...requestStatus[r.status]} />
                        {r.priority === "KHAN_CAP" && <StatusBadge {...priority.KHAN_CAP} />}
                      </div>
                    </button>
                    {openId === r.requestId && <RequestDetail requestId={r.requestId} />}
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

export default function HospitalsPage() {
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Hospital | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["hospitals", "list", keyword, page],
    queryFn: () => api<Page<Hospital>>(`/api/admin/hospital/get-list-hospital${qs({ keyword, page, size: 9 })}`),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Bệnh viện"
        description="Các bệnh viện nhận máu từ ngân hàng máu."
        actions={<HospitalDialog trigger={(open) => <Button onClick={open}><Plus /> Thêm bệnh viện</Button>} />}
      />
      <SearchInput placeholder="Tìm bệnh viện" onSearch={(v) => { setKeyword(v); setPage(0); }} className="mb-4 w-full sm:w-72" />
      {error && <ErrorState error={error} />}
      {isLoading && <Card><TableSkeleton /></Card>}
      {data && data.content.length === 0 && <Card><EmptyState title="Không tìm thấy bệnh viện" /></Card>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.content.map((h) => (
          <Card key={h.hospitalId} className="cursor-pointer gap-3 p-5 transition-shadow hover:shadow-md" onClick={() => setSelected(h)}>
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Building2 className="size-5" /></span>
              <StatusBadge {...userStatus[h.status]} />
            </div>
            <div>
              <h3 className="font-semibold">{h.hospitalName}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{h.address}</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="size-3.5" />{h.hotline}</span>
              <span className="flex items-center gap-1"><Mail className="size-3.5" />{h.email}</span>
            </div>
          </Card>
        ))}
      </div>
      {data && data.page.totalPages > 1 && (
        <Card className="mt-4 p-0"><Pagination page={page} totalPages={data.page.totalPages} totalElements={data.page.totalElements} onChange={setPage} /></Card>
      )}
      <HospitalSheet hospital={selected} onClose={() => setSelected(null)} />
    </>
  );
}
