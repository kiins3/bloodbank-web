"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/app/link-button";
import { PageHeader } from "@/components/app/page-header";
import { ErrorState, TableSkeleton } from "@/components/app/states";
import { RequestForm } from "@/components/hospital/request-form";
import { api } from "@/lib/api";
import type { BloodRequestDetail } from "@/lib/types";

export default function EditRequestPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["hospital", "request", id],
    queryFn: () => api<BloodRequestDetail>(`/api/shared/blood-request/detail/${id}`),
  });

  return (
    <>
      <LinkButton href={`/hospital/requests/${id}`} variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground">
        <ArrowLeft /> Yêu cầu #{id}
      </LinkButton>
      <PageHeader title={`Sửa yêu cầu #${id}`} />
      {error && <ErrorState error={error} />}
      {isLoading && <Card><TableSkeleton rows={6} /></Card>}
      {data && (data.status === "CHO_DUYET" && data.priority === "BINH_THUONG" ? (
        <RequestForm initial={data} />
      ) : (
        <ErrorState error={new Error("Chỉ sửa được yêu cầu bình thường đang chờ duyệt.")} />
      ))}
    </>
  );
}
