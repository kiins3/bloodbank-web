"use client";

import { CalendarHeart, History, LayoutDashboard, Ticket, UserRound } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app/app-shell";

const nav: NavItem[] = [
  { href: "/donor", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/donor/events", label: "Sự kiện hiến máu", icon: CalendarHeart },
  { href: "/donor/tickets", label: "Vé của tôi", icon: Ticket },
  { href: "/donor/history", label: "Lịch sử hiến máu", icon: History },
  { href: "/donor/profile", label: "Hồ sơ cá nhân", icon: UserRound },
];

export default function DonorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell roles={["DONOR"]} nav={nav}>
      {children}
    </AppShell>
  );
}
