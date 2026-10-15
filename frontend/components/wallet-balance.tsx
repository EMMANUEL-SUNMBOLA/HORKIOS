"use client";

import { useQuery } from "@tanstack/react-query";
import { nativeBalance } from "@/lib/contract";
import { networkName } from "@/lib/genlayer/network";
import { formatGen } from "@/lib/format";
import type { Address } from "@/lib/types";

/** Reads the connected account's native GEN balance on the active network. */
export function useNativeBalance(address?: Address) {
  const query = useQuery({
    queryKey: ["native-balance", networkName, address],
    queryFn: () => nativeBalance(address as Address),
    enabled: Boolean(address),
  });
  return {
    balance: query.data,
    loading: query.isLoading || query.isFetching,
    refresh: () => query.refetch(),
  };
}

export function WalletBalance({ address, className }: { address?: Address; className?: string }) {
  const { balance, loading } = useNativeBalance(address);
  if (!address) return null;
  return (
    <span className={className} title="Native GEN balance">
      {balance === undefined ? (loading ? "…" : "—") : formatGen(balance)}
    </span>
  );
}
