import { Activity, Building2, CheckCircle2, ClipboardCheck, Droplet, HeartHandshake, Hospital, ShieldCheck, Stethoscope, Syringe, UserRound, Warehouse } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/app/link-button";
import { Logo } from "@/components/app/logo";
import { SiteHeader } from "@/components/landing/site-header";
import { UpcomingEvents } from "@/components/landing/upcoming-events";

const steps = [
  { icon: ClipboardCheck, title: "Đăng ký", text: "Chọn một chiến dịch gần bạn và nhận vé điện tử có mã QR." },
  { icon: Stethoscope, title: "Khám sàng lọc", text: "Bác sĩ kiểm tra cân nặng, huyết áp, huyết sắc tố trước khi hiến." },
  { icon: Syringe, title: "Hiến máu", text: "Khoảng 10 phút để lấy 250–450 ml máu, an toàn và vô trùng." },
  { icon: Activity, title: "Nhận kết quả", text: "Kết quả xét nghiệm được gửi qua email và lưu trong hồ sơ của bạn." },
];

const portals = [
  { icon: UserRound, title: "Người hiến máu", text: "Đăng ký sự kiện, vé QR, lịch sử hiến máu và kết quả xét nghiệm." },
  { icon: Stethoscope, title: "Nhân viên y tế", text: "Tiếp đón bằng QR, khám sàng lọc, lấy máu và nhập kết quả xét nghiệm." },
  { icon: Warehouse, title: "Nhân viên kho", text: "Tách chế phẩm, in nhãn, nhập kho theo tủ và xuất máu cho bệnh viện." },
  { icon: Hospital, title: "Bệnh viện", text: "Gửi yêu cầu máu thường hoặc khẩn cấp và theo dõi đến khi nhận hàng." },
];

const rules = [
  "Từ 18 đến 60 tuổi, cân nặng từ 45 kg (nữ) hoặc 50 kg (nam)",
  "Không mắc bệnh truyền nhiễm qua đường máu (HIV, viêm gan B, C, giang mai…)",
  "Hai lần hiến máu toàn phần cách nhau tối thiểu 84 ngày",
  "Huyết áp và huyết sắc tố trong ngưỡng an toàn khi khám sàng lọc",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_80%_-10%,oklch(0.94_0.05_17),transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <HeartHandshake className="size-3.5" /> Mỗi giọt máu cho đi, một cuộc đời ở lại
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Kết nối người hiến máu với <span className="text-primary">những người đang cần</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Một hệ thống cho cả chuỗi hiến máu: từ đăng ký, khám sàng lọc, xét nghiệm, bảo quản trong kho đến khi túi máu
              được giao tới bệnh viện.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/register" size="lg" className="h-11 px-5">Đăng ký hiến máu</LinkButton>
              <LinkButton href="#events" size="lg" variant="outline" className="h-11 px-5">Xem sự kiện sắp tới</LinkButton>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-600" /> Xét nghiệm 5 bệnh truyền nhiễm</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" /> Vé QR, không cần giấy tờ</span>
            </div>
          </div>

          <div className="relative">
            <Card className="relative p-6 shadow-xl shadow-primary/5">
              <div className="flex items-center justify-between">
                <p className="font-medium">Tồn kho theo nhóm máu</p>
                <span className="text-xs text-muted-foreground">Ảnh minh họa</span>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-3">
                {[["A+", 82], ["B+", 64], ["O+", 91], ["AB+", 38], ["A-", 22], ["B-", 15], ["O-", 30], ["AB-", 9]].map(([g, v]) => (
                  <div key={g} className="rounded-lg border p-3 text-center">
                    <p className="font-mono text-lg font-semibold text-primary">{g}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-5 text-center">
                <div><p className="text-2xl font-semibold">4</p><p className="text-xs text-muted-foreground">loại chế phẩm</p></div>
                <div><p className="text-2xl font-semibold">5</p><p className="text-xs text-muted-foreground">vai trò người dùng</p></div>
                <div><p className="text-2xl font-semibold">24/7</p><p className="text-xs text-muted-foreground">cảnh báo hết hạn</p></div>
              </div>
            </Card>
            <Card className="absolute -bottom-6 -left-4 hidden flex-row items-center gap-3 p-3 shadow-lg sm:flex">
              <span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Droplet className="size-4" /></span>
              <div>
                <p className="text-sm font-medium">Túi máu BG-1024 đã sẵn sàng</p>
                <p className="text-xs text-muted-foreground">Hồng cầu · O+ · Tủ B1</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section id="events" className="scroll-mt-20 border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">Sự kiện</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight">Chiến dịch hiến máu sắp tới</h2>
            </div>
            <LinkButton href="/register" variant="outline">Tạo tài khoản để đăng ký</LinkButton>
          </div>
          <UpcomingEvents />
        </div>
      </section>

      <section id="process" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-sm font-semibold text-primary">Quy trình</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">Hiến máu chỉ trong 4 bước</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
                    <s.icon className="size-5" />
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="portals" className="scroll-mt-20 border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-sm font-semibold text-primary">Dành cho</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">Một hệ thống, năm cổng làm việc</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Mỗi vai trò có giao diện riêng và chỉ thấy đúng phần việc của mình. Quản trị viên điều phối chiến dịch, nhân sự, bệnh
            viện và theo dõi toàn bộ hệ thống.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {portals.map((p) => (
              <Card key={p.title} className="p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="eligibility" className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-primary">Điều kiện</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Ai có thể hiến máu?</h2>
            <p className="mt-3 text-muted-foreground">
              Hệ thống tự kiểm tra tuổi và khoảng cách giữa hai lần hiến khi bạn đăng ký. Các chỉ số sức khỏe được bác sĩ đánh
              giá tại buổi khám sàng lọc.
            </p>
          </div>
          <ul className="grid gap-3">
            {rules.map((r) => (
              <li key={r} className="flex items-start gap-3 rounded-lg border p-4">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <span className="text-sm">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
          <Logo />
          <p className="flex items-center gap-2"><Building2 className="size-4" /> Dự án cá nhân · Spring Boot + Next.js</p>
        </div>
      </footer>
    </div>
  );
}
