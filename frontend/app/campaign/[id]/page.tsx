"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CampaignStatus, DemandStatus } from "@/components/ui/status-badge";
import { TxProgress } from "@/components/ui/tx-progress";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { useModal } from "@/components/modal";
import { canonicalXUrl } from "@/lib/validation";
import { formatDate, formatGen, truncateAddress } from "@/lib/format";
import { readCampaign, requireContract, TransactionStatusUnavailableError, UndeterminedTransactionError, waitForOutcome, writeClient } from "@/lib/contract";
import { useWallet } from "@/lib/wallet";
import type { TxStage } from "@/lib/types";
import type { CalldataEncodable, Hash } from "genlayer-js/types";

const confirmTitles: Record<string, string> = {
  approve_counteroffer: "Approve counteroffer",
  cancel_unaccepted_campaign: "Cancel oath",
  expire_unaccepted_campaign: "Expire invitation",
  finalize_expired_demand: "Final expired check",
  request_termination: "Open termination case",
  adjudicate_termination: "Request ruling",
};

const confirmLabels: Record<string, string> = {
  approve_counteroffer: "Approve all dates",
  cancel_unaccepted_campaign: "Yes, cancel and refund",
  expire_unaccepted_campaign: "Yes, expire and refund",
  finalize_expired_demand: "Run final check",
  request_termination: "Open 48-hour case",
  adjudicate_termination: "Request ruling",
};

const dangerousActions = new Set(["cancel_unaccepted_campaign", "expire_unaccepted_campaign", "request_termination", "adjudicate_termination"]);

