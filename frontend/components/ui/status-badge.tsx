import { campaignStatus, demandStatus } from "@/lib/format";

export function CampaignStatus({ status }: { status: number }) {
  const tone =
    status === 2
      ? "border-green/30 text-green"
      : status === 4
        ? "border-foreground/20 text-foreground"
        : status === 5
          ? "border-destructive/30 text-destructive"
          : "border-amber/30 text-amber";
  const dot =
    status === 2
      ? "bg-green"
      : status === 4
        ? "bg-foreground"
        : status === 5
          ? "bg-destructive"
          : "bg-amber";
  const pulse = status === 2 || status === 3;
  return (
    <span
      className={`inline-flex w-max items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] ${tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot} ${pulse ? "horkios-pulse" : ""}`} />
      {campaignStatus(status).toUpperCase()}
    </span>
  );
}

export function DemandStatus({ status }: { status: number }) {
  const tone =
    status === 3
      ? "border-foreground/20 text-foreground"
      : status === 1 || status === 2
        ? "border-green/30 text-green"
        : status === 4
          ? "border-destructive/30 text-destructive"
          : "border-amber/30 text-amber";
  const dot =
    status === 3
      ? "bg-foreground"
      : status === 1 || status === 2
        ? "bg-green"
        : status === 4
          ? "bg-destructive"
          : "bg-amber";
  const pulse = status === 1 || status === 2;
  return (
    <span
      className={`inline-flex w-max items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] ${tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot} ${pulse ? "horkios-pulse" : ""}`} />
      {demandStatus(status).toUpperCase()}
    </span>
  );
}
