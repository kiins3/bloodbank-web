"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { isProfileComplete, useDonorProfile } from "@/hooks/use-donor";
import { api } from "@/lib/api";
import { BLOOD_TYPES, toApiDate, toInputDate } from "@/lib/format";

const schema = z.object({
  fullName: z.string().trim().min(2, "Nhập họ tên").regex(/^[^0-9!-/:-@[-`{-~]+$/, "Họ tên không chứa số hoặc ký tự đặc biệt"),
  gender: z.string().min(1, "Chọn giới tính"),
  dob: z
    .string()
    .min(1, "Chọn ngày sinh")
    .refine((v) => v < toInputDate(new Date()), "Ngày sinh phải trước hôm nay"),
  address: z.string().trim().min(5, "Nhập địa chỉ"),
  bloodType: z.string(),
  rhFactor: z.string(),
});
type Values = z.infer<typeof schema>;

const empty: Values = { fullName: "", gender: "", dob: "", address: "", bloodType: "", rhFactor: "" };

export default function DonorProfilePage() {
  const { data, isLoading, error } = useDonorProfile();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  const { errors, isDirty } = form.formState;
  const bloodType = useWatch({ control: form.control, name: "bloodType" });

  useEffect(() => {
    if (data)
      form.reset({
        fullName: data.fullName ?? "",
        gender: data.gender ?? "",
        dob: data.dob ?? "",
        address: data.address ?? "",
        bloodType: data.bloodType ?? "",
        rhFactor: data.rhFactor ?? "",
      });
  }, [data, form]);

  const save = useApiMutation(
    (v: Values) =>
      api("/api/donor/update-donor", {
        method: "PUT",
        body: {
          fullName: v.fullName,
          gender: v.gender,
          dob: toApiDate(v.dob),
          address: v.address,
          // Unknown blood group stays unset (the backend skips null fields).
          bloodType: v.bloodType || undefined,
          rhFactor: v.bloodType ? v.rhFactor || undefined : undefined,
        },
      }),
    { success: "Đã lưu hồ sơ", invalidate: [["donor"]] },
  );

  return (
    <>
      <PageHeader title="Hồ sơ cá nhân" description="Thông tin này được dùng khi bạn đăng ký và tới hiến máu." />
      {error && <ErrorState error={error} />}
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="size-4 text-primary" /> Thông tin cá nhân</CardTitle>
            <CardDescription>
              {data && !isProfileComplete(data) ? "Bổ sung ngày sinh, giới tính và địa chỉ để đăng ký hiến máu." : "Email, CCCD và số điện thoại không đổi được trực tuyến."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={4} />
            ) : (
              <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4">
                <div className="grid gap-4 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-3">
                  <div><p className="text-xs text-muted-foreground">Email</p><p className="truncate font-medium">{data?.email}</p></div>
                  <div><p className="text-xs text-muted-foreground">CCCD</p><p className="font-medium tabular-nums">{data?.cccd}</p></div>
                  <div><p className="text-xs text-muted-foreground">Điện thoại</p><p className="font-medium tabular-nums">{data?.phone}</p></div>
                </div>
                <Field label="Họ và tên" error={errors.fullName?.message}><Input {...form.register("fullName")} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Giới tính" error={errors.gender?.message}>
                    <NativeSelect placeholder="Chọn" options={[{ value: "Nam", label: "Nam" }, { value: "Nữ", label: "Nữ" }]} {...form.register("gender")} />
                  </Field>
                  <Field label="Ngày sinh" error={errors.dob?.message}>
                    <Input type="date" max={toInputDate(new Date())} {...form.register("dob")} />
                  </Field>
                </div>
                <Field label="Địa chỉ" error={errors.address?.message}><Input {...form.register("address")} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nhóm máu" hint="Để trống nếu chưa biết; sẽ cập nhật sau xét nghiệm.">
                    <NativeSelect placeholder="Chưa biết" options={BLOOD_TYPES.map((t) => ({ value: t, label: t }))} {...form.register("bloodType")} />
                  </Field>
                  <Field label="Yếu tố Rh">
                    <NativeSelect
                      placeholder="Chưa biết"
                      options={[{ value: "+", label: "Rh+ (dương)" }, { value: "-", label: "Rh− (âm)" }]}
                      disabled={!bloodType}
                      {...form.register("rhFactor")}
                    />
                  </Field>
                </div>
                <Button type="submit" className="w-fit" disabled={!isDirty || save.isPending}>
                  {save.isPending && <Loader2 className="animate-spin" />} Lưu hồ sơ
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
