import type { TxStage } from "@/lib/types";

const stages: [TxStage, string][] = [["signing", "Wallet signed"], ["submitted", "Transaction submitted"], ["accepted", "Optimistically accepted"], ["finalized", "Finalized on GenLayer"]];

export function TxProgress({ stage, hash }: { stage: TxStage; hash?: string }) {
  if (stage === "idle") return null;
  const index = stages.findIndex(([value]) => value === stage);
  return <div className="card progress" aria-live="polite">
    {stages.map(([value, label], position) => <div className={`progress-item ${position < index || stage === "finalized" ? "done" : position === index ? "current" : ""}`} key={value}>
      <span>{position < index || stage === "finalized" ? "✓" : position === index ? "●" : "○"}</span>{label}
    </div>)}
    {stage === "undetermined" && <p className="error">Validators could not agree. Contract state and funds were not settled.</p>}
    {stage === "error" && <p className="error">The transaction did not complete.</p>}
    {hash && <div className="mono muted">{hash}</div>}
  </div>;
}
