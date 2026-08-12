import { campaignStatus, demandStatus } from "@/lib/format";

export function CampaignStatus({ status }: { status: number }) {
  const tone = status === 2 ? "active" : status === 4 ? "passed" : "waiting";
  return <span className={`badge ${tone}`}>{campaignStatus(status).toUpperCase()}</span>;
}

export function DemandStatus({ status }: { status: number }) {
  const tone = status === 3 ? "passed" : status === 1 || status === 2 ? "active" : "waiting";
  return <span className={`badge ${tone}`}>{demandStatus(status).toUpperCase()}</span>;
}
