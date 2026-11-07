"use client";

import { Building2, CalendarHeart, Droplets, LayoutDashboard, ScrollText, Thermometer, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell, type NavItem } from "@/components/app/app-shell";
import { useStomp } from "@/hooks/use-stomp";

const nav: NavItem[] = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/campaigns", label: "Chiến dịch", icon: CalendarHeart },
  { href: "/admin/inventory", label: "Kho máu", icon: Droplets },
  { href: "/admin/staff", label: "Nhân sự", icon: Users },
  { href: "/admin/hospitals", label: "Bệnh viện", icon: Building2 },
  { href: "/admin/donors", label: "Người hiến máu", icon: UserRound },
  { href: "/admin/equipment", label: "Thiết bị bảo quản", icon: Thermometer },
  { href: "/admin/logs", label: "Nhật ký thao tác", icon: ScrollText },
];

/** Equipment incidents reported by staff reach the admin as they happen. */
function AdminAlerts() {
  useStomp(["/topic/admin/alerts"], (_t, body) => {
    const n = (body ?? {}) as { title?: string; message?: string };
    toast.warning(n.title ?? "Cảnh báo", { description: n.message, duration: 15000 });
  });
  return null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell roles={["ADMIN"]} nav={nav}>
      <AdminAlerts />
      {children}
    </AppShell>
  );
}
