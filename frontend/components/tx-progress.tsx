import type { TxStage } from "@/lib/types";

const stages: [TxStage, string][] = [["signing", "Wallet signature requested"], ["submitted", "Transaction submitted"], ["accepted", "Optimistically accepted"], ["evaluating", "Validators evaluating public evidence"], ["finalized", "Finalized on GenLayer"]];

export function TxProgress({ stage, hash, monitoringDelayed = false, onResume }: { stage: TxStage; hash?: string; monitoringDelayed?: boolean; onResume?: () => void }) {
  if (stage === "idle") return null;
  const index = stage === "evaluating" ? stages.findIndex(([value]) => value === "evaluating") : stages.findIndex(([value]) => value === stage);
  return <div className="card progress" aria-live="polite">
    {stages.map(([value, label], position) => <div className={`progress-item ${position < index || stage === "finalized" ? "done" : position === index ? "current" : ""}`} key={value}>
      <span>{position < index || stage === "finalized" ? "✓" : position === index ? "●" : "○"}</span>{label}
    </div>)}
    {stage === "undetermined" && <p className="error">Validators could not agree. No contract state or funds changed; retry when the evidence source is stable.</p>}
    {monitoringDelayed && <p className="notice">RPC capacity is limited. Monitoring has slowed; your submitted transaction is still being tracked.</p>}
    {stage === "status_unavailable" && <><p className="notice">Status is temporarily unavailable. Do not submit again—the transaction may already have succeeded.</p>{onResume && <button className="button secondary" onClick={onResume}>Resume monitoring</button>}</>}
    {stage === "error" && <p className="error">The transaction did not complete.</p>}
    {hash && <div className="mono muted">{hash}</div>}
  </div>;
}
