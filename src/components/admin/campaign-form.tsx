"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/field";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import { toApiDateTime, toInputDateTime } from "@/lib/format";
import type { EventSummary } from "@/lib/types";

const schema = z
  .object({
    eventName: z.string().trim().min(3, "Nhập tên chiến dịch"),
    location: z.string().trim().min(5, "Nhập địa điểm"),
    startDate: z.string().min(1, "Chọn thời gian bắt đầu"),
    endDate: z.string().min(1, "Chọn thời gian kết thúc"),
    targetAmount: z.coerce.number<number>().int().min(10, "Ít nhất 10 người"),
  })
  .refine((v) => new Date(v.endDate) > new Date(v.startDate), { path: ["endDate"], message: "Phải sau thời gian bắt đầu" });
type Values = z.infer<typeof schema>;

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  d.setHours(8, 0, 0, 0);
  return d;
}

/** Create a campaign, or edit one that hasn't started yet. */
export function CampaignForm({
  event,
  trigger,
}: {
  event?: EventSummary;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const start = defaultStart();
  const end = new Date(start);
  end.setHours(17);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: event
      ? {
          eventName: event.eventName,
          location: event.location,
          startDate: toInputDateTime(event.startDate),
          endDate: toInputDateTime(event.endDate),
          targetAmount: event.targetAmount,
        }
      : { eventName: "", location: "", startDate: toInputDateTime(start.toISOString()), endDate: toInputDateTime(end.toISOString()), targetAmount: 100 },
  });
  const { errors } = form.formState;

  const save = useApiMutation(
    (v: Values) =>
      event
        ? // UpdateEventRequest uses ISO date-times; CreateEventRequest uses "dd-MM-yyyy HH:mm"
          api(`/api/admin/event/update-event/${event.eventId}`, {
            method: "PUT",
            body: { eventName: v.eventName, location: v.location, startDate: `${v.startDate}:00`, endDate: `${v.endDate}:00` },
          })
        : api("/api/admin/event/create-event", {
            method: "POST",
            body: { ...v, startDate: toApiDateTime(v.startDate), endDate: toApiDateTime(v.endDate) },
          }),
    {
      success: event ? "Đã cập nhật chiến dịch" : "Đã tạo chiến dịch",
      invalidate: [["admin"], ["events"], ["event"]],
      onSuccess: () => {
        setOpen(false);
        if (!event) form.reset();
      },
    },
  );

  return (
    <>
      {trigger(() => setOpen(true))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{event ? "Sửa chiến dịch" : "Tạo chiến dịch hiến máu"}</DialogTitle>
            <DialogDescription>
              {event ? "Chỉ sửa được khi chiến dịch chưa bắt đầu." : "Nên tạo trước ít nhất 3 ngày để kịp truyền thông. Một địa điểm không thể có hai chiến dịch trùng giờ."}
            </DialogDescription>
          </DialogHeader>
          <form id="campaign-form" onSubmit={form.handleSubmit((v) => save.mutate(v))} className="grid gap-4">
            <Field label="Tên chiến dịch" error={errors.eventName?.message}>
              <Input placeholder="Hiến máu nhân đạo…" {...form.register("eventName")} />
            </Field>
            <Field label="Địa điểm" error={errors.location?.message}>
              <Input placeholder="Số nhà, đường, quận, thành phố" {...form.register("location")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bắt đầu" error={errors.startDate?.message}>
                <Input type="datetime-local" {...form.register("startDate")} />
              </Field>
              <Field label="Kết thúc" error={errors.endDate?.message}>
                <Input type="datetime-local" {...form.register("endDate")} />
              </Field>
            </div>
            {!event && (
              <Field label="Chỉ tiêu (người)" error={errors.targetAmount?.message}>
                <Input type="number" min={10} {...form.register("targetAmount")} />
              </Field>
            )}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" form="campaign-form" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />} {event ? "Lưu thay đổi" : "Tạo chiến dịch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
