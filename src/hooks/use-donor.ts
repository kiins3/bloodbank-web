"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import type { DonorHistory, DonorProfile, TicketSummary } from "@/lib/types";

/** Registration needs these fields (RegistrationService.registration). */
export const isProfileComplete = (p?: DonorProfile) => !!p && !!p.dob && !!p.gender && !!p.address?.trim();

export function useDonorProfile() {
  const session = useSession();
  return useQuery({
    queryKey: ["donor", "profile", session?.email],
    queryFn: () => api<DonorProfile>("/api/shared/user/get-profile"),
    enabled: !!session,
  });
}

export function useMyTickets() {
  return useQuery({
    queryKey: ["donor", "tickets"],
    queryFn: () => api<TicketSummary[]>("/api/donor/registration/get-all-my-tickets"),
  });
}

export function useMyHistory() {
  return useQuery({
    queryKey: ["donor", "history"],
    queryFn: () => api<DonorHistory>("/api/donor/my-history"),
  });
}

/** Active ticket for an event, ignoring cancelled ones. */
export const ticketFor = (tickets: TicketSummary[] | undefined, eventId: number) =>
  tickets?.find((t) => t.eventId === eventId && t.registrationStatus !== "DA_HUY");

/** Minimum gap between two whole-blood donations. */
export const DONATION_GAP_DAYS = 84;

const DONATED = ["DA_LAY_MAU", "HOAN_THANH"];

/** Last donation date and the first day the donor may give blood again (null if never donated). */
export function useEligibility() {
  const history = useMyHistory();
  const last = (history.data?.history ?? [])
    .filter((h) => DONATED.includes(h.status))
    .map((h) => h.donationDate)
    .sort()
    .pop();
  const next = last ? new Date(new Date(last).getTime() + DONATION_GAP_DAYS * 86_400_000) : null;
  return { isLoading: history.isLoading, lastDonation: last ?? null, nextEligible: next };
}
