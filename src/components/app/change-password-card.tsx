"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/field";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";

// Mirrors ChangePasswordRequest on the backend: letters and digits, at least 6 characters.
const schema = z
  .object({
    oldPassword: z.string().min(1, "Nhập mật khẩu hiện tại"),
    newPassword: z.string().regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, "Ít nhất 6 ký tự, gồm cả chữ và số"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { path: ["confirmPassword"], message: "Mật khẩu nhập lại không khớp" })
  .refine((v) => v.newPassword !== v.oldPassword, { path: ["newPassword"], message: "Mật khẩu mới phải khác mật khẩu cũ" });
type Values = z.infer<typeof schema>;

export function ChangePasswordCard() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" } });
  const { errors } = form.formState;
  const save = useApiMutation((v: Values) => api("/api/shared/user/change-password", { method: "PUT", body: v }), {
    success: "Đã đổi mật khẩu",
    onSuccess: () => form.reset(),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRound className="size-4 text-primary" /> Đổi mật khẩu</CardTitle>
        <CardDescription>Tài khoản tạo sẵn dùng mật khẩu mặc định, bạn nên đổi ngay.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4">
          <Field label="Mật khẩu hiện tại" error={errors.oldPassword?.message}>
            <Input type="password" autoComplete="current-password" {...form.register("oldPassword")} />
          </Field>
          <Field label="Mật khẩu mới" error={errors.newPassword?.message}>
            <Input type="password" autoComplete="new-password" {...form.register("newPassword")} />
          </Field>
          <Field label="Nhập lại mật khẩu mới" error={errors.confirmPassword?.message}>
            <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
          </Field>
          <Button type="submit" variant="outline" className="w-fit" disabled={save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />} Đổi mật khẩu
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
