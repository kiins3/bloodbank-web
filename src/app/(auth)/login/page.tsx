"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/field";
import { notifySessionChange } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { homeFor, saveToken } from "@/lib/auth";
import { roleLabel } from "@/lib/format";
import type { Role } from "@/lib/types";

const schema = z.object({
  email: z.email("Email không hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
});
type Values = z.infer<typeof schema>;

const demoAccounts: { email: string; password: string; role: Role }[] = [
  { email: "admin@bloodbank.local", password: "Admin@123", role: "ADMIN" },
  { email: "donor@bloodbank.local", password: "123456", role: "DONOR" },
  { email: "hospital@bloodbank.local", password: "123456", role: "HOSPITAL" },
  { email: "doctor@bloodbank.local", password: "123456", role: "STAFF_TECH" },
  { email: "inventory@bloodbank.local", password: "123456", role: "STAFF_INVENTORY" },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      const res = await api<{ accessToken: string }>("/auth/login", { method: "POST", body: values, auth: false });
      const session = saveToken(res.accessToken);
      notifySessionChange();
      if (!session) throw new Error("Phiên đăng nhập không hợp lệ");
      const next = params.get("next");
      const allowed = next && next.startsWith("/") && !next.startsWith("//") && next.startsWith(homeFor[session.role]);
      router.replace(allowed ? next : homeFor[session.role]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đăng nhập thất bại");
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập</h1>
      <p className="mt-1 text-sm text-muted-foreground">Chào mừng trở lại. Đăng nhập để tiếp tục.</p>
      {params.get("expired") && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.</p>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 grid gap-4">
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="ban@email.com" {...form.register("email")} />
        </Field>
        <Field label="Mật khẩu" error={form.formState.errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...form.register("password")} />
        </Field>
        <div className="-mt-1 text-right">
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">Quên mật khẩu?</Link>
        </div>
        <Button type="submit" size="lg" className="h-10" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" />} Đăng nhập
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Chưa có tài khoản? <Link href="/register" className="font-medium text-primary hover:underline">Đăng ký hiến máu</Link>
      </p>

      <div className="mt-8 rounded-xl border bg-muted/40 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tài khoản demo</p>
        <div className="mt-3 grid gap-1.5">
          {demoAccounts.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                form.setValue("email", a.email);
                form.setValue("password", a.password);
              }}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-background"
            >
              <span className="font-medium">{roleLabel[a.role]}</span>
              <span className="truncate pl-3 font-mono text-xs text-muted-foreground">{a.email}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
