"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChangePasswordCard } from "@/components/app/change-password-card";
import { Field } from "@/components/app/field";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState, TableSkeleton } from "@/components/app/states";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import type { HospitalProfile } from "@/lib/types";

const schema = z.object({
  hospitalName: z.string().trim().min(3, "Nhập tên bệnh viện"),
  hotline: z.string().regex(/^[0-9+ ]{8,15}$/, "Số hotline không hợp lệ"),
  address: z.string().trim().min(5, "Nhập địa chỉ"),
});
type Values = z.infer<typeof schema>;

export default function HospitalProfilePage() {
  const session = useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ["hospital", "profile", session?.email],
    queryFn: () => api<HospitalProfile>("/api/shared/user/get-profile"),
    enabled: !!session,
  });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { hospitalName: "", hotline: "", address: "" } });
  const { errors, isDirty } = form.formState;

  useEffect(() => {
    if (data) form.reset({ hospitalName: data.hospitalName, hotline: data.hotline, address: data.address });
  }, [data, form]);

  const save = useApiMutation((v: Values) => api("/api/hospital/update-hospital", { method: "PUT", body: v }), {
    success: "Đã lưu thông tin bệnh viện",
    invalidate: [["hospital", "profile"]],
  });

  return (
    <>
      <PageHeader title="Thông tin bệnh viện" description="Kho máu dùng thông tin này để liên hệ và giao máu." />
      {error && <ErrorState error={error} />}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="size-4 text-primary" /> Hồ sơ</CardTitle>
            <CardDescription>Email đăng nhập: {data?.email ?? "…"}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={3} />
            ) : (
              <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4">
                <Field label="Tên bệnh viện" error={errors.hospitalName?.message}><Input {...form.register("hospitalName")} /></Field>
                <Field label="Hotline" error={errors.hotline?.message}><Input type="tel" {...form.register("hotline")} /></Field>
                <Field label="Địa chỉ nhận máu" error={errors.address?.message}><Input {...form.register("address")} /></Field>
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
