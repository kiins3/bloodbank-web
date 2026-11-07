"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import { BLOOD_TYPES, toInputDate } from "@/lib/format";

const schema = z.object({
  fullName: z.string().trim().min(2, "Nhập họ tên"),
  cccd: z.string().regex(/^[0-9]{12}$/, "CCCD gồm 12 chữ số"),
  phone: z.string().regex(/^(0|\+84)[35789][0-9]{8}$/, "Số điện thoại không hợp lệ"),
  email: z.union([z.literal(""), z.email("Email không hợp lệ")]),
  gender: z.string().min(1, "Chọn giới tính"),
  dob: z.string().min(1, "Chọn ngày sinh"),
  address: z.string().trim().min(3, "Nhập địa chỉ"),
  bloodType: z.string(),
  rhFactor: z.string(),
});
type Values = z.infer<typeof schema>;
const empty: Values = { fullName: "", cccd: "", phone: "", email: "", gender: "", dob: "", address: "", bloodType: "", rhFactor: "" };

/** Registers someone who walks in without a ticket; they go straight to the screening queue. */
export function WalkInDialog({ eventId }: { eventId: number }) {
  const [open, setOpen] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const { errors } = form.formState;
  const save = useApiMutation(
    (v: Values) =>
      api(`/api/staff/donor/regis-for-visitor/${eventId}`, {
        method: "POST",
        body: { ...v, email: v.email || null, bloodType: v.bloodType || null, rhFactor: v.bloodType ? v.rhFactor || null : null },
      }),
    {
      success: "Đã đăng ký khách vãng lai, chuyển sang hàng chờ khám",
      invalidate: [["staff", "event-donors", eventId]],
      onSuccess: () => {
        setOpen(false);
        form.reset(empty);
      },
    },
  );

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><UserPlus /> Khách vãng lai</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Đăng ký khách vãng lai</DialogTitle>
            <DialogDescription>Khách phải đủ 18 tuổi và chưa hiến máu trong 84 ngày qua.</DialogDescription>
          </DialogHeader>
          <form id="walkin-form" onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-3">
            <Field label="Họ và tên" error={errors.fullName?.message}><Input autoFocus {...form.register("fullName")} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="CCCD" error={errors.cccd?.message}><Input inputMode="numeric" {...form.register("cccd")} /></Field>
              <Field label="Điện thoại" error={errors.phone?.message}><Input type="tel" {...form.register("phone")} /></Field>
              <Field label="Giới tính" error={errors.gender?.message}>
                <NativeSelect placeholder="Chọn" options={[{ value: "Nam", label: "Nam" }, { value: "Nữ", label: "Nữ" }]} {...form.register("gender")} />
              </Field>
              <Field label="Ngày sinh" error={errors.dob?.message}><Input type="date" max={toInputDate(new Date())} {...form.register("dob")} /></Field>
            </div>
            <Field label="Địa chỉ" error={errors.address?.message}><Input {...form.register("address")} /></Field>
            <Field label="Email (không bắt buộc)" error={errors.email?.message}><Input type="email" {...form.register("email")} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nhóm máu (nếu biết)">
                <NativeSelect placeholder="Chưa biết" options={BLOOD_TYPES.map((t) => ({ value: t, label: t }))} {...form.register("bloodType")} />
              </Field>
              <Field label="Rh">
                <NativeSelect placeholder="Chưa biết" options={[{ value: "+", label: "Rh+" }, { value: "-", label: "Rh−" }]} {...form.register("rhFactor")} />
              </Field>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" form="walkin-form" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />} Đăng ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
