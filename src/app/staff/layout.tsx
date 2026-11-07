"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarHeart, ClipboardList, FlaskConical, LayoutDashboard, Thermometer, Undo2, UserCog, Warehouse,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/app/app-shell";
import { useSession } from "@/hooks/use-session";
import { useStomp } from "@/hooks/use-stomp";

// Technical staff run donation days and the lab; inventory staff run storage and distribution.
const techNav: NavItem[] = [
  { href: "/staff", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/staff/events", label: "Ngày hiến máu", icon: CalendarHeart },
  { href: "/staff/lab", label: "Xét nghiệm & chế phẩm", icon: FlaskConical },
  { href: "/staff/equipment", label: "Thiết bị", icon: Thermometer },
  { href: "/staff/profile", label: "Hồ sơ", icon: UserCog },
];

const inventoryNav: NavItem[] = [
  { href: "/staff", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/staff/storage", label: "Nhập kho & bảo quản", icon: Warehouse },
  { href: "/staff/requests", label: "Yêu cầu máu", icon: ClipboardList },
  { href: "/staff/returns", label: "Hoàn trả", icon: Undo2 },
  { href: "/staff/equipment", label: "Thiết bị", icon: Thermometer },
  { href: "/staff/profile", label: "Hồ sơ", icon: UserCog },
];

type RequestNoti = { title?: string; message?: string; priority?: string };

/** Inventory staff hear about new, edited and cancelled hospital requests as they happen. */
function RequestAlerts() {
  const qc = useQueryClient();
  useStomp(["/topic/blood-requests"], (_topic, body) => {
    const n = (body ?? {}) as RequestNoti;
    const show = n.priority === "KHAN_CAP" ? toast.error : toast.info;
    show(n.title ?? "Yêu cầu máu", { description: n.message, duration: 10000 });
    qc.invalidateQueries({ queryKey: ["staff"] });
  });
  return null;
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const inventory = session?.role === "STAFF_INVENTORY";
  return (
    <AppShell roles={["STAFF_TECH", "STAFF_INVENTORY"]} nav={inventory ? inventoryNav : techNav}>
      {inventory && <RequestAlerts />}
      {children}
    </AppShell>
  );
}

