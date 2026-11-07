"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/field";
import { LinkButton } from "@/components/app/link-button";
import { api } from "@/lib/api";

// Same rules as RegisterRequest on the backend
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nhập họ tên")
    .regex(/^[^0-9!-/:-@[-`{-~]+$/, "Họ tên không được chứa chữ số hoặc ký tự đặc biệt"),
  email: z.email("Email không hợp lệ"),
  cccd: z.string().regex(/^[0-9]{12}$/, "CCCD gồm đúng 12 chữ số"),
  phone: z.string().regex(/^(0|\+84)[35789][0-9]{8}$/, "Số điện thoại không hợp lệ"),
});
type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  const [done, setDone] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", cccd: "", phone: "" } });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: Values) {
    try {
      await api("/auth/sign-up", { method: "POST", body: values, auth: false });
      setDone(values.email);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đăng ký thất bại");
    }
  }

  if (done)
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Đăng ký thành công</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mật khẩu tạm thời đã được gửi tới <span className="font-medium text-foreground">{done}</span>. Hãy đăng nhập và đổi
          mật khẩu, sau đó cập nhật hồ sơ để đăng ký hiến máu.
        </p>
        <LinkButton href="/login" size="lg" className="mt-6 h-10 w-full">Đăng nhập</LinkButton>
      </div>
    );

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Đăng ký người hiến máu</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tạo tài khoản để đăng ký sự kiện và theo dõi kết quả xét nghiệm.</p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 grid gap-4">
        <Field label="Họ và tên" error={errors.name?.message}>
          <Input autoComplete="name" placeholder="Nguyễn Văn A" {...form.register("name")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="ban@email.com" {...form.register("email")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Số CCCD" error={errors.cccd?.message}>
            <Input inputMode="numeric" maxLength={12} placeholder="12 chữ số" {...form.register("cccd")} />
          </Field>
          <Field label="Số điện thoại" error={errors.phone?.message}>
            <Input type="tel" autoComplete="tel" placeholder="09xxxxxxxx" {...form.register("phone")} />
          </Field>
        </div>
        <Button type="submit" size="lg" className="h-10" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />} Tạo tài khoản
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản? <Link href="/login" className="font-medium text-primary hover:underline">Đăng nhập</Link>
      </p>
    </>
  );
}
