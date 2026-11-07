"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/app/logo";
import { useSession, notifySessionChange } from "@/hooks/use-session";
import { clearSession, homeFor } from "@/lib/auth";
import { roleLabel } from "@/lib/format";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Portal layout: role guard, sidebar, top bar. */
export function AppShell({ roles, nav, children }: { roles: Role[]; nav: NavItem[]; children: React.ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (session === null) router.replace("/login");
    else if (session && !roles.includes(session.role)) router.replace(homeFor[session.role]);
  }, [session, roles, router]);

  function logout() {
    clearSession();
    notifySessionChange();
    router.replace("/login");
  }

  if (!session || !roles.includes(session.role)) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  const initials = session.email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r bg-sidebar p-4 lg:flex">
        <div className="px-2 py-1">
          <Logo href={homeFor[session.role]} />
        </div>
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavLinks items={nav} />
        </div>
        <div className="mt-4 rounded-lg border bg-background p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{session.email}</p>
              <p className="text-xs text-muted-foreground">{roleLabel[session.role]}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={logout}>
            <LogOut /> Đăng xuất
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Mở menu" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo href={homeFor[session.role]} />
              <div className="mt-6">
                <NavLinks items={nav} onNavigate={() => setOpen(false)} />
              </div>
              <Button variant="outline" size="sm" className="mt-6 w-full" onClick={logout}>
                <LogOut /> Đăng xuất
              </Button>
            </SheetContent>
          </Sheet>
          <Logo href={homeFor[session.role]} />
          <span className="w-8" />
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
