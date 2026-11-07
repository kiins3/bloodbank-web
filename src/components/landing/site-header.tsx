"use client";

import { LinkButton } from "@/components/app/link-button";
import { Logo } from "@/components/app/logo";
import { useSession } from "@/hooks/use-session";
import { homeFor } from "@/lib/auth";

export function SiteHeader() {
  const session = useSession();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#events" className="hover:text-foreground">Sự kiện</a>
          <a href="#process" className="hover:text-foreground">Quy trình</a>
          <a href="#portals" className="hover:text-foreground">Dành cho</a>
          <a href="#eligibility" className="hover:text-foreground">Điều kiện</a>
        </nav>
        <div className="flex items-center gap-2">
          {session ? (
            <LinkButton href={homeFor[session.role]}>Vào trang của bạn</LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost">Đăng nhập</LinkButton>
              <LinkButton href="/register" className="hidden sm:inline-flex">Đăng ký hiến máu</LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
