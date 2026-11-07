"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChangePasswordCard } from "@/components/app/change-password-card";
import { Field } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState, TableSkeleton } from "@/components/app/states";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useStaffProfile } from "@/hooks/use-staff";
import { api } from "@/lib/api";
import { position, toInputDate } from "@/lib/format";

const schema = z.object({
  fullName: z.string().trim().min(2, "Nhập họ tên"),
  gender: z.string().min(1, "Chọn giới tính"),
  dob: z.string().min(1, "Chọn ngày sinh"),
  phone: z.string().regex(/^(0|\+84)[35789][0-9]{8}$/, "Số điện thoại không hợp lệ"),
  address: z.string().trim(),
});
type Values = z.infer<typeof schema>;

export default function StaffProfilePage() {
  const { data, isLoading, error } = useStaffProfile();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { fullName: "", gender: "", dob: "", phone: "", address: "" } });
  const { errors, isDirty } = form.formState;

  useEffect(() => {
    if (data) form.reset({ fullName: data.fullName, gender: data.gender ?? "", dob: data.dob ?? "", phone: data.phone, address: data.address ?? "" });
  }, [data, form]);

  // The backend overwrites every field, so email and CCCD are sent back unchanged.
  const save = useApiMutation(
    (v: Values) => api("/api/staff/staff/update-profile", { method: "PATCH", body: { ...v, address: v.address || null, email: data?.email, cccd: data?.cccd } }),
    { success: "Đã lưu hồ sơ", invalidate: [["staff", "profile"]] },
  );

  return (
    <>
      <PageHeader title="Hồ sơ" description={data ? `${position[data.position]} · ${data.email}` : undefined} />
      {error && <ErrorState error={error} />}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="size-4 text-primary" /> Thông tin cá nhân</CardTitle>
            <CardDescription>Email và CCCD do quản trị viên quản lý.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <TableSkeleton rows={4} /> : (
              <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4">
                <Field label="Họ và tên" error={errors.fullName?.message}><Input {...form.register("fullName")} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Giới tính" error={errors.gender?.message}>
                    <NativeSelect placeholder="Chọn" options={[{ value: "Nam", label: "Nam" }, { value: "Nữ", label: "Nữ" }]} {...form.register("gender")} />
                  </Field>
                  <Field label="Ngày sinh" error={errors.dob?.message}><Input type="date" max={toInputDate(new Date())} {...form.register("dob")} /></Field>
                </div>
                <Field label="Điện thoại" error={errors.phone?.message}><Input type="tel" {...form.register("phone")} /></Field>
                <Field label="Địa chỉ"><Input {...form.register("address")} /></Field>
                <Button type="submit" className="w-fit" disabled={!isDirty || save.isPending}>
                  {save.isPending && <Loader2 className="animate-spin" />} Lưu thay đổi
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <ChangePasswordCard />
      </div>
    </>
  );
}
