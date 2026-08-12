"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { campaignDraftSchema } from "@/lib/validation";
import { formatGen, parseGen, unixSeconds } from "@/lib/format";
import { inviteCommitment, randomInviteSecret } from "@/lib/invite";
import { readClient, requireContract, waitAccepted, waitFinalized, writeClient } from "@/lib/contract";
import { useWallet } from "@/lib/wallet";
import type { CampaignDraft, DemandDraft, TxStage } from "@/lib/types";
import type { Hash } from "genlayer-js/types";
import { TxProgress } from "@/components/tx-progress";

const tomorrow = (days: number) => {
  const date = new Date(Date.now() + days * 86_400_000);
  date.setMinutes(0, 0, 0);
  return date.toISOString().slice(0, 16);
};

const newDemand = (weightBps = 10_000): DemandDraft => ({
  instructions: "", weightBps, deadline: tomorrow(7), minViews: 0, minLikes: 0, minReposts: 0,
});

export default function CreatePage() {
  const { address, connect, ensureNetwork } = useWallet();
  const [draft, setDraft] = useState<CampaignDraft>({
    title: "", description: "", xAccount: "", acceptanceDeadline: tomorrow(2), escrowGen: "10", demands: [newDemand()],
  });
  const [stage, setStage] = useState<TxStage>("idle");
  const [hash, setHash] = useState<string>();
  const [error, setError] = useState<string>();
  const [invitation, setInvitation] = useState<string>();
  const weightTotal = useMemo(() => draft.demands.reduce((sum, demand) => sum + demand.weightBps, 0), [draft.demands]);

  const update = <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const updateDemand = (index: number, patch: Partial<DemandDraft>) => update("demands", draft.demands.map((demand, position) => position === index ? { ...demand, ...patch } : demand));
  const addDemand = () => {
    if (draft.demands.length >= 10) return;
    update("demands", [...draft.demands, newDemand(0)]);
  };
  const removeDemand = (index: number) => update("demands", draft.demands.filter((_, position) => position !== index));

  async function submit() {
    setError(undefined); setInvitation(undefined);
    const parsed = campaignDraftSchema.safeParse(draft);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Review the campaign details"); return; }
    if (!address) { await connect(); return; }
    const secret = randomInviteSecret();
    try {
      await ensureNetwork();
      setStage("signing");
      const commitment = await inviteCommitment(secret);
      const client = writeClient(address);
      const txHash = await client.writeContract({
        address: requireContract(),
        functionName: "create_campaign",
        args: [
          draft.title.trim(), draft.description, draft.xAccount.toLowerCase().replace(/^@/, ""),
          unixSeconds(draft.acceptanceDeadline), commitment,
          draft.demands.map(item => item.instructions.trim()),
          draft.demands.map(item => item.weightBps),
          draft.demands.map(item => unixSeconds(item.deadline)),
          draft.demands.map(item => item.minViews), draft.demands.map(item => item.minLikes),
          draft.demands.map(item => item.minReposts),
        ],
        value: parseGen(draft.escrowGen),
      });
      setHash(txHash); setStage("submitted");
      await waitAccepted(txHash as Hash); setStage("accepted");
      await waitFinalized(txHash as Hash); setStage("finalized");
      const ids = await readClient.readContract({ address: requireContract(), functionName: "get_creator_campaign_ids", args: [address, 0, 50] }) as Array<number | bigint>;
      const campaignId = Number(ids.at(-1));
      setInvitation(`${window.location.origin}/invite/${campaignId}#invite=${secret}`);
    } catch (caught) {
      setStage("error"); setError(caught instanceof Error ? caught.message : "Campaign creation failed");
    }
  }

  return <>
    <div className="page-head"><div><div className="eyebrow">Creator workspace</div><h1 className="page-title">Create an oath</h1></div></div>
    <div className="grid">
      <section className="stack">
        <div className="card stack">
          <h2>1. Campaign basics</h2>
          <div className="notice">Every term, reason, and submitted proof is public and permanent.</div>
          <div className="field"><label htmlFor="title">Campaign title</label><input id="title" className="input" maxLength={120} value={draft.title} onChange={event => update("title", event.target.value)} /></div>
          <div className="field"><label htmlFor="description">Public description</label><textarea id="description" className="textarea" maxLength={2000} value={draft.description} onChange={event => update("description", event.target.value)} /></div>
          <div className="field-row">
            <div className="field"><label htmlFor="account">Expected X account</label><input id="account" className="input" placeholder="@handle" value={draft.xAccount} onChange={event => update("xAccount", event.target.value)} /></div>
            <div className="field"><label htmlFor="acceptance">Invitation expires</label><input id="acceptance" className="input" type="datetime-local" value={draft.acceptanceDeadline} onChange={event => update("acceptanceDeadline", event.target.value)} /></div>
            <div className="field"><label htmlFor="escrow">Escrow (GEN)</label><input id="escrow" className="input" inputMode="decimal" value={draft.escrowGen} onChange={event => update("escrowGen", event.target.value)} /></div>
          </div>
        </div>
        <div className="stack">
          <div className="demand-head"><h2>2. Demands</h2><span className={weightTotal === 10_000 ? "success" : "error"}>{(weightTotal / 100).toFixed(2)}% allocated</span></div>
          {draft.demands.map((demand, index) => <article className="card demand" key={index}>
            <div className="demand-head"><strong>Demand {index + 1}</strong>{draft.demands.length > 1 && <button className="button secondary" onClick={() => removeDemand(index)}>Remove</button>}</div>
            <div className="field"><label htmlFor={`instructions-${index}`}>Required content</label><textarea id={`instructions-${index}`} className="textarea" maxLength={1000} value={demand.instructions} onChange={event => updateDemand(index, { instructions: event.target.value })} /></div>
            <div className="field-row">
              <div className="field"><label>Weight (%)</label><input className="input" type="number" min="0.01" max="100" step="0.01" value={demand.weightBps / 100} onChange={event => updateDemand(index, { weightBps: Math.round(Number(event.target.value) * 100) })} /></div>
              <div className="field"><label>Deadline</label><input className="input" type="datetime-local" value={demand.deadline} onChange={event => updateDemand(index, { deadline: event.target.value })} /></div>
              <div className="field"><label>Minimum views</label><input className="input" type="number" min="0" value={demand.minViews} onChange={event => updateDemand(index, { minViews: Number(event.target.value) })} /></div>
            </div>
            <div className="field-row">
              <div className="field"><label>Minimum likes</label><input className="input" type="number" min="0" value={demand.minLikes} onChange={event => updateDemand(index, { minLikes: Number(event.target.value) })} /></div>
              <div className="field"><label>Minimum reposts</label><input className="input" type="number" min="0" value={demand.minReposts} onChange={event => updateDemand(index, { minReposts: Number(event.target.value) })} /></div>
            </div>
          </article>)}
          <button className="button secondary" disabled={draft.demands.length >= 10} onClick={addDemand}>Add demand</button>
        </div>
      </section>
      <aside className="stack sticky">
        <div className="card stack"><h2>Escrow summary</h2>
          <div className="summary-row"><span>Total</span><strong>{draft.escrowGen || "0"} GEN</strong></div>
          <div className="summary-row"><span>Demands</span><strong>{draft.demands.length}</strong></div>
          <div className="summary-row"><span>Platform fee</span><span>1% of payouts</span></div>
          <div className="summary-row"><span>Refund fee</span><span>0%</span></div>
          <div className="divider" />
          {draft.demands.map((demand, index) => <div className="summary-row" key={index}><span>Demand {index + 1}</span><span>{(() => { try { return formatGen(parseGen(draft.escrowGen || "0") * BigInt(demand.weightBps) / 10_000n); } catch { return "—"; } })()}</span></div>)}
          {error && <p className="error">{error}</p>}
          <button className="button bronze" onClick={submit}>{address ? "Fund and create oath" : "Connect wallet"}</button>
        </div>
        <TxProgress stage={stage} hash={hash} />
        {invitation && <div className="card stack"><div className="success">Your oath is funded.</div><input className="input mono" readOnly value={invitation} /><button className="button" onClick={() => navigator.clipboard.writeText(invitation)}>Copy invitation</button><p className="muted">Anyone with this secret can bind the KOL wallet. HORKIOS cannot recover it.</p><Link className="button secondary" href={invitation}>Open invitation</Link></div>}
      </aside>
    </div>
  </>;
}
