import { Droplet, HeartPulse, ShieldCheck, Warehouse } from "lucide-react";
import { Logo } from "@/components/app/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-black/10 blur-2xl" />
        <Droplet className="size-10 fill-current opacity-90" />
        <div className="relative">
          <p className="text-3xl font-semibold leading-snug">
            “Một lần hiến máu có thể giúp tới ba người bệnh nhờ tách thành hồng cầu, huyết tương và tiểu cầu.”
          </p>
          <ul className="mt-10 grid gap-4 text-sm text-primary-foreground/90">
            <li className="flex items-center gap-3"><HeartPulse className="size-5" /> Theo dõi từng túi máu từ lúc lấy đến khi giao cho bệnh viện</li>
            <li className="flex items-center gap-3"><ShieldCheck className="size-5" /> Phân quyền theo vai trò, đăng nhập bằng JWT</li>
            <li className="flex items-center gap-3"><Warehouse className="size-5" /> Cảnh báo túi máu sắp hết hạn trong kho</li>
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/70">BloodBank VN · Dự án cá nhân</p>
      </div>
    </div>
  );
}
