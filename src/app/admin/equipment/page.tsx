"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Settings2, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Field } from "@/components/app/field";
import { NativeSelect, toOptions } from "@/components/app/native-select";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import { equipmentStatus, percent, productType } from "@/lib/format";
import type { Equipment, EquipmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().trim().min(2, "Nhập tên tủ"),
  productType: z.enum(["MAU_TOAN_PHAN", "TUI_HONG_CAU", "TUI_HUYET_TUONG", "TUI_TIEU_CAU"]),
  standard: z.string().trim().optional(),
  maxCapacity: z.coerce.number<number>().int().min(1, "Ít nhất 1 túi"),
});
type CreateValues = z.infer<typeof createSchema>;

function CreateEquipmentDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", productType: "TUI_HONG_CAU", standard: "", maxCapacity: 50 },
  });
  const { errors } = form.formState;
  const create = useApiMutation((v: CreateValues) => api("/api/admin/storage-equipment/create-equipment", { method: "POST", body: v }), {
    success: "Đã thêm thiết bị",
    invalidate: [["equipment"], ["admin"]],
    onSuccess: () => {
      setOpen(false);
      form.reset();
    },
  });
  return (
    <>
      <Button onClick={() => setOpen(true)}><Plus /> Thêm tủ bảo quản</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm tủ bảo quản</DialogTitle>
            <DialogDescription>Mỗi tủ chỉ chứa một loại chế phẩm.</DialogDescription>
          </DialogHeader>
          <form id="equipment-form" onSubmit={form.handleSubmit((v) => create.mutate(v))} className="grid gap-4">
            <Field label="Tên tủ" error={errors.name?.message}><Input placeholder="Tủ hồng cầu B2" {...form.register("name")} /></Field>
            <Field label="Loại chế phẩm"><NativeSelect options={toOptions(productType)} {...form.register("productType")} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Sức chứa (túi)" error={errors.maxCapacity?.message}><Input type="number" min={1} {...form.register("maxCapacity")} /></Field>
              <Field label="Tiêu chuẩn"><Input placeholder="ISO 13485" {...form.register("standard")} /></Field>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" form="equipment-form" disabled={create.isPending}>
              {create.isPending && <Loader2 className="animate-spin" />} Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditEquipmentDialog({ eq }: { eq: Equipment }) {
  const [open, setOpen] = useState(false);
  const [capacity, setCapacity] = useState(eq.maxCapacity);
  const [status, setStatus] = useState<EquipmentStatus>(eq.status);
  const save = useApiMutation(
    () => api(`/api/admin/storage-equipment/update-equipment/${eq.equipmentId}`, { method: "PATCH", body: { maxCapacity: capacity, status } }),
    { success: "Đã cập nhật thiết bị", invalidate: [["equipment"], ["admin"]], onSuccess: () => setOpen(false) },
  );
  return (
    <>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} aria-label={`Cài đặt ${eq.name}`}><Settings2 /></Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{eq.name}</DialogTitle>
            <DialogDescription>Đang chứa {eq.currentLoad} túi. Sức chứa mới không được nhỏ hơn số túi đang chứa.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sức chứa (túi)">
              <Input type="number" min={eq.currentLoad} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
            </Field>
            <Field label="Trạng thái">
              <NativeSelect options={toOptions(equipmentStatus)} value={status} onChange={(e) => setStatus(e.target.value as EquipmentStatus)} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />} Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function EquipmentPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => api<Equipment[]>("/api/staff/storage-equipment/list-equipment"),
  });

  return (
    <>
      <PageHeader title="Thiết bị bảo quản" description="Tủ lạnh, tủ đông và tủ lắc tiểu cầu theo từng loại chế phẩm." actions={<CreateEquipmentDialog />} />
      {error && <ErrorState error={error} />}
      {isLoading && <Card><TableSkeleton /></Card>}
      {data?.length === 0 && <Card><EmptyState title="Chưa có thiết bị" /></Card>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((eq) => {
          const pct = percent(eq.currentLoad, eq.maxCapacity);
          return (
            <Card key={eq.equipmentId} className="gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-sky-50 text-sky-600"><Thermometer className="size-5" /></span>
                  <div>
                    <h3 className="font-semibold">{eq.name}</h3>
                    <p className="text-xs text-muted-foreground">{productType[eq.productType]}{eq.standard ? ` · ${eq.standard}` : ""}</p>
                  </div>
                </div>
                <EditEquipmentDialog eq={eq} />
              </div>
              <div className="grid gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Đang chứa</span>
                  <span className="font-medium tabular-nums">{eq.currentLoad}/{eq.maxCapacity} túi</span>
                </div>
                <Progress value={pct} className={cn(pct >= 90 && "[&_[data-slot=progress-indicator]]:bg-amber-500")} />
              </div>
              <StatusBadge {...equipmentStatus[eq.status]} className="w-fit" />
            </Card>
          );
        })}
      </div>
    </>
  );
}
