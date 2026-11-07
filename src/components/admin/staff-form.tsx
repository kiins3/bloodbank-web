"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import type { StaffDetail } from "@/lib/types";

const positions = [
  { value: "BAC_SI", label: "Bác sĩ", role: "STAFF_TECH" },
  { value: "Y_TA", label: "Y tá", role: "STAFF_TECH" },
  { value: "KY_THUAT", label: "Kỹ thuật viên", role: "STAFF_TECH" },
  { value: "QUAN_LY_KHO", label: "Quản lý kho", role: "STAFF_INVENTORY" },
] as const;

const base = {
  fullName: z.string().trim().min(2, "Nhập họ tên"),
  email: z.email("Email không hợp lệ"),
  phone: z.string().regex(/^(0|\+84)[35789][0-9]{8}$/, "Số điện thoại không hợp lệ"),
  gender: z.string().min(1, "Chọn giới tính"),
  dob: z.string().min(1, "Chọn ngày sinh"),
};
const createSchema = z.object({
  ...base,
  cccd: z.string().regex(/^[0-9]{12}$/, "CCCD gồm 12 chữ số"),
  position: z.enum(["BAC_SI", "Y_TA", "KY_THUAT", "QUAN_LY_KHO"]),
});
const editSchema = z.object({ ...base, address: z.string().optional() });
type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

const genderOptions = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
];

export function CreateStaffDialog({ trigger }: { trigger: (open: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { fullName: "", email: "", phone: "", gender: "", dob: "", cccd: "", position: "Y_TA" },
  });
  const { errors } = form.formState;
  const create = useApiMutation(
    (v: CreateValues) =>
      api("/api/admin/user/create-staff-account", {
        method: "POST",
        body: { ...v, role: positions.find((p) => p.value === v.position)!.role },
      }),
    {
      success: "Đã tạo tài khoản. Mật khẩu mặc định: 123456",
      invalidate: [["staff"], ["admin"]],
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    },
  );

  return (
    <>
      {trigger(() => setOpen(true))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm nhân viên</DialogTitle>
            <DialogDescription>Tài khoản được tạo với mật khẩu mặc định 123456, nhân viên đổi lại sau khi đăng nhập.</DialogDescription>
          </DialogHeader>
          <form id="create-staff" onSubmit={form.handleSubmit((v) => create.mutate(v))} className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ và tên" error={errors.fullName?.message} className="sm:col-span-2">
              <Input {...form.register("fullName")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </Field>
            <Field label="Số điện thoại" error={errors.phone?.message}>
              <Input type="tel" {...form.register("phone")} />
            </Field>
            <Field label="Số CCCD" error={errors.cccd?.message}>
              <Input inputMode="numeric" maxLength={12} {...form.register("cccd")} />
            </Field>
            <Field label="Ngày sinh" error={errors.dob?.message}>
              <Input type="date" {...form.register("dob")} />
            </Field>
            <Field label="Giới tính" error={errors.gender?.message}>
              <NativeSelect placeholder="Chọn" options={genderOptions} {...form.register("gender")} />
            </Field>
            <Field label="Chức vụ" error={errors.position?.message}>
              <NativeSelect options={positions.map((p) => ({ value: p.value, label: p.label }))} {...form.register("position")} />
            </Field>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" form="create-staff" disabled={create.isPending}>
              {create.isPending && <Loader2 className="animate-spin" />} Tạo tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditStaffForm({ staff, onDone }: { staff: StaffDetail; onDone: () => void }) {
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phone,
      gender: staff.gender ?? "",
      dob: staff.dob ?? "",
      address: staff.address ?? "",
    },
  });
  const { errors } = form.formState;
  const save = useApiMutation((v: EditValues) => api(`/api/admin/staff/update-staff/${staff.staffId}`, { method: "PATCH", body: v }), {
    success: "Đã lưu thông tin nhân viên",
    invalidate: [["staff"]],
    onSuccess: onDone,
  });

  return (
    <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4 sm:grid-cols-2">
      <Field label="Họ và tên" error={errors.fullName?.message} className="sm:col-span-2">
        <Input {...form.register("fullName")} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" {...form.register("email")} />
      </Field>
      <Field label="Số điện thoại" error={errors.phone?.message}>
        <Input type="tel" {...form.register("phone")} />
      </Field>
      <Field label="Ngày sinh" error={errors.dob?.message}>
        <Input type="date" {...form.register("dob")} />
      </Field>
      <Field label="Giới tính" error={errors.gender?.message}>
        <NativeSelect placeholder="Chọn" options={genderOptions} {...form.register("gender")} />
      </Field>
      <Field label="Địa chỉ" className="sm:col-span-2">
        <Input {...form.register("address")} />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onDone}>Hủy</Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="animate-spin" />} Lưu
        </Button>
      </div>
    </form>
  );
}
