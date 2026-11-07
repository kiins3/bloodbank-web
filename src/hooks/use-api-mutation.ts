"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

/** Mutation that shows a toast on success/failure and refreshes the given queries. */
export function useApiMutation<TVars, TResult = unknown>(
  fn: (vars: TVars) => Promise<TResult>,
  { success, invalidate = [], onSuccess }: { success?: string; invalidate?: QueryKey[]; onSuccess?: (r: TResult, v: TVars) => void } = {},
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (result, vars) => {
      if (success) toast.success(success);
      invalidate.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
      onSuccess?.(result, vars);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Thao tác thất bại"),
  });
}
