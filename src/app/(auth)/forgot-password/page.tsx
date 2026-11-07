"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/field";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/auth/generate-otp", { method: "POST", text: email.trim(), auth: false });
      toast.success("Đã gửi mã xác nhận tới email của bạn");
      setStep("otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không gửi được mã");
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Mật khẩu mới cần ít nhất 6 ký tự");
    setBusy(true);
    try {
      await api("/auth/verify-otp-and-change-password", {
        method: "POST",
        body: { email: email.trim(), otp: otp.trim(), newPassword: password },
        auth: false,
      });
      toast.success("Đổi mật khẩu thành công. Hãy đăng nhập lại.");
      router.replace("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mã không hợp lệ");
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Quay lại đăng nhập
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Quên mật khẩu</h1>

      {step === "email" ? (
        <form onSubmit={sendOtp} className="mt-6 grid gap-4">
          <p className="text-sm text-muted-foreground">Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác nhận có hiệu lực 5 phút.</p>
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" />
          </Field>
          <Button type="submit" size="lg" className="h-10" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Gửi mã xác nhận
          </Button>
        </form>
      ) : (
        <form onSubmit={reset} className="mt-6 grid gap-4">
          <p className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            <MailCheck className="mt-0.5 size-4 shrink-0" /> Mã đã được gửi tới {email}. Mỗi lần gửi lại cách nhau ít nhất 60 giây.
          </p>
          <Field label="Mã xác nhận">
            <Input inputMode="numeric" required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6 chữ số" />
          </Field>
          <Field label="Mật khẩu mới" hint="Ít nhất 6 ký tự">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" className="h-10" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Đổi mật khẩu
          </Button>
          <Button type="button" variant="ghost" onClick={() => setStep("email")}>Gửi lại mã</Button>
        </form>
      )}
    </>
  );
}
