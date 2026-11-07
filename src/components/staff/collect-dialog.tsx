"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Droplet, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/field";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import type { EventDonor } from "@/lib/types";

/** Records the collection result; the backend rounds the volume to a standard bag size. */
export function CollectDialog({ donor, trigger }: { donor: EventDonor; trigger: (open: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState("350");

  const save = useApiMutation(
    (success: boolean) =>
      api<string>(`/api/staff/registration/donate-blood/${donor.regisId}`, {
        method: "POST",
        body: { actualVolume: Number(volume), isSuccess: success },
      }),
    {
      invalidate: [["staff", "event-donors"], ["staff", "bags"], ["staff", "stats"]],
      onSuccess: (msg, success) => {
        setOpen(false);
        (success ? toast.success : toast.info)(typeof msg === "string" ? `${msg}: ${donor.fullName}` : "Đã ghi nhận");
      },
    },
  );

  return (
    <>
      {trigger(() => setOpen(true))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Droplet className="size-4 text-primary" /> Lấy máu</DialogTitle>
            <DialogDescription>{donor.fullName} · vé {donor.ticketCode}</DialogDescription>
          </DialogHeader>
          <Field label="Lượng máu thực tế (ml)" hint="Túi được làm tròn về 250/350/450 ml theo thể tích chỉ định khi khám.">
            <Input type="number" min={0} step={10} autoFocus value={volume} onChange={(e) => setVolume(e.target.value)} />
          </Field>
          <DialogFooter>
            <Button variant="outline" disabled={save.isPending} onClick={() => save.mutate(false)}>
              <XCircle /> Thất bại
            </Button>
            <Button disabled={save.isPending || !Number(volume)} onClick={() => save.mutate(true)}>
              {save.isPending ? <Loader2 className="animate-spin" /> : <Droplet />} Hoàn tất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
