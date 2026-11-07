"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FlaskConical, Layers, Loader2, Mail, Printer, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { FilterTabs } from "@/components/app/filter-tabs";
import { PageHeader } from "@/components/app/page-header";
import { BagTable, toggleIn } from "@/components/staff/bag-table";
import { LabelDialog } from "@/components/staff/label-dialog";
import { SeparateDialog } from "@/components/staff/separate-dialog";
import { TestDialog } from "@/components/staff/test-dialog";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useBags } from "@/hooks/use-staff";
import { ApiError, api } from "@/lib/api";
import type { PrintedLabel } from "@/lib/types";

type Tab = "test" | "separate" | "label" | "discard" | "inspect";
const TABS: { value: Tab; label: string }[] = [
  { value: "test", label: "Chờ xét nghiệm" },
  { value: "separate", label: "Chờ tách chế phẩm" },
  { value: "label", label: "Chờ in nhãn" },
  { value: "discard", label: "Chờ hủy" },
  { value: "inspect", label: "Chờ kiểm định" },
];

/** Emails the donor their result; asks before sending a second time. */
function SendResultButton({ bagId }: { bagId: number }) {
  const send = useMutation({
    mutationFn: (force: boolean) => api<string>(`/api/staff/bloodbag/send-mail/${bagId}?forceResend=${force}`, { method: "POST" }),
    onSuccess: () => toast.success("Đã gửi kết quả cho người hiến"),
    onError: (e, force) => {
      if (e instanceof ApiError && e.status === 409 && !force) {
        toast(e.message, { action: { label: "Gửi lại", onClick: () => send.mutate(true) }, duration: 10000 });
      } else toast.error(e.message);
    },
  });
  return (
    <Button size="sm" variant="ghost" onClick={() => send.mutate(false)} disabled={send.isPending} aria-label="Gửi kết quả qua email">
      {send.isPending ? <Loader2 className="animate-spin" /> : <Mail />} Gửi KQ
    </Button>
  );
}

function LabContent() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (TABS.find((t) => t.value === params.get("tab"))?.value ?? "test") as Tab;
  const setTab = (t: Tab) => router.replace(`${pathname}?tab=${t}`, { scroll: false });
  const qc = useQueryClient();

  const test = useBags("CHO_XET_NGHIEM", 20000);
  const separate = useBags("CHO_TACH_CHIET");
  const label = useBags("CHO_IN_NHAN");
  const discard = useBags("CHO_HUY");
  const inspect = useBags("CHO_KIEM_DINH");
  // Only whole blood can be split; a separated parent stays out of this list.
  const separable = { ...separate, data: separate.data?.filter((b) => b.productType === "MAU_TOAN_PHAN") };

  const [testId, setTestId] = useState<number | null>(null);
  const [sepId, setSepId] = useState<number | null>(null);
  const [printed, setPrinted] = useState<PrintedLabel | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const print = useApiMutation((id: number) => api<PrintedLabel>(`/api/staff/bloodbag/print-label/${id}`, { method: "POST" }), {
    invalidate: [["staff"]],
    onSuccess: (l) => setPrinted(l),
  });
  const discardMut = useApiMutation((ids: number[]) => api<string>("/api/staff/bloodbag/discard-blood", { method: "PATCH", body: ids }), {
    invalidate: [["staff"]],
    onSuccess: (m) => { toast.success(typeof m === "string" ? m : "Đã hủy"); setSelected(new Set()); },
  });
  const undo = useApiMutation((ids: number[]) => api<string>("/api/staff/bloodbag/undo-discard-blood", { method: "PATCH", body: ids }), {
    invalidate: [["staff"]],
    onSuccess: (m) => { toast.success(typeof m === "string" ? m : "Đã hoàn tác"); setSelected(new Set()); },
  });

  const counts: Record<Tab, number> = {
    test: test.data?.length ?? 0,
    separate: separable.data?.length ?? 0,
    label: label.data?.length ?? 0,
    discard: discard.data?.length ?? 0,
    inspect: inspect.data?.length ?? 0,
  };

  return (
    <>
      <PageHeader title="Xét nghiệm & chế phẩm" description="Túi máu đi qua: xét nghiệm → tách chế phẩm → in nhãn → kho. Túi không an toàn chuyển sang chờ hủy." />
      <div className="mb-4">
        <FilterTabs tabs={TABS} value={tab} onChange={(t) => { setSelected(new Set()); setTab(t); }} counts={counts} />
      </div>

      {tab === "test" && (
        <BagTable query={test} empty="Không có túi chờ xét nghiệm" action={(b) => <Button size="sm" onClick={() => setTestId(b.bloodBagId)}><FlaskConical /> Nhập kết quả</Button>} />
      )}

      {tab === "separate" && (
        <BagTable
          query={separable}
          empty="Không có túi chờ tách"
          action={(b) => (
            <div className="flex justify-end gap-1">
              <SendResultButton bagId={b.bloodBagId} />
              <Button size="sm" onClick={() => setSepId(b.bloodBagId)}><Layers /> Tách</Button>
            </div>
          )}
        />
      )}

      {tab === "label" && (
        <BagTable
          query={label}
          empty="Không có túi chờ in nhãn"
          action={(b) => (
            <Button size="sm" onClick={() => print.mutate(b.bloodBagId)} disabled={print.isPending && print.variables === b.bloodBagId}>
              <Printer /> In nhãn
            </Button>
          )}
        />
      )}

      {tab === "discard" && (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background p-3 text-sm">
            <span className="text-muted-foreground">Đã chọn {selected.size} túi. Hủy là thao tác tiêu hủy vật lý; hoàn tác được trong 24 giờ.</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={!selected.size || undo.isPending} onClick={() => undo.mutate([...selected])}>
                <RotateCcw /> Xét nghiệm lại
              </Button>
              <ConfirmDialog
                trigger={(o) => <Button size="sm" variant="destructive" disabled={!selected.size} onClick={o}><Trash2 /> Hủy {selected.size || ""} túi</Button>}
                title={`Tiêu hủy ${selected.size} túi máu?`}
                description="Các túi chuyển sang trạng thái Đã hủy."
                confirmLabel="Tiêu hủy"
                destructive
                onConfirm={() => discardMut.mutateAsync([...selected])}
              />
            </div>
          </div>
          <BagTable
            query={discard}
            empty="Không có túi chờ hủy"
            selected={selected}
            onToggle={(id) => setSelected((s) => toggleIn(s, id))}
            onToggleAll={(ids) => setSelected(new Set(ids))}
            action={(b) => <SendResultButton bagId={b.bloodBagId} />}
          />
        </>
      )}

      {tab === "inspect" && (
        <>
          <p className="mb-3 text-sm text-muted-foreground">Túi bệnh viện trả về, kho đã kiểm tra bên ngoài và chuyển sang cho kỹ thuật kiểm định.</p>
          <BagTable query={inspect} empty="Không có túi chờ kiểm định" showLocation />
        </>
      )}

      <TestDialog key={`t${testId}`} bagId={testId} onClose={() => { setTestId(null); qc.invalidateQueries({ queryKey: ["staff", "bags"] }); }} />
      <SeparateDialog key={`s${sepId}`} bagId={sepId} onClose={() => setSepId(null)} />
      <LabelDialog label={printed} onClose={() => setPrinted(null)} />
    </>
  );
}

export default function LabPage() {
  return (
    <Suspense>
      <LabContent />
    </Suspense>
  );
}
