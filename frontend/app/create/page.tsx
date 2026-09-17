"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { campaignDraftSchema } from "@/lib/validation";
import { formatGen, parseGen, unixSeconds } from "@/lib/format";
import { inviteCommitment, randomInviteSecret } from "@/lib/invite";
import {
  assertContractConfig,
  assertFunded,
  contractAddress,
  findCampaignByInviteHash,
  networkName,
  requireContract,
  TransactionStatusUnavailableError,
  UndeterminedTransactionError,
  waitForOutcome,
  writeClient,
} from "@/lib/contract";
import {
  clearPendingCreate,
  loadPendingCreate,
  savePendingCreate,
  type PendingCreate,
} from "@/lib/pending-create";
import { useWallet } from "@/lib/wallet";
import type { CampaignDraft, DemandDraft, TxStage } from "@/lib/types";
import type { Hash } from "genlayer-js/types";
import { TxProgress } from "@/components/ui/tx-progress";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";
import { useModal } from "@/components/modal";

const tomorrow = (days: number) => {
  const date = new Date(Date.now() + days * 86_400_000);
  date.setMinutes(0, 0, 0);
  return date.toISOString().slice(0, 16);
};

const newDemand = (weightBps = 10_000): DemandDraft => ({
  instructions: "",
  weightBps,
  deadline: tomorrow(7),
});

