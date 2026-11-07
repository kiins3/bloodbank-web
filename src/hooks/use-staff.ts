"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import type { BloodBagDetail, BloodBagStatus, BloodBagSummary, MyAssignment, StaffProfile } from "@/lib/types";

export function useStaffProfile() {
  const session = useSession();
  return useQuery({
    queryKey: ["staff", "profile", session?.email],
    queryFn: () => api<StaffProfile>("/api/shared/user/get-profile"),
    enabled: !!session,
  });
}

export function useMyAssignments() {
  return useQuery({
    queryKey: ["staff", "assignments"],
    queryFn: () => api<{ assignments: MyAssignment[] }>("/api/staff/assignment/my-assignment"),
    select: (d) => d.assignments,
  });
}

/** Bags in one status, newest first. */
export function useBags(status: BloodBagStatus, refetchInterval?: number) {
  return useQuery({
    queryKey: ["staff", "bags", status],
    queryFn: () => api<BloodBagSummary[]>(`/api/staff/bloodbag/get-list-blood-bag?status=${status}`),
    select: (bags) => [...bags].sort((a, b) => b.bloodBagId - a.bloodBagId),
    refetchInterval,
  });
}

export function useBagDetail(id: number | null) {
  return useQuery({
    queryKey: ["staff", "bag", id],
    queryFn: () => api<BloodBagDetail>(`/api/staff/bloodbag/get-blood-bag-detail/${id}`),
    enabled: id !== null,
  });
}
