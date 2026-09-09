import Link from "next/link";
import { CampaignStatus } from "@/components/ui/status-badge";
import { GlassCard } from "@/components/ui/glass-card";
import { formatGen } from "@/lib/format";
import type { Campaign } from "@/lib/types";

type OathTableProps = {
  campaigns: Campaign[];
  ids: number[];
};

export function OathTable({ campaigns, ids }: OathTableProps) {
  return (
    <GlassCard className="overflow-hidden p-0">
      {/* Header */}
      <div className="grid grid-cols-[2.1fr_1fr_0.8fr_1fr_40px] items-center min-h-[40px] gap-5 border-b border-glass-border-subtle bg-white/[0.04] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ash max-[900px]:grid-cols-[2fr_1fr_40px] max-[900px]:gap-2 max-[900px]:px-3">
        <span>Oath</span>
        <span className="max-[900px]:hidden">Account</span>
        <span className="max-[900px]:hidden">Status</span>
        <span className="max-[900px]:hidden">Locked</span>
        <span>Open</span>
      </div>

      {/* Rows */}
      {campaigns.map((campaign, i) => (
        <Link
          href={`/campaign/${ids[i]}`}
          key={ids[i]}
          className="grid grid-cols-[2.1fr_1fr_0.8fr_1fr_40px] items-center min-h-[72px] gap-5 border-b border-glass-border-subtle px-5 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.04] max-[900px]:grid-cols-[2fr_1fr_40px] max-[900px]:gap-2 max-[900px]:px-3"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <span className="font-mono text-[11px] text-copper">
              #{String(ids[i]).padStart(3, "0")}
            </span>
            <strong className="truncate font-display text-[14px] font-medium text-bone">
              {campaign.title}
            </strong>
          </div>
          <span className="font-mono text-[13px] text-ash max-[900px]:hidden">
            @{campaign.x_account}
          </span>
          <span className="max-[900px]:hidden">
            <CampaignStatus status={Number(campaign.status)} />
          </span>
          <strong className="font-mono text-[14px] font-medium tabular-nums text-bone max-[900px]:hidden">
            {formatGen(campaign.locked_amount)}
          </strong>
          <span className="text-right text-ash">↗</span>
        </Link>
      ))}
    </GlassCard>
  );
}
