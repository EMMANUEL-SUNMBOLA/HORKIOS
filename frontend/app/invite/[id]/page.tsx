"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TxProgress } from "@/components/tx-progress";
import { formatDate, formatGen, truncateAddress } from "@/lib/format";
import { readInviteFragment } from "@/lib/invite";
import { readCampaign, requireContract, waitAccepted, waitFinalized, writeClient } from "@/lib/contract";
import { useWallet } from "@/lib/wallet";
import type { TxStage } from "@/lib/types";
import type { Hash } from "genlayer-js/types";

export default function InvitePage() {
  const params = useParams<{ id: string }>(); const router = useRouter(); const id = Number(params.id);
  const { address, connect, ensureNetwork } = useWallet();
  const [secret] = useState<string | null>(() => readInviteFragment());
  const [accepted, setAccepted] = useState<boolean[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [stage, setStage] = useState<TxStage>("idle");
  const [hash, setHash] = useState<string>(); const [error, setError] = useState<string>();
  const query = useQuery({ queryKey: ["campaign", id], queryFn: () => readCampaign(id) });

  async function review() {
    if (!secret) { setError("This invitation link is missing its secret fragment"); return; }
    if (!address) { await connect(); return; }
    try {
      await ensureNetwork(); setStage("signing");
      const reviews = campaign!.demands.map((_, index) => accepted[index] ?? true);
      const proposed = campaign!.demands.map((demand, index) => reviews[index] ? 0 : Math.floor(new Date(dates[index] ?? new Date(Number(demand.original_deadline) * 1000).toISOString().slice(0, 16)).getTime() / 1000));
      const txHash = await writeClient(address).writeContract({ address: requireContract(), functionName: "review_campaign", args: [id, secret, reviews, proposed], value: 0n });
      setHash(txHash); setStage("submitted"); await waitAccepted(txHash as Hash); setStage("accepted"); await waitFinalized(txHash as Hash); setStage("finalized"); router.push(`/campaign/${id}`);
    } catch (caught) { setStage("error"); setError(caught instanceof Error ? caught.message : "Review failed"); }
  }

  const campaign = query.data;
  if (query.isLoading) return <div className="empty">Opening private invitation…</div>;
  if (!campaign) return <div className="empty error">Invitation campaign not found.</div>;
  return <>
    <div className="page-head"><div><div className="eyebrow">Private invitation · Oath #{id}</div><h1 className="page-title">You have been invited to swear an oath.</h1><p className="muted">Creator {truncateAddress(campaign.creator)} · @{campaign.x_account} · expires {formatDate(campaign.acceptance_deadline)}</p></div></div>
    {!secret && <div className="notice">The invitation secret is missing. Ask the creator for the complete link.</div>}
    <div className="grid">
      <section className="stack">
        {campaign.demands.map((demand, index) => <article className="card demand" key={index}>
          <div className="demand-head"><strong>Demand {index + 1} of {campaign.demands.length}</strong><strong>{formatGen(demand.allocation)} gross</strong></div>
          <p>{demand.instructions}</p><div className="metrics"><span className="metric">Views ≥ {String(demand.min_views)}</span><span className="metric">Likes ≥ {String(demand.min_likes)}</span><span className="metric">Due {formatDate(demand.original_deadline)}</span></div>
          <label><input type="radio" name={`review-${index}`} checked={accepted[index] ?? true} onChange={() => setAccepted(values => { const next = [...values]; next[index] = true; return next; })} /> Accept this demand</label>
          <label><input type="radio" name={`review-${index}`} checked={accepted[index] === false} onChange={() => setAccepted(values => { const next = [...values]; next[index] = false; return next; })} /> Propose a later deadline</label>
          {accepted[index] === false && <input className="input" type="datetime-local" value={dates[index] ?? new Date(Number(demand.original_deadline) * 1000).toISOString().slice(0, 16)} onChange={event => setDates(values => { const next = [...values]; next[index] = event.target.value; return next; })} />}
        </article>)}
      </section>
      <aside className="stack sticky"><div className="card stack"><h2>Before you sign</h2><div className="notice">Terms, wallet addresses, evidence, and decisions are public.</div><div className="summary-row"><span>Gross compensation</span><strong>{formatGen(campaign.original_escrow)}</strong></div><button className="button bronze" disabled={!secret} onClick={review}>{address ? accepted.every(Boolean) ? "Swear to these terms" : "Send deadline proposal" : "Connect wallet"}</button>{error && <p className="error">{error}</p>}</div><TxProgress stage={stage} hash={hash} /></aside>
    </div>
  </>;
}
