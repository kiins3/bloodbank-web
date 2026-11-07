"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, Ticket as TicketIcon, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { ErrorState } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import { fmtDate, fmtTime, registrationStatus } from "@/lib/format";
import type { Ticket, TicketSummary } from "@/lib/types";
import { toast } from "sonner";

/** QR ticket the reception desk scans at check-in, with the option to cancel. */
export function TicketDialog({
  ticket,
  trigger,
}: {
  ticket: Pick<TicketSummary, "eventId" | "registrationId" | "registrationStatus" | "status">;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["donor", "ticket", ticket.eventId],
    queryFn: () => api<Ticket>(`/api/donor/registration/get-my-ticket/${ticket.eventId}`),
    enabled: open,
  });
  const cancel = useApiMutation(
    () => api<string>(`/api/donor/registration/discard-my-ticket/${ticket.registrationId}`, { method: "PATCH" }),
    {
      invalidate: [["donor"], ["public-events"], ["event", String(ticket.eventId)]],
      // The message may carry a warning about the 3-cancellations-a-month limit.
      onSuccess: (msg) => {
        toast.success(typeof msg === "string" ? msg : "Đã hủy đăng ký", { duration: 8000 });
        setOpen(false);
      },
    },
  );
  const canCancel = ticket.registrationStatus === "DA_DANG_KY" && ticket.status !== "DA_DONG";

  return (
    <>
      {trigger(() => setOpen(true))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><TicketIcon className="size-4 text-primary" /> Vé hiến máu</DialogTitle>
            <DialogDescription>Đưa mã QR này cho quầy tiếp đón khi tới nơi.</DialogDescription>
          </DialogHeader>
          {error && <ErrorState error={error} />}
          {isLoading && <Skeleton className="mx-auto size-56" />}
          {data && (
            <div className="grid gap-4">
              <div className="mx-auto rounded-xl border bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`data:image/png;base64,${data.qrCode}`} alt={`Mã QR vé ${data.ticketCode}`} className="size-52" />
              </div>
              <div className="text-center">
                <p className="font-mono text-lg font-semibold tracking-wider">{data.ticketCode}</p>
                <p className="text-sm text-muted-foreground">{data.donorName}</p>
                <StatusBadge {...registrationStatus[data.status]} className="mt-2" />
              </div>
              <div className="grid gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                <p className="font-medium">{data.eventName}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-4" />{fmtDate(data.startDate)}</p>
                <p className="flex items-center gap-2 text-muted-foreground"><Clock className="size-4" />{fmtTime(data.startDate)} – {fmtTime(data.endDate)}</p>
                <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" />{data.location}</p>
              </div>
              {canCancel && (
                <ConfirmDialog
                  trigger={(o) => <Button variant="ghost" className="text-muted-foreground" onClick={o}><XCircle /> Hủy đăng ký</Button>}
                  title="Hủy đăng ký hiến máu?"
                  description="Hủy quá 3 lần trong 30 ngày sẽ bị tạm khóa đăng ký trực tuyến 30 ngày."
                  confirmLabel="Hủy đăng ký"
                  destructive
                  onConfirm={() => cancel.mutateAsync(undefined)}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
