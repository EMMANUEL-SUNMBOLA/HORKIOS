"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { TxProgress } from "@/components/ui/tx-progress";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { useModal } from "@/components/modal";
import { formatDate, formatGen, truncateAddress } from "@/lib/format";
import { readInviteFragment } from "@/lib/invite";
import { readCampaign, requireContract, TransactionStatusUnavailableError, UndeterminedTransactionError, waitForOutcome, writeClient } from "@/lib/contract";
import { useWallet } from "@/lib/wallet";
import type { TxStage } from "@/lib/types";
import type { Hash } from "genlayer-js/types";

export default function InvitePage() {
  const params = useParams<{ id: string }>(); const router = useRouter(); const id = Number(params.id);
  const { address, connect, ensureNetwork } = useWallet();
  const { showModal, hideModal } = useModal();
  const [secret] = useState<string | null>(() => readInviteFragment());
  const [accepted, setAccepted] = useState<boolean[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [stage, setStage] = useState<TxStage>("idle");
  const [hash, setHash] = useState<string>(); const [error, setError] = useState<string>();
  const [monitoringDelayed, setMonitoringDelayed] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const query = useQuery({ queryKey: ["campaign", id], queryFn: () => readCampaign(id) });

  async function review() {
    if (!secret) { setError("This invitation link is missing its secret fragment"); return; }
    if (!address) { await connect(); return; }
    setModalActive(true);
    try {
      await ensureNetwork(); setStage("signing");
      const reviews = campaign!.demands.map((_, index) => accepted[index] ?? true);
      const proposed = campaign!.demands.map((demand, index) => {
        if (reviews[index]) return 0;
        if (!dates[index]) throw new Error(`Choose a later deadline for demand ${index + 1}`);
        const seconds = Math.floor(new Date(dates[index]).getTime() / 1000);
        if (!Number.isFinite(seconds) || seconds <= Number(demand.original_deadline)) throw new Error(`Demand ${index + 1} deadline must be strictly later than the original`);
        return seconds;
      });
      const txHash = await writeClient(address).writeContract({ address: requireContract(), functionName: "review_campaign", args: [id, secret, reviews, proposed], value: 0n });
      setHash(txHash); setStage("submitted"); await waitForOutcome(txHash as Hash, { onAccepted: () => setStage("accepted"), onMonitoringDelay: setMonitoringDelayed }); setStage("finalized"); router.push(`/campaign/${id}`);
    } catch (caught) { setStage(caught instanceof UndeterminedTransactionError ? "undetermined" : caught instanceof TransactionStatusUnavailableError ? "status_unavailable" : "error"); setError(caught instanceof Error ? caught.message : "Review failed"); }
  }

  function dismissModal() {
    hideModal();
    setModalActive(false);
    setStage("idle");
    setHash(undefined);
    setMonitoringDelayed(false);
  }

  useEffect(() => {
    if (!modalActive || stage === "idle") return;
    showModal(() => (
      <TxProgress stage={stage} hash={hash} monitoringDelayed={monitoringDelayed} onDismiss={dismissModal} />
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showModal/hideModal are stable from context
  }, [modalActive, stage, hash, monitoringDelayed]);

  const campaign = query.data;
  if (query.isLoading) return <div className="glass flex items-center justify-center rounded-2xl px-6 py-16 text-center text-fog">
    <span className="horkios-pulse mr-2.5 inline-block h-1.5 w-1.5 rounded-full bg-green" />
    Opening private invitation…
  </div>;
  if (!campaign) return <div className="glass flex items-center justify-center rounded-2xl px-6 py-16 text-center text-red">
    Invitation campaign not found.
  </div>;

  return <>
    <div className="mb-12 flex items-end justify-between gap-8 max-[900px]:flex-col max-[900px]:items-start">
      <div>
        <SectionLabel label={`Private invitation · Oath #${id}`} className="mb-6" />
        <h1 className="font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-bone sm:text-[42px]">
          You have been invited to swear an oath.
        </h1>
        <p className="mt-3 text-[14px] text-fog">
          Creator {truncateAddress(campaign.creator)} · @{campaign.x_account} · expires {formatDate(campaign.acceptance_deadline)}
        </p>
      </div>
    </div>

    {!secret && (
      <div className="glass-inner mb-6 rounded-xl border-l-[3px] border-l-copper p-4 text-[13px] leading-[1.5] text-fog">
        The invitation secret is missing. Ask the creator for the complete link.
      </div>
    )}

    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6 items-start max-[900px]:grid-cols-1">
      <section className="grid gap-4">
        {campaign.demands.map((demand, index) => (
          <GlassCard key={index} className="p-6">
            <div className="flex items-center justify-between gap-3.5 mb-4">
              <strong className="font-display text-[14px] font-medium text-bone">
                Demand {index + 1} of {campaign.demands.length}
              </strong>
              <strong className="font-mono text-[14px] font-medium text-bone">
                {formatGen(demand.allocation)} gross
              </strong>
            </div>

            <p className="mb-4 text-[14px] leading-[1.5] text-fog">{demand.instructions}</p>

            {/* Requirements */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="glass-input rounded-full px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-fog">
                Views ≥ {String(demand.min_views)}
              </span>
              <span className="glass-input rounded-full px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-fog">
                Likes ≥ {String(demand.min_likes)}
              </span>
              <span className="glass-input rounded-full px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-fog">
                Due {formatDate(demand.original_deadline)}
              </span>
            </div>

            {/* Accept/Counter radio */}
            <div className="grid gap-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`review-${index}`}
                  checked={accepted[index] ?? true}
                  onChange={() => setAccepted(values => {
                    const next = [...values];
                    next[index] = true;
                    return next;
                  })}
                  className="accent-green"
                />
                <span className="text-[14px] text-bone">Accept this demand</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={`review-${index}`}
                  checked={accepted[index] === false}
                  onChange={() => setAccepted(values => {
                    const next = [...values];
                    next[index] = false;
                    return next;
                  })}
                  className="accent-amber"
                />
                <span className="text-[14px] text-bone">Propose a later deadline</span>
              </label>
              {accepted[index] === false && (
                <input
                  className="glass-input mt-2 w-full rounded-full px-4 py-2.5 text-bone text-[14px]"
                  type="datetime-local"
                  min={new Date((Number(demand.original_deadline) + 60) * 1000).toISOString().slice(0, 16)}
                  value={dates[index] ?? ""}
                  onChange={event => setDates(values => {
                    const next = [...values];
                    next[index] = event.target.value;
                    return next;
                  })}
                />
              )}
            </div>
          </GlassCard>
        ))}
      </section>

      {/* Sidebar */}
      <aside className="max-[900px]:static sticky top-[88px]">
        <GlassCard className="p-6">
          <h2 className="mb-4 font-display text-[18px] font-semibold text-bone">Before you sign</h2>

          <div className="glass-inner rounded-xl border-l-[3px] border-l-copper p-3 text-[13px] leading-[1.5] text-fog mb-4">
            Terms, wallet addresses, evidence, and decisions are public.
          </div>

          <div className="flex justify-between gap-4 py-2 text-[14px] text-fog">
            <span>Gross compensation</span>
            <strong className="font-mono font-medium text-bone">{formatGen(campaign.original_escrow)}</strong>
          </div>

          <button
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black transition-all duration-200 hover:bg-bone"
            disabled={!secret}
            onClick={review}
          >
            {address ? accepted.every(Boolean) ? "Swear to these terms" : "Send deadline proposal" : "Connect wallet"}
          </button>

          {error && <p className="mt-3 text-[13px] text-red">{error}</p>}
        </GlassCard>

        {!modalActive && <TxProgress stage={stage} hash={hash} monitoringDelayed={monitoringDelayed} />}
      </aside>
    </div>
  </>;
}
