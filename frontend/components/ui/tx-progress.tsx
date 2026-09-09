import type { TxStage } from "@/lib/types";
import { GlassCard } from "@/components/ui/glass-card";

const stages: [TxStage, string][] = [
  ["signing", "Wallet signature requested"],
  ["submitted", "Transaction submitted"],
  ["accepted", "Optimistically accepted"],
  ["evaluating", "Validators evaluating public evidence"],
  ["finalized", "Finalized on GenLayer"],
];

export function TxProgress({
  stage,
  hash,
  monitoringDelayed = false,
  onResume,
  onDismiss,
}: {
  stage: TxStage;
  hash?: string;
  monitoringDelayed?: boolean;
  onResume?: () => void;
  onDismiss?: () => void;
}) {
  if (stage === "idle") return null;
  const index =
    stage === "evaluating"
      ? stages.findIndex(([v]) => v === "evaluating")
      : stages.findIndex(([v]) => v === stage);
  const showDismiss =
    onDismiss &&
    (stage === "finalized" ||
      stage === "undetermined" ||
      stage === "error" ||
      stage === "status_unavailable");

  return (
    <GlassCard className="p-6" aria-live="polite">
      <div className="grid gap-2.5">
        {stages.map(([value, label], pos) => (
          <div
            className={`flex items-center gap-2.5 text-[14px] ${
              pos < index || stage === "finalized"
                ? "text-green"
                : pos === index
                  ? "text-foreground"
                  : "text-muted-foreground"
            }`}
            key={value}
          >
            <span className="font-mono">
              {pos < index || stage === "finalized"
                ? "✓"
                : pos === index
                  ? "●"
                  : "○"}
            </span>
            {label}
          </div>
        ))}
      </div>

      {stage === "undetermined" && (
        <p className="mt-4 text-[13px] text-destructive">
          Validators could not agree. No contract state or funds changed; retry
          when the evidence source is stable.
        </p>
      )}

      {monitoringDelayed && (
        <div className="mt-4 glass-inner rounded-xl border-l-[3px] border-l-primary p-3 text-[13px] leading-[1.5] text-muted-foreground">
          RPC capacity is limited. Monitoring has slowed; your submitted
          transaction is still being tracked.
        </div>
      )}

      {stage === "status_unavailable" && (
        <>
          <div className="mt-4 glass-inner rounded-xl border-l-[3px] border-l-primary p-3 text-[13px] leading-[1.5] text-muted-foreground">
            Status is temporarily unavailable. Do not submit again—the
            transaction may already have succeeded.
          </div>
          {onResume && (
            <button
              className="mt-3 glass-input inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]"
              onClick={onResume}
            >
              Resume monitoring
            </button>
          )}
        </>
      )}

      {stage === "error" && (
        <p className="mt-4 text-[13px] text-destructive">The transaction did not complete.</p>
      )}

      {hash && (
        <div className="mt-4 overflow-wrap-anywhere font-mono text-[12px] text-muted-foreground">
          {hash}
        </div>
      )}

      {showDismiss && (
        <button
          className="mt-4 glass-input inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-white/[0.06]"
          onClick={onDismiss}
        >
          Close
        </button>
      )}
    </GlassCard>
  );
}
