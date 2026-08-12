"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CampaignStatus, DemandStatus } from "@/components/status-badge";
import { TxProgress } from "@/components/tx-progress";
import { canonicalXUrl } from "@/lib/validation";
import { formatDate, formatGen, truncateAddress } from "@/lib/format";
import { readCampaign, requireContract, waitAccepted, waitFinalized, writeClient } from "@/lib/contract";
import { useWallet } from "@/lib/wallet";
import type { TxStage } from "@/lib/types";
import type { CalldataEncodable, Hash } from "genlayer-js/types";

export default function CampaignPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { address, connect, ensureNetwork } = useWallet();
  const [evidence, setEvidence] = useState<Record<number, string>>({});
  const [stage, setStage] = useState<TxStage>("idle");
  const [hash, setHash] = useState<string>();
  const [error, setError] = useState<string>();
  const [nowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const campaignQuery = useQuery({ queryKey: ["campaign", id], queryFn: () => readCampaign(id), enabled: Number.isInteger(id) && id >= 0 });
  const campaign = campaignQuery.data;

  async function transact(functionName: string, args: CalldataEncodable[]) {
    setError(undefined);
    if (!address) { await connect(); return; }
    try {
      await ensureNetwork(); setStage("signing");
      const txHash = await writeClient(address).writeContract({ address: requireContract(), functionName, args, value: 0n });
      setHash(txHash); setStage("submitted"); await waitAccepted(txHash as Hash); setStage("accepted"); await waitFinalized(txHash as Hash); setStage("finalized");
      await queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    } catch (caught) { setStage("error"); setError(caught instanceof Error ? caught.message : "Transaction failed"); }
  }

  if (campaignQuery.isLoading) return <div className="empty">Reading oath from GenLayer…</div>;
  if (campaignQuery.error || !campaign) return <div className="empty error">This oath could not be loaded. Check the contract configuration and campaign ID.</div>;
  const isKol = address?.toLowerCase() === campaign.kol.toLowerCase();
  const isCreator = address?.toLowerCase() === campaign.creator.toLowerCase();

  return <>
    <div className="page-head"><div><div className="eyebrow">Oath #{id}</div><h1 className="page-title">{campaign.title}</h1><p className="muted">@{campaign.x_account} · {truncateAddress(campaign.creator)} ↔ {truncateAddress(campaign.kol)}</p></div><CampaignStatus status={Number(campaign.status)} /></div>
    <div className="grid">
      <section className="stack">
        <div className="card"><p>{campaign.description || "No additional campaign description."}</p></div>
        {campaign.demands.map((demand, index) => <article className="card demand" key={index}>
          <div className="demand-head"><div><div className="eyebrow">Demand {index + 1}</div><h2>{formatGen(demand.allocation)}</h2></div><DemandStatus status={Number(demand.status)} /></div>
          <p>{demand.instructions}</p>
          <div className="metrics"><span className="metric">Views ≥ {String(demand.min_views)}</span><span className="metric">Likes ≥ {String(demand.min_likes)}</span><span className="metric">Reposts ≥ {String(demand.min_reposts)}</span><span className="metric">Due {formatDate(demand.active_deadline || demand.original_deadline)}</span></div>
          {demand.evidence_url && <a className="mono" href={demand.evidence_url} target="_blank" rel="noreferrer">{demand.evidence_url} ↗</a>}
          {demand.decision?.checked_at && Number(demand.decision.checked_at) > 0 && <div className="notice"><strong>{demand.decision.passed ? "Verification passed" : "Requirements not yet met"}</strong><p>{demand.decision.reason}</p><div className="metrics"><span className="metric">{String(demand.decision.observed_views)} views</span><span className="metric">{String(demand.decision.observed_likes)} likes</span><span className="metric">{String(demand.decision.observed_reposts)} reposts</span></div></div>}
          {isKol && [1, 2].includes(Number(demand.status)) && <div className="field"><label htmlFor={`evidence-${index}`}>Canonical X post URL</label><input id={`evidence-${index}`} className="input" value={evidence[index] || ""} onChange={event => setEvidence(current => ({ ...current, [index]: event.target.value }))} /><button className="button secondary" onClick={() => { try { return transact("submit_evidence", [id, index, canonicalXUrl(evidence[index] || "")]); } catch (caught) { setError(caught instanceof Error ? caught.message : "Invalid URL"); } }}>Submit or replace proof</button></div>}
          {(isKol || isCreator) && Number(demand.status) === 2 && <button className="button bronze" onClick={() => transact("verify_demand", [id, index])}>Ask GenLayer to verify</button>}
          {(isKol || isCreator) && [1, 2].includes(Number(demand.status)) && nowSeconds > Number(demand.active_deadline) && <button className="button danger" onClick={() => transact("finalize_expired_demand", [id, index])}>Run final expired check</button>}
        </article>)}
      </section>
      <aside className="stack sticky">
        <div className="card stack"><h2>Escrow</h2>
          <div className="summary-row"><span>Original</span><strong>{formatGen(campaign.original_escrow)}</strong></div>
          <div className="summary-row"><span>Locked</span><strong>{formatGen(campaign.locked_amount)}</strong></div>
          <div className="summary-row"><span>Gross paid</span><span>{formatGen(campaign.gross_paid)}</span></div>
          <div className="summary-row"><span>KOL received</span><span>{formatGen(campaign.net_paid)}</span></div>
          <div className="summary-row"><span>Platform fee</span><span>{formatGen(campaign.fees_paid)}</span></div>
          <div className="summary-row"><span>Refunded</span><span>{formatGen(campaign.refunded)}</span></div>
        </div>
        {isCreator && Number(campaign.status) === 1 && <div className="card stack"><h2>Deadline proposal</h2><button className="button bronze" onClick={() => transact("approve_counteroffer", [id])}>Approve all proposed dates</button><button className="button danger" onClick={() => transact("cancel_unaccepted_campaign", [id])}>Cancel and refund</button></div>}
        {isCreator && Number(campaign.status) === 0 && <button className="button danger" onClick={() => transact("cancel_unaccepted_campaign", [id])}>Cancel and refund</button>}
        {error && <p className="error">{error}</p>}
        <TxProgress stage={stage} hash={hash} />
      </aside>
    </div>
  </>;
}
