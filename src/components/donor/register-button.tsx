"use client";

import { Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/app/link-button";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { isProfileComplete, ticketFor, useDonorProfile, useEligibility, useMyTickets } from "@/hooks/use-donor";
import { api } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { EventStatus } from "@/lib/types";
import { TicketDialog } from "./ticket-dialog";

/** Register / show ticket / disabled, depending on the event and the donor's state. */
export function RegisterButton({
  event,
  className,
  size,
}: {
  event: { eventId: number; status: EventStatus; full: boolean; startDate: string };
  className?: string;
  size?: "default" | "lg" | "sm";
}) {
  const tickets = useMyTickets();
  const profile = useDonorProfile();
  const { nextEligible, isLoading: historyLoading } = useEligibility();
  const ticket = ticketFor(tickets.data, event.eventId);
  const register = useApiMutation(() => api<string>(`/api/donor/registration/regisEvent/${event.eventId}`, { method: "POST" }), {
    invalidate: [["donor"], ["public-events"], ["event", String(event.eventId)]],
    onSuccess: () => toast.success("Đăng ký thành công. Vé QR đã được gửi tới email của bạn."),
  });

  if (tickets.isLoading || profile.isLoading || historyLoading) return <Button size={size} className={className} disabled><Loader2 className="animate-spin" /></Button>;

  if (ticket)
    return (
      <TicketDialog
        ticket={ticket}
        trigger={(open) => <Button size={size} variant="outline" className={className} onClick={open}><Ticket /> Xem vé của tôi</Button>}
      />
    );

  if (event.status !== "SAP_TOI" && event.status !== "DANG_MO")
    return <Button size={size} variant="outline" className={className} disabled>Đã kết thúc</Button>;
  if (event.full) return <Button size={size} variant="outline" className={className} disabled>Đã đủ người</Button>;
  // Same 84-day rule the backend enforces; checked here so the donor sees why before clicking.
  if (nextEligible && new Date(event.startDate) < nextEligible)
    return <Button size={size} variant="outline" className={className} disabled>Có thể hiến lại từ {fmtDate(nextEligible.toISOString())}</Button>;
  if (!isProfileComplete(profile.data))
    return <LinkButton size={size} variant="outline" className={className} href="/donor/profile">Cập nhật hồ sơ để đăng ký</LinkButton>;

  return (
    <Button size={size} className={className} onClick={() => register.mutate(undefined)} disabled={register.isPending}>
      {register.isPending && <Loader2 className="animate-spin" />} Đăng ký hiến máu
    </Button>
  );
}
