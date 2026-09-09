"use client";

import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { OathTable } from "@/components/dashboard/oath-table";
import { EmptyState } from "@/components/dashboard/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { formatGen, truncateAddress } from "@/lib/format";
import {
  networkName,
  readCampaign,
  readClient,
  requireContract,
} from "@/lib/contract";
import { useWallet } from "@/lib/wallet";

export default function DashboardPage() {
  const { address, connect } = useWallet();

  const idsQuery = useQuery({
    queryKey: ["campaign-ids", address],
    enabled: Boolean(address),
    queryFn: async () => {
      const walletAddress = address;
      if (!walletAddress) throw new Error("Connect a wallet");
      const [creator, kol] = (await Promise.all([
        readClient.readContract({
          address: requireContract(),
          functionName: "get_creator_campaign_ids",
          args: [walletAddress, 0, 50],
        }),
        readClient.readContract({
          address: requireContract(),
          functionName: "get_kol_campaign_ids",
          args: [walletAddress, 0, 50],
        }),
      ])) as [Array<number | bigint>, Array<number | bigint>];
      return [...new Set([...creator, ...kol].map(Number))].sort(
        (a, b) => b - a,
      );
    },
  });

  const campaigns = useQueries({
    queries: (idsQuery.data || []).map((id) => ({
      queryKey: ["campaign", id],
      queryFn: () => readCampaign(id),
    })),
  });

  const loaded = campaigns.flatMap((q) => (q.data ? [q.data] : []));
  const locked = loaded.reduce(
    (total, c) => total + BigInt(c.locked_amount),
    0n,
  );
  const active = loaded.filter((c) => Number(c.status) === 2).length;

  return (
    <div>
      <div className="mb-14 flex items-end justify-between gap-8 max-[900px]:flex-col max-[900px]:items-start">
        <div>
          <SectionLabel label="Workspace / Oaths" className="mb-6" />
          <h1 className="font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-bone sm:text-[42px]">
            Your dashboard
          </h1>
          <p className="mt-3.5 max-w-[600px] text-[15px] text-fog">
            Track every promise, proof, and settlement from one public
            workspace.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-[14px] font-medium text-black transition-all duration-200 hover:bg-bone"
          href="/create"
        >
          Create new oath <span>↗</span>
        </Link>
      </div>

      {/* Overview grid */}
      <section
        className="mb-20 grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1"
        aria-label="Oath overview"
      >
        <GlassCard className="flex min-h-[150px] flex-col p-6">
          <span className="section-label text-[10px]">
            <span className="section-label-slash">/</span>
            <span className="ml-1">Connected Account</span>
          </span>
          <strong className="mt-6 font-display text-[22px] font-semibold text-bone">
            {address ? truncateAddress(address) : "NOT CONNECTED"}
          </strong>
          <span className="mt-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-fog">
            <span
              className={`h-1.5 w-1.5 rounded-full ${address ? "bg-green horkios-pulse" : "bg-slate"}`}
            />
            {address
              ? `${networkName.toUpperCase()} · ONLINE`
              : "WALLET REQUIRED"}
          </span>
        </GlassCard>
        {[
          {
            label: "Total Oaths",
            value: loaded.length.toString().padStart(2, "0"),
            sub: "Creator + KOL",
          },
          {
            label: "Active",
            value: active.toString().padStart(2, "0"),
            sub: "In progress",
          },
          {
            label: "Locked Value",
            value: address
              ? formatGen(locked).replace(" GEN", "")
              : "---",
            sub: "GEN",
          },
        ].map(({ label, value, sub }) => (
          <GlassCard key={label} className="flex min-h-[150px] flex-col p-6">
            <span className="section-label text-[10px]">
              <span className="section-label-slash">/</span>
              <span className="ml-1">{label}</span>
            </span>
            <strong className="mt-4 font-display text-[40px] font-semibold leading-none tracking-[-0.03em] text-bone max-[600px]:text-[32px]">
              {value}
            </strong>
            <small className="mt-auto font-mono text-[10px] uppercase tracking-[0.14em] text-ash">
              {sub}
            </small>
          </GlassCard>
        ))}
      </section>

      {/* Records head */}
      <div className="border-b border-glass-border-subtle pb-4">
        <SectionLabel label="Oath Records" className="mb-4" />
        <div className="flex items-end justify-between">
          <h2 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-bone">
            Recent activity
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ash max-[600px]:hidden">
            {loaded.length} RECORD{loaded.length === 1 ? "" : "S"}
          </span>
        </div>
      </div>

      {/* Content */}
      {!address ? (
        <EmptyState
          symbol="◎"
          heading="Connect your working wallet."
          description="Use the account you act with as a creator or KOL to reveal its oath records."
          actionLabel="Connect wallet"
          onAction={connect}
        />
      ) : idsQuery.isLoading ? (
        <div className="glass flex items-center gap-2.5 rounded-xl px-6 py-16 text-fog">
          <span className="horkios-pulse mr-2.5 inline-block h-1.5 w-1.5 rounded-full bg-green" />
          Reading campaign indexes from GenLayer...
        </div>
      ) : idsQuery.error ? (
        <div className="glass rounded-xl px-6 py-16 text-center text-red">
          Campaign records could not be loaded. Check the contract and network
          configuration.
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          symbol="◇"
          heading="No oaths yet."
          description="Your funded or accepted campaigns will appear here as permanent records."
          actionLabel="Create your first oath"
          actionHref="/create"
        />
      ) : (
        <OathTable
          campaigns={loaded}
          ids={idsQuery.data || []}
        />
      )}
    </div>
  );
}