export default function CreatePage() {
  const { address, connect, ensureNetwork } = useWallet();
  const { showModal, hideModal } = useModal();
  const [draft, setDraft] = useState<CampaignDraft>({
    title: "",
    description: "",
    xAccount: "",
    acceptanceDeadline: tomorrow(2),
    escrowGen: "10",
    demands: [newDemand()],
  });
  const [stage, setStage] = useState<TxStage>("idle");
  const [hash, setHash] = useState<string>();
  const [error, setError] = useState<string>();
  const [invitation, setInvitation] = useState<string>();
  const [monitoringDelayed, setMonitoringDelayed] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const recovering = useRef(false);
  const weightTotal = useMemo(
    () => draft.demands.reduce((sum, demand) => sum + demand.weightBps, 0),
    [draft.demands],
  );

  const update = <K extends keyof CampaignDraft>(
    key: K,
    value: CampaignDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  const updateDemand = (index: number, patch: Partial<DemandDraft>) =>
    update(
      "demands",
      draft.demands.map((demand, position) =>
        position === index ? { ...demand, ...patch } : demand,
      ),
    );
  const addDemand = () => {
    if (draft.demands.length >= 10) return;
    update("demands", [...draft.demands, newDemand(0)]);
  };
  const removeDemand = (index: number) =>
    update(
      "demands",
      draft.demands.filter((_, position) => position !== index),
    );

  async function monitorPending(pending: PendingCreate) {
    if (!pending.txHash) return;
    setHash(pending.txHash);
    setStage("submitted");
    try {
      await waitForOutcome(pending.txHash as Hash, {
        onAccepted: () => setStage("accepted"),
        onMonitoringDelay: setMonitoringDelayed,
      });
      setStage("finalized");
      const campaignId = await findCampaignByInviteHash(
        pending.creator,
        pending.inviteHash,
      );
      setInvitation(
        `${window.location.origin}/invite/${campaignId}#invite=${pending.secret}`,
      );
    } catch (caught) {
      setStage(
        caught instanceof UndeterminedTransactionError
          ? "undetermined"
          : caught instanceof TransactionStatusUnavailableError
            ? "status_unavailable"
            : "error",
      );
      setError(
        caught instanceof Error ? caught.message : "Campaign creation failed",
      );
    }
  }

  useEffect(() => {
    if (!address || !contractAddress || recovering.current) return;
    const pending = loadPendingCreate(networkName, contractAddress, address);
    if (!pending?.txHash) return;
    recovering.current = true;
    queueMicrotask(() => {
      void monitorPending(pending).finally(() => {
        recovering.current = false;
      });
    });
  }, [address]);

  async function submit() {
    setError(undefined);
    setInvitation(undefined);
    setStage("idle");
    setModalActive(false);
    const parsed = campaignDraftSchema.safeParse(draft);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message || "Review the campaign details",
      );
      return;
    }
    if (!address) {
      await connect();
      return;
    }
    const secret = randomInviteSecret();
    setModalActive(true);
    try {
      await ensureNetwork();
      const commitment = await inviteCommitment(secret);
      const pending: PendingCreate = {
        version: 1,
        network: networkName,
        contract: requireContract(),
        creator: address,
        secret,
        inviteHash: commitment,
        acceptanceDeadline: unixSeconds(draft.acceptanceDeadline),
        createdAt: Date.now(),
      };
      savePendingCreate(pending);
      const escrow = parseGen(draft.escrowGen);
      await assertContractConfig();
      await assertFunded(address, escrow);
      const client = writeClient(address);
      setStage("signing");
      const txHash = await client.writeContract({
        address: requireContract(),
        functionName: "create_campaign",
        args: [
          draft.title.trim(),
          draft.description,
          draft.xAccount.toLowerCase().replace(/^@/, ""),
          unixSeconds(draft.acceptanceDeadline),
          commitment,
          draft.demands.map((item) => item.instructions.trim()),
          draft.demands.map((item) => item.weightBps),
          draft.demands.map((item) => unixSeconds(item.deadline)),
          draft.demands.map(() => 0),
          draft.demands.map(() => 0),
          draft.demands.map(() => 0),
        ],
        value: escrow,
      });
      pending.txHash = txHash;
      savePendingCreate(pending);
      setHash(txHash);
      setStage("submitted");
      await waitForOutcome(txHash as Hash, {
        onAccepted: () => setStage("accepted"),
        onMonitoringDelay: setMonitoringDelayed,
      });
      setStage("finalized");
      const campaignId = await findCampaignByInviteHash(address, commitment);
      setInvitation(
        `${window.location.origin}/invite/${campaignId}#invite=${secret}`,
      );
    } catch (caught) {
      setStage(
        caught instanceof UndeterminedTransactionError
          ? "undetermined"
          : caught instanceof TransactionStatusUnavailableError
            ? "status_unavailable"
            : "error",
      );
      setError(
        caught instanceof Error ? caught.message : "Campaign creation failed",
      );
    }
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
      <>
        <TxProgress
          stage={stage}
          hash={hash}
          monitoringDelayed={monitoringDelayed}
          onDismiss={dismissModal}
          onResume={() => {
            if (address && contractAddress) {
              const pending = loadPendingCreate(
                networkName,
                contractAddress,
                address,
              );
              if (pending) void monitorPending(pending);
            }
          }}
        />
        {invitation && (
          <div className="glass grid gap-4 rounded-2xl p-6">
            <div className="text-green font-medium">Your oath is funded.</div>
            <input
              className="glass-input w-full rounded-full px-4 py-2.5 text-foreground font-mono text-[13px] tabular-nums"
              readOnly
              value={invitation}
            />
            <div className="flex gap-2">
              <button
                className="glass-input rounded-full px-5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]"
                onClick={async () => {
                  await navigator.clipboard.writeText(invitation);
                  if (address && contractAddress) {
                    const pending = loadPendingCreate(
                      networkName,
                      contractAddress,
                      address,
                    );
                    if (pending) clearPendingCreate(pending);
                  }
                }}
              >
                Copy invitation
              </button>
              <Link
                className="glass-input inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]"
                href={invitation}
              >
                Open invitation
              </Link>
            </div>
            <p className="text-muted-foreground text-[13px] leading-relaxed">
              Anyone with this secret can bind the KOL wallet. HORKIOS cannot
              recover it.
            </p>
          </div>
        )}
      </>
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showModal/hideModal are stable from context
  }, [modalActive, stage, hash, monitoringDelayed, invitation]);

  return (
    <>
      <div className="mb-12 flex items-end justify-between gap-8 max-[900px]:flex-col max-[900px]:items-start">
        <div>
          <SectionLabel label="Creator Workspace" className="mb-6" />
          <h1 className="font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-foreground sm:text-[42px]">
            Create an oath
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6 items-start max-[900px]:grid-cols-1">
        <section className="grid gap-4">
          {/* Campaign basics */}
          <GlassCard className="p-6">
            <h2 className="mt-0 mb-4 font-display text-[18px] font-semibold tracking-[-0.02em] text-foreground">
              1. Campaign Overview
            </h2>
            <div className="glass-inner rounded-xl border-l-[3px] border-l-primary p-3 text-[13px] leading-[1.5] text-muted-foreground">
              Every term, reason, and submitted proof is public and permanent.
            </div>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-1.5">
                <label className="section-label text-[10px]" htmlFor="title">
                  <span className="section-label-slash">/</span>
                  <span className="ml-1">Campaign title</span>
                </label>
                <input
                  id="title"
                  className="glass-input w-full rounded-full px-4 py-2.5 text-foreground text-[14px]"
                  maxLength={120}
                  value={draft.title}
                  onChange={(event) => update("title", event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <label
                  className="section-label text-[10px]"
                  htmlFor="description"
                >
                  <span className="section-label-slash">/</span>
                  <span className="ml-1">Public description</span>
                </label>
                <textarea
                  id="description"
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-foreground text-[14px] min-h-[100px] resize-vertical"
                  maxLength={2000}
                  value={draft.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                />
              </div>
              <div className="flex lg:flex-row flex-col gap-2">
                <div className="grid gap-1.5">
                  <label
                    className="section-label text-[10px]"
                    htmlFor="account"
                  >
                    <span className="section-label-slash">/</span>
                    <span className="ml-1">Expected X account</span>
                  </label>
                  <input
                    id="account"
                    className="glass-input w-full rounded-full px-4 py-2.5 text-foreground text-[14px]"
                    placeholder="@handle"
                    value={draft.xAccount}
                    onChange={(event) => update("xAccount", event.target.value)}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label
                    className="section-label text-[10px]"
                    htmlFor="acceptance"
                  >
                    <span className="section-label-slash">/</span>
                    <span className="ml-1">Invitation expires</span>
                  </label>
                  <input
                    id="acceptance"
                    className="glass-input w-full rounded-full px-4 py-2.5 text-foreground text-[14px]"
                    type="datetime-local"
                    value={draft.acceptanceDeadline}
                    onChange={(event) =>
                      update("acceptanceDeadline", event.target.value)
                    }
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="section-label text-[10px]" htmlFor="escrow">
                    <span className="section-label-slash">/</span>
                    <span className="ml-1">Escrow (GEN)</span>
                  </label>
                  <input
                    id="escrow"
                    className="glass-input w-full rounded-full px-4 py-2.5 text-foreground text-[14px]"
                    inputMode="decimal"
                    value={draft.escrowGen}
                    onChange={(event) =>
                      update("escrowGen", event.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Demands */}
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3.5">
              <h2 className="mt-0 font-display text-[18px] font-semibold tracking-[-0.02em] text-foreground">
                2. Demands
              </h2>
              <span
                className={`font-mono text-[11px] uppercase tracking-[0.16em] ${weightTotal === 10_000 ? "text-green" : "text-destructive"}`}
              >
                {(weightTotal / 100).toFixed(2)}% allocated
              </span>
            </div>
            {draft.demands.map((demand, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex items-center justify-between gap-3.5 mb-4">
                  <strong className="font-display text-[14px] font-medium text-foreground">
                    Demand {index + 1}
                  </strong>
                  {draft.demands.length > 1 && (
                    <button
                      className="glass-input rounded-full px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]"
                      onClick={() => removeDemand(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <label
                      className="section-label text-[10px]"
                      htmlFor={`instructions-${index}`}
                    >
                      <span className="section-label-slash">/</span>
                      <span className="ml-1">Required content</span>
                    </label>
                    <textarea
                      id={`instructions-${index}`}
                      className="glass-input w-full rounded-xl px-4 py-2.5 text-foreground text-[14px] min-h-[100px] resize-vertical"
                      maxLength={1000}
                      value={demand.instructions}
                      onChange={(event) =>
                        updateDemand(index, {
                          instructions: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex lg:flex-row flex-col gap-2">
                    <div className="grid gap-1.5">
                      <label className="section-label text-[10px]">
                        <span className="section-label-slash">/</span>
                        <span className="ml-1">Weight (%)</span>
                      </label>
                      <input
                        className="glass-input w-full rounded-full px-4 py-2.5 text-foreground text-[14px]"
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={demand.weightBps / 100}
                        onChange={(event) => {
                          const raw = Number(event.target.value);
                          if (Number.isNaN(raw)) return;
                          const clamped = Math.min(Math.max(Math.round(raw * 100), 1), 10_000);
                          updateDemand(index, { weightBps: clamped });
                        }}
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label className="section-label text-[10px]">
                        <span className="section-label-slash">/</span>
                        <span className="ml-1">Deadline</span>
                      </label>
                      <input
                        className="glass-input w-full rounded-full px-4 py-2.5 text-foreground text-[14px]"
                        type="datetime-local"
                        value={demand.deadline}
                        onChange={(event) =>
                          updateDemand(index, { deadline: event.target.value })
                        }
                      />
                    </div>

                  </div>
                </div>
              </GlassCard>
            ))}
            <button
              className="glass-input inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]"
              disabled={draft.demands.length >= 10}
              onClick={addDemand}
            >
              Add new demand
            </button>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="grid gap-4 max-[900px]:static sticky top-[88px]">
          <GlassCard className="p-6">
            <h2 className="mt-0 mb-4 font-display text-[18px] font-semibold tracking-[-0.02em] text-foreground">
              Escrow summary
            </h2>
            <div className="grid gap-2">
              <div className="flex justify-between gap-4 py-2 text-[14px] text-muted-foreground">
                <span>Total</span>
                <strong className="font-mono font-medium text-foreground">
                  {draft.escrowGen || "0"} GEN
                </strong>
              </div>
              <div className="flex justify-between gap-4 py-2 text-[14px] text-muted-foreground">
                <span>Demands</span>
                <strong className="font-mono font-medium text-foreground">
                  {draft.demands.length}
                </strong>
              </div>
              <div className="flex justify-between gap-4 py-2 text-[14px] text-muted-foreground">
                <span>Platform fee</span>
                <span className="text-muted-foreground">1% of payouts</span>
              </div>
              <div className="flex justify-between gap-4 py-2 text-[14px] text-muted-foreground">
                <span>Refund fee</span>
                <span className="text-muted-foreground">0%</span>
              </div>
              <div className="h-px bg-border/50 my-1" />
              <div className="flex justify-between gap-4 py-2 text-[14px]">
                <span className={weightTotal === 10_000 ? "text-muted-foreground" : "text-destructive"}>
                  Weight total
                </span>
                <strong className={`font-mono font-medium ${weightTotal === 10_000 ? "text-foreground" : "text-destructive"}`}>
                  {(weightTotal / 100).toFixed(weightTotal % 100 === 0 ? 0 : 2)}%
                </strong>
              </div>
              {weightTotal !== 10_000 && (
                <p className="text-[12px] text-destructive">
                  Weights must total 100%
                </p>
              )}
              {draft.demands.map((demand, index) => (
                <div
                  className="flex justify-between gap-4 py-2 text-[14px] text-muted-foreground"
                  key={index}
                >
                  <span>Demand {index + 1}</span>
                  <span className="font-mono text-[13px] tabular-nums text-foreground">
                    {(() => {
                      try {
                        return formatGen(
                          (parseGen(draft.escrowGen || "0") *
                            BigInt(demand.weightBps)) /
                            10_000n,
                        );
                      } catch {
                        return "—";
                      }
                    })()}
                  </span>
                </div>
              ))}
            </div>
            {error && (
              <p className="mt-4 text-[13px] text-destructive">{error}</p>
            )}
            <button
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-primary transition-all duration-200 hover:bg-primary border hover:text-white disabled:opacity-40 disabled:pointer-events-none"
              onClick={submit}
              disabled={weightTotal !== 10_000}
            >
              {address ? "Fund and create oath" : "Connect wallet"}
            </button>
          </GlassCard>

          {!modalActive && (
            <TxProgress
              stage={stage}
              hash={hash}
              monitoringDelayed={monitoringDelayed}
              onResume={() => {
                if (address && contractAddress) {
                  const pending = loadPendingCreate(
                    networkName,
                    contractAddress,
                    address,
                  );
                  if (pending) void monitorPending(pending);
                }
              }}
            />
          )}

          {!modalActive && invitation && (
            <GlassCard className="p-6">
              <div className="text-green font-medium mb-4">
                Your oath is funded.
              </div>
              <input
                className="glass-input w-full rounded-full px-4 py-2.5 text-foreground font-mono text-[13px] tabular-nums mb-4"
                readOnly
                value={invitation}
              />
              <button
                className="glass-input inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]"
                onClick={async () => {
                  await navigator.clipboard.writeText(invitation);
                  if (address && contractAddress) {
                    const pending = loadPendingCreate(
                      networkName,
                      contractAddress,
                      address,
                    );
                    if (pending) clearPendingCreate(pending);
                  }
                }}
              >
                Copy invitation
              </button>
              <p className="mt-4 text-muted-foreground text-[13px] leading-relaxed">
                Anyone with this secret can bind the KOL wallet. HORKIOS cannot
                recover it.
              </p>
              <Link
                className="glass-input mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]"
                href={invitation}
              >
                Open invitation
              </Link>
            </GlassCard>
          )}
        </aside>
      </div>
    </>
  );
}
