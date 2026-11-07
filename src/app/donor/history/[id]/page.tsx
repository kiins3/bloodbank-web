"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowLeft, Droplet, Gauge, HeartPulse, Scale, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/app/link-button";
import { ErrorState, TableSkeleton } from "@/components/app/states";
import { StatusBadge } from "@/components/app/status-badge";
import { api } from "@/lib/api";
import { fmtDate, fmtDateTime, registrationStatus, testValue } from "@/lib/format";
import type { DonationDetail, TestValue } from "@/lib/types";

const tests: [keyof NonNullable<DonationDetail["testResultInfo"]>, string][] = [
  ["hiv", "HIV"],
  ["hbv", "Viêm gan B (HBV)"],
  ["hcv", "Viêm gan C (HCV)"],
  ["syphilis", "Giang mai"],
  ["malaria", "Sốt rét"],
];

export default function DonationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: d, isLoading, error } = useQuery({
    queryKey: ["donor", "history", id],
    queryFn: () => api<DonationDetail>(`/api/donor/history-detail/${id}`),
  });

  const t = d?.testResultInfo;
  const unsafe = t && tests.some(([k]) => t[k] === "DUONG_TINH");

  return (
    <>
      <LinkButton href="/donor/history" variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
        <ArrowLeft /> Lịch sử hiến máu
      </LinkButton>
      {error && <ErrorState error={error} />}
      {isLoading && <Card><TableSkeleton rows={6} /></Card>}
      {d && (
        <>
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{d.eventName}</h1>
              <StatusBadge {...registrationStatus[d.status]} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{fmtDate(d.donationDate)} · {d.location}</p>
          </div>

          {d.rejectionReason && (
            <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <span className="font-medium">Lý do chưa hiến được: </span>{d.rejectionReason}
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Khám sàng lọc</CardTitle>
                <CardDescription>Chỉ số đo trước khi lấy máu</CardDescription>
              </CardHeader>
              <CardContent>
                {d.screeningInfo ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Scale, label: "Cân nặng", value: `${d.screeningInfo.weight} kg` },
                      { icon: Activity, label: "Huyết sắc tố", value: `${d.screeningInfo.hemoglobin} g/dL` },
                      { icon: Gauge, label: "Huyết áp", value: `${d.screeningInfo.bloodPressure} mmHg` },
                      { icon: HeartPulse, label: "Nhịp tim", value: `${d.screeningInfo.heartRate} lần/phút` },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg border p-3">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><m.icon className="size-3.5" />{m.label}</p>
                        <p className="mt-1 font-semibold tabular-nums">{m.value}</p>
                      </div>
                    ))}
                    <div className="col-span-2 flex items-center justify-between rounded-lg bg-primary/5 p-3">
                      <p className="flex items-center gap-1.5 text-sm"><Droplet className="size-4 text-primary" />Lượng máu đã hiến</p>
                      <p className="font-semibold tabular-nums">{d.actualVolume ? `${d.actualVolume} ml` : "—"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa khám sàng lọc.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kết quả xét nghiệm</CardTitle>
                <CardDescription>{t?.resultDate ? `Có kết quả ${fmtDateTime(t.resultDate)}` : "Thường có sau 1–3 ngày"}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {t ? (
                  <>
                    <div className={`mb-1 flex items-center gap-3 rounded-lg p-3 ${unsafe ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>
                      {unsafe ? <ShieldAlert className="size-5" /> : <ShieldCheck className="size-5" />}
                      <div>
                        <p className="font-medium">{t.finalConclusion ?? (unsafe ? "Không an toàn" : "An toàn")}</p>
                        <p className="text-xs opacity-80">
                          {unsafe ? "Vui lòng liên hệ cơ sở y tế để được tư vấn thêm." : "Máu của bạn đủ điều kiện để cứu người."}
                        </p>
                      </div>
                    </div>
                    {tests.map(([k, label]) => {
                      const v = t[k] as TestValue | null;
                      return (
                        <div key={k} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                          <span>{label}</span>
                          {v ? <StatusBadge {...testValue[v]} /> : <span className="text-xs text-muted-foreground">Chưa có</span>}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có kết quả xét nghiệm.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
