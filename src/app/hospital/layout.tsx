"use client";

import { ClipboardList, LayoutDashboard, PlusCircle, UserCog } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app/app-shell";

const nav: NavItem[] = [
  { href: "/hospital", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/hospital/requests/new", label: "Gửi yêu cầu máu", icon: PlusCircle, exact: true },
  { href: "/hospital/requests", label: "Yêu cầu của tôi", icon: ClipboardList },
  { href: "/hospital/profile", label: "Thông tin bệnh viện", icon: UserCog },
];

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell roles={["HOSPITAL"]} nav={nav}>
      {children}
    </AppShell>
  );
}
