"use client";

import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { CampaignStatus } from "@/components/status-badge";
import { formatGen, truncateAddress } from "@/lib/format";
import { networkName, readCampaign, readClient, requireContract } from "@/lib/contract";
import { useWallet } from "@/lib/wallet";

export default function DashboardPage() {
  const { address, connect } = useWallet();
  const idsQuery = useQuery({
    queryKey: ["campaign-ids", address], enabled: Boolean(address),
    queryFn: async () => {
      const walletAddress = address;
      if (!walletAddress) throw new Error("Connect a wallet");
      const [creator, kol] = await Promise.all([
        readClient.readContract({ address: requireContract(), functionName: "get_creator_campaign_ids", args: [walletAddress, 0, 50] }),
        readClient.readContract({ address: requireContract(), functionName: "get_kol_campaign_ids", args: [walletAddress, 0, 50] }),
      ]) as [Array<number | bigint>, Array<number | bigint>];
      return [...new Set([...creator, ...kol].map(Number))].sort((a, b) => b - a);
    },
  });
  const campaigns = useQueries({ queries: (idsQuery.data || []).map(id => ({ queryKey: ["campaign", id], queryFn: () => readCampaign(id) })) });
  const loaded = campaigns.flatMap(query => query.data ? [query.data] : []);
  const locked = loaded.reduce((total, campaign) => total + BigInt(campaign.locked_amount), 0n);
  const active = loaded.filter(campaign => Number(campaign.status) === 2).length;

  return <div className="dashboard-page">
    <div className="page-head dashboard-head">
      <div><div className="eyebrow">Workspace / Oaths</div><h1 className="page-title">Your dashboard</h1><p className="muted">Track every promise, proof, and settlement from one public workspace.</p></div>
      <Link className="button primary" href="/create">Create new oath <span>↗</span></Link>
    </div>

    <section className="overview-grid" aria-label="Oath overview">
      <div className="overview-account"><span className="overview-label">CONNECTED ACCOUNT</span><strong>{address ? truncateAddress(address) : "NOT CONNECTED"}</strong><span className={`connection-state ${address ? "online" : ""}`}><i />{address ? `${networkName.toUpperCase()} · ONLINE` : "WALLET REQUIRED"}</span></div>
      <div className="overview-stat"><span className="overview-label">TOTAL OATHS</span><strong>{loaded.length.toString().padStart(2, "0")}</strong><small>Creator + KOL</small></div>
      <div className="overview-stat"><span className="overview-label">ACTIVE</span><strong>{active.toString().padStart(2, "0")}</strong><small>In progress</small></div>
      <div className="overview-stat"><span className="overview-label">LOCKED VALUE</span><strong>{address ? formatGen(locked).replace(" GEN", "") : "—"}</strong><small>GEN</small></div>
    </section>

    <div className="records-head"><div><span className="section-index">OATH RECORDS</span><h2>Recent activity</h2></div><span className="record-count">{loaded.length} RECORD{loaded.length === 1 ? "" : "S"}</span></div>

    {!address ? <div className="empty dashboard-empty"><div className="empty-symbol">◎</div><h2>Connect your working wallet.</h2><p>Use the account you act with as a creator or KOL to reveal its oath records.</p><button className="button primary" onClick={connect}>Connect wallet <span>↗</span></button></div>
      : idsQuery.isLoading ? <div className="empty"><span className="loading-dot" /> Reading campaign indexes from GenLayer…</div>
      : idsQuery.error ? <div className="empty error">Campaign records could not be loaded. Check the contract and network configuration.</div>
      : campaigns.length === 0 ? <div className="empty dashboard-empty"><div className="empty-symbol">◇</div><h2>No oaths yet.</h2><p>Your funded or accepted campaigns will appear here as permanent records.</p><Link className="button secondary" href="/create">Create your first oath</Link></div>
      : <div className="oath-table">
          <div className="oath-row oath-table-head"><span>OATH</span><span>ACCOUNT</span><span>STATUS</span><span>LOCKED</span><span>OPEN</span></div>
          {campaigns.map((query, index) => query.data && <Link href={`/campaign/${idsQuery.data![index]}`} className="oath-row" key={idsQuery.data![index]}>
            <div className="oath-name"><span>#{String(idsQuery.data![index]).padStart(3, "0")}</span><strong>{query.data.title}</strong></div><span className="mono muted">@{query.data.x_account}</span><CampaignStatus status={Number(query.data.status)} /><strong className="amount">{formatGen(query.data.locked_amount)}</strong><span className="row-arrow">↗</span>
          </Link>)}
        </div>}
  </div>;
}