export default function CampaignPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { address, connect, ensureNetwork } = useWallet();
  const { showModal, hideModal } = useModal();
  const [evidence, setEvidence] = useState<Record<number, string>>({});
  const [stage, setStage] = useState<TxStage>("idle");
  const [hash, setHash] = useState<string>();
  const [error, setError] = useState<string>();
  const [monitoringDelayed, setMonitoringDelayed] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const [terminationCategory, setTerminationCategory] = useState("external_hardship");
  const [terminationStatement, setTerminationStatement] = useState("");
  const [terminationUrls, setTerminationUrls] = useState("");
  const [responseStatement, setResponseStatement] = useState("");
  const [responseUrls, setResponseUrls] = useState("");
  const campaignQuery = useQuery({ queryKey: ["campaign", id], queryFn: () => readCampaign(id), enabled: Number.isInteger(id) && id >= 0 });
  const campaign = campaignQuery.data;

  useEffect(() => {
    const timer = window.setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const parseUrls = (value: string) => value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);

  const confirmations: Record<string, string> = {
    approve_counteroffer: "Approve every proposed deadline and activate this oath?",
    cancel_unaccepted_campaign: "Cancel this unaccepted oath and refund its full escrow?",
    expire_unaccepted_campaign: "Expire this invitation and refund its full escrow?",
    finalize_expired_demand: "Run the final evidence check? Failure will permanently refund this demand.",
    request_termination: "Open a public 48-hour termination case? Submitted statements and evidence cannot be edited or deleted.",
    adjudicate_termination: "Ask GenLayer for the final termination ruling now?",
  };

  function confirmAction(functionName: string): Promise<boolean> {
    return new Promise(resolve => {
      showModal(() => (
        <ConfirmModal
          title={confirmTitles[functionName] || "Confirm action"}
          message={confirmations[functionName]}
          confirmLabel={confirmLabels[functionName] || "Confirm"}
          variant={dangerousActions.has(functionName) ? "danger" : "default"}
          onConfirm={() => resolve(true)}
        />
      ));
      const checkResolved = setInterval(() => {
        if (!document.querySelector(".modal-backdrop")) {
          clearInterval(checkResolved);
          resolve(false);
        }
      }, 100);
    });
  }

  async function transact(functionName: string, args: CalldataEncodable[]) {
    setError(undefined);
    if (confirmations[functionName]) {
      const confirmed = await confirmAction(functionName);
      if (!confirmed) return;
    }
    if (!address) { await connect(); return; }
    setModalActive(true);
    try {
      await ensureNetwork(); setStage("signing");
      const txHash = await writeClient(address).writeContract({ address: requireContract(), functionName, args, value: 0n });
      setHash(txHash); setStage("submitted");
      const usesConsensus = ["verify_demand", "finalize_expired_demand", "adjudicate_termination"].includes(functionName);
      await waitForOutcome(txHash as Hash, { onAccepted: () => setStage(usesConsensus ? "evaluating" : "accepted"), onMonitoringDelay: setMonitoringDelayed }); setStage("finalized");
      await queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    } catch (caught) { setStage(caught instanceof UndeterminedTransactionError ? "undetermined" : caught instanceof TransactionStatusUnavailableError ? "status_unavailable" : "error"); setError(caught instanceof Error ? caught.message : "Transaction failed"); }
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

  if (campaignQuery.isLoading) return <div className="glass flex items-center justify-center rounded-2xl p-8 text-center text-muted-foreground">
    <span className="horkios-pulse mr-2.5 inline-block h-1.5 w-1.5 rounded-full bg-green" />
    Reading oath from GenLayer…
  </div>;
  if (campaignQuery.error || !campaign) return <div className="glass flex items-center justify-center rounded-2xl p-8 text-center text-destructive">
    This oath could not be loaded. Check the contract configuration and campaign ID.
  </div>;
  const isKol = address?.toLowerCase() === campaign.kol.toLowerCase();
  const isCreator = address?.toLowerCase() === campaign.creator.toLowerCase();
  const isParty = isKol || isCreator;
  const termination = campaign.termination;
  const isRequester = address?.toLowerCase() === termination.requester?.toLowerCase();
  const responseOpen = Number(campaign.status) === 3 && Number(termination.status) === 1 && nowSeconds <= Number(termination.response_deadline);
  const adjudicationReady = Number(campaign.status) === 3 && [1, 2].includes(Number(termination.status)) && nowSeconds > Number(termination.response_deadline);

  return <>
    <div className="mb-12 flex items-end justify-between gap-8 max-[900px]:flex-col max-[900px]:items-start">
      <div>
        <SectionLabel label={`Oath #${id}`} className="mb-6" />
        <h1 className="font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-foreground sm:text-[42px]">
          {campaign.title}
        </h1>
        <p className="mt-3 text-[14px] text-muted-foreground">
          @{campaign.x_account} · {truncateAddress(campaign.creator)} ↔ {truncateAddress(campaign.kol)}
        </p>
      </div>
      <CampaignStatus status={Number(campaign.status)} />
    </div>

    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6 items-start max-[900px]:grid-cols-1">
      <section className="grid gap-4">
        {/* Description */}
        <GlassCard className="p-6">
          <p className="text-[14px] leading-[1.5] text-muted-foreground">
            {campaign.description || "No additional campaign description."}
          </p>
        </GlassCard>

        {/* Demands */}
        {campaign.demands.map((demand, index) => (
          <GlassCard key={index} className="p-6">
            <div className="flex items-center justify-between gap-3.5 mb-4">
              <div>
                <SectionLabel label={`Demand ${index + 1}`} className="mb-2" />
                <h2 className="font-display text-[22px] font-semibold text-foreground">
                  {formatGen(demand.allocation)}
                </h2>
              </div>
              <DemandStatus status={Number(demand.status)} />
            </div>

            <p className="mb-4 text-[14px] leading-[1.5] text-muted-foreground">{demand.instructions}</p>

            {/* Requirements */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <span className="glass-input rounded-full px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                Views ≥ {String(demand.min_views)}
              </span>
              <span className="glass-input rounded-full px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                Likes ≥ {String(demand.min_likes)}
              </span>
              <span className="glass-input rounded-full px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                Reposts ≥ {String(demand.min_reposts)}
              </span>
              <span className="glass-input rounded-full px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                Due {formatDate(demand.active_deadline || demand.original_deadline)}
              </span>
            </div>

            {/* Evidence URL */}
            {demand.evidence_url && (
              <a className="mb-4 block font-mono text-[13px] text-primary hover:underline" href={demand.evidence_url} target="_blank" rel="noreferrer">
                {demand.evidence_url} ↗
              </a>
            )}

            {/* Verification decision */}
            {demand.decision?.checked_at && Number(demand.decision.checked_at) > 0 && (
              <div className="glass-inner rounded-xl border-l-[3px] border-l-primary p-4 mb-4">
                <strong className="block text-[14px] text-foreground">
                  {demand.decision.passed ? "Verification passed" : "Requirements not yet met"}
                </strong>
                <p className="mt-1 text-[13px] text-muted-foreground">{demand.decision.reason}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="glass-input rounded-full px-3 py-1 font-mono text-[10.5px] text-muted-foreground">
                    {String(demand.decision.observed_views)} views
                  </span>
                  <span className="glass-input rounded-full px-3 py-1 font-mono text-[10.5px] text-muted-foreground">
                    {String(demand.decision.observed_likes)} likes
                  </span>
                  <span className="glass-input rounded-full px-3 py-1 font-mono text-[10.5px] text-muted-foreground">
                    {String(demand.decision.observed_reposts)} reposts
                  </span>
                </div>
              </div>
            )}

            {/* Evidence submission (KOL) */}
            {isKol && [1, 2].includes(Number(demand.status)) && (
              <div className="grid gap-2">
                <label className="section-label text-[10px]" htmlFor={`evidence-${index}`}>
                  <span className="section-label-slash">/</span>
                  <span className="ml-1">Canonical X post URL</span>
                </label>
                <input
                  className="glass-input w-full rounded-full px-4 py-2.5 text-foreground text-[14px]"
                  id={`evidence-${index}`}
                  value={evidence[index] || ""}
                  onChange={event => setEvidence(current => ({ ...current, [index]: event.target.value }))}
                />
                <button
                  className="glass-input inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]"
                  onClick={() => {
                    try {
                      return transact("submit_evidence", [id, index, canonicalXUrl(evidence[index] || "")]);
                    } catch (caught) {
                      setError(caught instanceof Error ? caught.message : "Invalid URL");
                    }
                  }}
                >
                  Submit or replace proof
                </button>
              </div>
            )}

            {/* Verify button (Party) */}
            {isParty && Number(demand.status) === 2 && nowSeconds <= Number(demand.active_deadline) && (
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2 text-[13px] font-medium text-black transition-all duration-200 hover:bg-foreground"
                onClick={() => transact("verify_demand", [id, index])}
              >
                Ask GenLayer to verify
              </button>
            )}

            {/* Final expired check (Party) */}
            {isParty && [1, 2].includes(Number(demand.status)) && nowSeconds > Number(demand.active_deadline) && (
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-destructive/30 bg-destructive/10 px-5 py-2 text-[13px] font-medium text-destructive transition-all duration-200 hover:bg-destructive/20"
                onClick={() => transact("finalize_expired_demand", [id, index])}
              >
                Run final expired check
              </button>
            )}
          </GlassCard>
        ))}
      </section>

      {/* Sidebar */}
      <aside className="grid gap-4 max-[900px]:static sticky top-[88px]">
        {/* Escrow */}
        <GlassCard className="p-6">
          <h2 className="mb-4 font-display text-[18px] font-semibold text-foreground">Escrow</h2>
          <div className="grid gap-2">
            <div className="flex justify-between gap-4 py-2 text-[14px] text-muted-foreground">
              <span>Original</span>
              <strong className="font-mono font-medium text-foreground">{formatGen(campaign.original_escrow)}</strong>
            </div>
            <div className="flex justify-between gap-4 py-2 text-[14px] text-muted-foreground">
              <span>Locked</span>
              <strong className="font-mono font-medium text-foreground">{formatGen(campaign.locked_amount)}</strong>
            </div>
            <div className="flex justify-between gap-4 py-2 text-[14px] text-muted-foreground">
              <span>Gross paid</span>
              <span className="font-mono text-muted-foreground">{formatGen(campaign.gross_paid)}</span>
            </div>
            <div className="flex justify-between gap-4 py-2 text-[14px] text-muted-foreground">
              <span>KOL received</span>
              <span className="font-mono text-muted-foreground">{formatGen(campaign.net_paid)}</span>
            </div>
            <div className="flex justify-between gap-4 py-2 text-[14px] text-muted-foreground">
              <span>Platform fee</span>
              <span className="font-mono text-muted-foreground">{formatGen(campaign.fees_paid)}</span>
            </div>
            <div className="flex justify-between gap-4 py-2 text-[14px] text-muted-foreground">
              <span>Refunded</span>
              <span className="font-mono text-muted-foreground">{formatGen(campaign.refunded)}</span>
            </div>
          </div>
        </GlassCard>

        {/* Counteroffer (Creator) */}
        {isCreator && Number(campaign.status) === 1 && (
          <GlassCard className="p-6">
            <h2 className="mb-4 font-display text-[18px] font-semibold text-foreground">Deadline proposal</h2>
            <button
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-black transition-all duration-200 hover:bg-foreground"
              onClick={() => transact("approve_counteroffer", [id])}
            >
              Approve all proposed dates
            </button>
            <button
              className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-destructive/30 bg-destructive/10 px-5 py-2.5 text-[13px] font-medium text-destructive transition-all duration-200 hover:bg-destructive/20"
              onClick={() => transact("cancel_unaccepted_campaign", [id])}
            >
              Cancel and refund
            </button>
          </GlassCard>
        )}

        {/* Cancel (Creator, OFFERED) */}
        {isCreator && Number(campaign.status) === 0 && (
          <button
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-destructive/30 bg-destructive/10 px-5 py-2.5 text-[13px] font-medium text-destructive transition-all duration-200 hover:bg-destructive/20"
            onClick={() => transact("cancel_unaccepted_campaign", [id])}
          >
            Cancel and refund
          </button>
        )}

        {/* Expire (after deadline) */}
        {[0, 1].includes(Number(campaign.status)) && nowSeconds > Number(campaign.acceptance_deadline) && (
          <button
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-destructive/30 bg-destructive/10 px-5 py-2.5 text-[13px] font-medium text-destructive transition-all duration-200 hover:bg-destructive/20"
            onClick={() => transact("expire_unaccepted_campaign", [id])}
          >
            Expire invitation and refund
          </button>
        )}

        {/* Termination request (Party, ACTIVE) */}
        {isParty && Number(campaign.status) === 2 && (
          <GlassCard className="p-6">
            <h2 className="mb-2 font-display text-[18px] font-semibold text-foreground">Request termination</h2>
            <p className="mb-4 text-[13px] text-muted-foreground">
              Past payouts remain final. Your statement and public evidence are permanent.
            </p>
            <div className="grid gap-3">
              <select
                className="glass-input w-full rounded-full px-4 py-2.5 text-foreground text-[14px]"
                value={terminationCategory}
                onChange={event => setTerminationCategory(event.target.value)}
              >
                <option value="external_hardship">External hardship</option>
                <option value="kol_breach">KOL breach or abandonment</option>
                <option value="other">Other</option>
              </select>
              <textarea
                className="glass-input w-full rounded-xl px-4 py-2.5 text-foreground text-[14px] min-h-[100px] resize-vertical"
                maxLength={2000}
                placeholder="Public statement"
                value={terminationStatement}
                onChange={event => setTerminationStatement(event.target.value)}
              />
              <textarea
                className="glass-input w-full rounded-xl px-4 py-2.5 text-foreground text-[14px] min-h-[100px] resize-vertical"
                placeholder="Public HTTPS evidence URLs, one per line (max 5)"
                value={terminationUrls}
                onChange={event => setTerminationUrls(event.target.value)}
              />
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-destructive/30 bg-destructive/10 px-5 py-2.5 text-[13px] font-medium text-destructive transition-all duration-200 hover:bg-destructive/20"
                disabled={!terminationStatement.trim()}
                onClick={() => transact("request_termination", [id, terminationCategory, terminationStatement.trim(), parseUrls(terminationUrls)])}
              >
                Open 48-hour termination case
              </button>
            </div>
          </GlassCard>
        )}

        {/* Termination case (TERMINATION_PENDING) */}
        {Number(campaign.status) === 3 && (
          <GlassCard className="p-6">
            <h2 className="mb-4 font-display text-[18px] font-semibold text-foreground">Termination case</h2>
            <div className="grid gap-2 mb-4">
              <div className="flex justify-between gap-4 py-2 text-[14px] text-muted-foreground">
                <span>Category</span>
                <strong className="font-mono font-medium text-foreground">{termination.category.replaceAll("_", " ")}</strong>
              </div>
            </div>
            <p className="mb-2 text-[14px] leading-[1.5] text-muted-foreground">{termination.statement}</p>
            <p className="mb-4 text-[13px] text-muted-foreground">Response deadline: {formatDate(termination.response_deadline)}</p>

            {/* Respondent statement */}
            {termination.respondent_statement && (
              <div className="glass-inner rounded-xl border-l-[3px] border-l-primary p-4 mb-4">
                <strong className="block text-[14px] text-foreground">Response</strong>
                <p className="mt-1 text-[13px] text-muted-foreground">{termination.respondent_statement}</p>
              </div>
            )}

            {/* Ruling */}
            {termination.reason && (
              <div className="glass-inner rounded-xl border-l-[3px] border-l-primary p-4 mb-4">
                <strong className="block text-[14px] text-foreground">Ruling {String(termination.ruling)}</strong>
                <p className="mt-1 text-[13px] text-muted-foreground">{termination.reason}</p>
              </div>
            )}

            {/* Response form (non-requester, response open) */}
            {isParty && !isRequester && responseOpen && (
              <div className="grid gap-3">
                <textarea
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-foreground text-[14px] min-h-[100px] resize-vertical"
                  maxLength={2000}
                  placeholder="Public response (may be empty if evidence is supplied)"
                  value={responseStatement}
                  onChange={event => setResponseStatement(event.target.value)}
                />
                <textarea
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-foreground text-[14px] min-h-[100px] resize-vertical"
                  placeholder="Public HTTPS evidence URLs, one per line (max 5)"
                  value={responseUrls}
                  onChange={event => setResponseUrls(event.target.value)}
                />
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-black transition-all duration-200 hover:bg-foreground"
                  onClick={() => transact("respond_to_termination", [id, responseStatement.trim(), parseUrls(responseUrls)])}
                >
                  Submit one-time response
                </button>
              </div>
            )}

            {/* Adjudicate button */}
            {isParty && adjudicationReady && (
              <button
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-destructive/30 bg-destructive/10 px-5 py-2.5 text-[13px] font-medium text-destructive transition-all duration-200 hover:bg-destructive/20"
                onClick={() => transact("adjudicate_termination", [id])}
              >
                Ask GenLayer to adjudicate
              </button>
            )}
          </GlassCard>
        )}

        {/* Error */}
        {error && <p className="text-[13px] text-destructive">{error}</p>}

        {/* TxProgress */}
        {!modalActive && <TxProgress stage={stage} hash={hash} monitoringDelayed={monitoringDelayed} />}
      </aside>
    </div>
  </>;
}
