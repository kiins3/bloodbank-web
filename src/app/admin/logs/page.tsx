"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NativeSelect, toOptions } from "@/components/app/native-select";
import { PageHeader } from "@/components/app/page-header";
import { Pagination } from "@/components/app/pagination";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { api, qs } from "@/lib/api";
import { fmtDateTime, roleLabel } from "@/lib/format";
import type { ActionLog, Page } from "@/lib/types";

const actionLabel: Record<string, string> = {
  UPDATE_TEST_RESULT: "Nhập xét nghiệm",
  SEPARATE_BLOOD: "Tách chế phẩm",
  PRINT_LABEL_BAG: "In nhãn",
  STORAGE_BLOOD: "Nhập kho",
  TRANSFER_STORAGE: "Chuyển tủ",
  DISCARD_BAG: "Hủy túi máu",
  UNDO_DISCARD: "Hoàn tác hủy",
  REVIEW_REQUEST: "Duyệt yêu cầu",
  EXPORT_BLOOD: "Xuất máu",
  PROCESS_RETURN: "Xử lý hoàn trả",
  UPDATE_EQUIPMENT: "Cập nhật thiết bị",
  UPDATE_STAFF_PROFILE: "Cập nhật hồ sơ",
  UPDATE_REQUEST: "Sửa yêu cầu",
};

const entityLabel: Record<string, string> = {
  BloodBag: "Túi máu",
  TestResult: "Xét nghiệm",
  BloodRequest: "Yêu cầu máu",
  StorageEquipment: "Thiết bị",
  Staff: "Nhân viên",
};

function pretty(json: string | null) {
  if (!json) return "—";
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

export default function LogsPage() {
  const [role, setRole] = useState("");
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["logs", role, entity, page],
    queryFn: () => api<Page<ActionLog>>(`/api/staff/action-logs${qs({ role, entityName: entity, page, size: 15 })}`),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader title="Nhật ký thao tác" description="Mọi thay đổi dữ liệu kèm người thực hiện, giá trị trước và sau." />
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <NativeSelect className="w-48" placeholder="Mọi vai trò" options={toOptions(roleLabel)} value={role} onChange={(e) => { setRole(e.target.value); setPage(0); }} />
          <NativeSelect
            className="w-48"
            placeholder="Mọi đối tượng"
            options={[
              { value: "BloodBag", label: "Túi máu" },
              { value: "TestResult", label: "Kết quả xét nghiệm" },
              { value: "BloodRequest", label: "Yêu cầu máu" },
              { value: "StorageEquipment", label: "Thiết bị" },
              { value: "Staff", label: "Nhân viên" },
            ]}
            value={entity}
            onChange={(e) => { setEntity(e.target.value); setPage(0); }}
          />
        </div>
        {error && <div className="p-4"><ErrorState error={error} /></div>}
        {isLoading && <TableSkeleton rows={8} />}
        {data && data.content.length === 0 && <EmptyState title="Chưa có nhật ký" />}
        <div className="divide-y">
          {data?.content.map((l) => (
            <div key={l.logId}>
              <button className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-muted/40" onClick={() => setOpen(open === l.logId ? null : l.logId)}>
                <div className="w-32 shrink-0 text-xs text-muted-foreground">{fmtDateTime(l.createdAt)}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium">{l.staffName ?? roleLabel[l.performedByRole] ?? "Hệ thống"}</span>{" "}
                    <span className="text-muted-foreground">· {actionLabel[l.actionType] ?? l.actionType} · {entityLabel[l.entityName] ?? l.entityName} #{l.entityId}</span>
                  </p>
                  {l.note && <p className="truncate text-xs text-muted-foreground">{l.note}</p>}
                </div>
                <StatusBadge label={l.status === "SUCCESS" ? "Thành công" : l.status} tone={l.status === "SUCCESS" ? "green" : "red"} />
                <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open === l.logId ? "rotate-180" : ""}`} />
              </button>
              {open === l.logId && (
                <div className="grid gap-3 bg-muted/30 px-4 pb-4 md:grid-cols-2">
                  {[["Trước", l.oldData], ["Sau", l.newData]].map(([label, v]) => (
                    <div key={label}>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
                      <pre className="max-h-64 overflow-auto rounded-md border bg-background p-3 font-mono text-xs leading-relaxed">{pretty(v)}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {data && <Pagination page={page} totalPages={data.page.totalPages} totalElements={data.page.totalElements} onChange={setPage} />}
      </Card>
    </>
  );
}
