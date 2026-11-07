"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/app/native-select";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { api } from "@/lib/api";
import { assignmentRole, position } from "@/lib/format";
import type { AssignmentRole, SmartStaff } from "@/lib/types";

const roleOptions = (Object.keys(assignmentRole) as AssignmentRole[]).map((r) => ({ value: r, label: assignmentRole[r] }));

/** Pick staff for a campaign. Sending the list replaces the current assignment. */
export function AssignStaffDialog({
  eventId,
  assignedIds,
  trigger,
}: {
  eventId: number;
  assignedIds: number[];
  trigger: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Record<number, AssignmentRole>>({});
  const staff = useQuery({
    queryKey: ["smart-staff"],
    queryFn: () => api<SmartStaff[]>("/api/admin/staff/get-smart-list-staff"),
    enabled: open,
  });

  const save = useApiMutation(
    () =>
      api(`/api/admin/assignment/assignment-staff/${eventId}`, {
        method: "POST",
        body: { eventId, assignments: Object.entries(picked).map(([staffId, role]) => ({ staffId: Number(staffId), role })) },
      }),
    { success: "Đã cập nhật phân công", invalidate: [["assignment", eventId], ["smart-staff"]], onSuccess: () => setOpen(false) },
  );

  function openDialog() {
    // Pre-select the people already assigned; role defaults by position.
    setPicked(Object.fromEntries(assignedIds.map((id) => [id, "TIEP_DON" as AssignmentRole])));
    setOpen(true);
  }

  const defaultRole = (s: SmartStaff): AssignmentRole => (s.position === "BAC_SI" ? "KHAM_SANG_LOC" : s.position === "Y_TA" ? "LAY_MAU" : "TIEP_DON");
  const invalid = (staff.data ?? []).some((s) => picked[s.staffId] === "KHAM_SANG_LOC" && s.position !== "BAC_SI");

  return (
    <>
      {trigger(openDialog)}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Phân công nhân sự</DialogTitle>
            <DialogDescription>Chọn nhân viên và vai trò tại chiến dịch. Chỉ bác sĩ được khám sàng lọc.</DialogDescription>
          </DialogHeader>
          <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4">
            {staff.isLoading && <p className="py-6 text-center text-sm text-muted-foreground">Đang tải…</p>}
            <div className="grid gap-2">
              {staff.data
                ?.filter((s) => s.position !== "QUAN_LY_KHO" && s.position !== "ADMIN")
                .map((s) => {
                  const checked = s.staffId in picked;
                  return (
                    <div key={s.staffId} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--primary)]"
                        checked={checked}
                        onChange={(e) =>
                          setPicked((p) => {
                            const next = { ...p };
                            if (e.target.checked) next[s.staffId] = defaultRole(s);
                            else delete next[s.staffId];
                            return next;
                          })
                        }
                        aria-label={`Chọn ${s.fullName}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{s.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {position[s.position]} · {s.available ? "Đang rảnh" : "Đã có lịch"}
                        </p>
                      </div>
                      {checked && (
                        <NativeSelect
                          className="w-40"
                          options={roleOptions}
                          value={picked[s.staffId]}
                          onChange={(e) => setPicked((p) => ({ ...p, [s.staffId]: e.target.value as AssignmentRole }))}
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
          {invalid && <p className="text-sm text-destructive">Chỉ nhân viên có chuyên môn Bác sĩ mới được khám sàng lọc.</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button disabled={save.isPending || invalid} onClick={() => save.mutate()}>
              {save.isPending && <Loader2 className="animate-spin" />} Lưu phân công ({Object.keys(picked).length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
