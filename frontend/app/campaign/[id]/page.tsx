"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CampaignStatus, DemandStatus } from "@/components/status-badge";
import { TxProgress } from "@/components/tx-progress";
import { canonicalXUrl } from "@/lib/validation";
import { formatDate, formatGen, truncateAddress } from "@/lib/format";
import { readCampaign, requireContract, UndeterminedTransactionError, waitForOutcome, writeClient } from "@/lib/contract";
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

  async function transact(functionName: string, args: CalldataEncodable[]) {
    setError(undefined);
    if (confirmations[functionName] && !window.confirm(confirmations[functionName])) return;
    if (!address) { await connect(); return; }
    try {
      await ensureNetwork(); setStage("signing");
      const txHash = await writeClient(address).writeContract({ address: requireContract(), functionName, args, value: 0n });
      setHash(txHash); setStage("submitted");
      const usesConsensus = ["verify_demand", "finalize_expired_demand", "adjudicate_termination"].includes(functionName);
      await waitForOutcome(txHash as Hash, () => setStage(usesConsensus ? "evaluating" : "accepted")); setStage("finalized");
      await queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    } catch (caught) { setStage(caught instanceof UndeterminedTransactionError ? "undetermined" : "error"); setError(caught instanceof Error ? caught.message : "Transaction failed"); }
  }

  if (campaignQuery.isLoading) return <div className="empty">Reading oath from GenLayer…</div>;
  if (campaignQuery.error || !campaign) return <div className="empty error">This oath could not be loaded. Check the contract configuration and campaign ID.</div>;
  const isKol = address?.toLowerCase() === campaign.kol.toLowerCase();
  const isCreator = address?.toLowerCase() === campaign.creator.toLowerCase();
  const isParty = isKol || isCreator;
  const termination = campaign.termination;
  const isRequester = address?.toLowerCase() === termination.requester?.toLowerCase();
  const responseOpen = Number(campaign.status) === 3 && Number(termination.status) === 1 && nowSeconds <= Number(termination.response_deadline);
  const adjudicationReady = Number(campaign.status) === 3 && [1, 2].includes(Number(termination.status)) && nowSeconds > Number(termination.response_deadline);

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
          {isParty && Number(demand.status) === 2 && nowSeconds <= Number(demand.active_deadline) && <button className="button bronze" onClick={() => transact("verify_demand", [id, index])}>Ask GenLayer to verify</button>}
          {isParty && [1, 2].includes(Number(demand.status)) && nowSeconds > Number(demand.active_deadline) && <button className="button danger" onClick={() => transact("finalize_expired_demand", [id, index])}>Run final expired check</button>}
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
        {[0, 1].includes(Number(campaign.status)) && nowSeconds > Number(campaign.acceptance_deadline) && <button className="button danger" onClick={() => transact("expire_unaccepted_campaign", [id])}>Expire invitation and refund</button>}
        {isParty && Number(campaign.status) === 2 && <div className="card stack"><h2>Request termination</h2><p className="muted">Past payouts remain final. Your statement and public evidence are permanent.</p><select className="select" value={terminationCategory} onChange={event => setTerminationCategory(event.target.value)}><option value="external_hardship">External hardship</option><option value="kol_breach">KOL breach or abandonment</option><option value="other">Other</option></select><textarea className="textarea" maxLength={2000} placeholder="Public statement" value={terminationStatement} onChange={event => setTerminationStatement(event.target.value)} /><textarea className="textarea" placeholder="Public HTTPS evidence URLs, one per line (max 5)" value={terminationUrls} onChange={event => setTerminationUrls(event.target.value)} /><button className="button danger" disabled={!terminationStatement.trim()} onClick={() => transact("request_termination", [id, terminationCategory, terminationStatement.trim(), parseUrls(terminationUrls)])}>Open 48-hour termination case</button></div>}
        {Number(campaign.status) === 3 && <div className="card stack"><h2>Termination case</h2><div className="summary-row"><span>Category</span><strong>{termination.category.replaceAll("_", " ")}</strong></div><p>{termination.statement}</p><p className="muted">Response deadline: {formatDate(termination.response_deadline)}</p>{termination.respondent_statement && <div className="notice"><strong>Response</strong><p>{termination.respondent_statement}</p></div>}{termination.reason && <div className="notice"><strong>Ruling {String(termination.ruling)}</strong><p>{termination.reason}</p></div>}{isParty && !isRequester && responseOpen && <><textarea className="textarea" maxLength={2000} placeholder="Public response (may be empty if evidence is supplied)" value={responseStatement} onChange={event => setResponseStatement(event.target.value)} /><textarea className="textarea" placeholder="Public HTTPS evidence URLs, one per line (max 5)" value={responseUrls} onChange={event => setResponseUrls(event.target.value)} /><button className="button bronze" onClick={() => transact("respond_to_termination", [id, responseStatement.trim(), parseUrls(responseUrls)])}>Submit one-time response</button></>}{isParty && adjudicationReady && <button className="button danger" onClick={() => transact("adjudicate_termination", [id])}>Ask GenLayer to adjudicate</button>}</div>}
        {error && <p className="error">{error}</p>}
        <TxProgress stage={stage} hash={hash} />
      </aside>
    </div>
  </>;
}
