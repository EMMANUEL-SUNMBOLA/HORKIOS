import Link from "next/link";

const sections = [
  ["01", "Write public terms", "The creator defines up to ten weighted demands, measurable X thresholds, acceptance and delivery deadlines, then locks native test GEN."],
  ["02", "Share the private invitation", "The URL carries a one-time secret in its fragment. Only its SHA-256 commitment reaches the chain; the first matching wallet becomes the KOL."],
  ["03", "Accept or counter", "The KOL accepts each demand or proposes a strictly later deadline. Any counteroffer needs creator approval before the oath activates."],
  ["04", "Submit canonical proof", "The KOL submits an exact public X status URL. GenLayer validators independently render it and compare authorship, status ID, content, time, and enabled metrics."],
  ["05", "Settle each milestone", "A passing demand releases its allocation minus the 1% platform fee. An expired demand receives one final check before an unfee'd creator refund."],
  ["06", "Handle exceptional termination", "Either party may open a public case. Past payouts stay final, the other party gets 48 hours to respond, and GenLayer rules on remaining escrow."],
];

export default function HowItWorksPage() {
  return <div className="stack">
    <div className="page-head"><div><div className="eyebrow">Protocol guide</div><h1 className="page-title">How a HORKIOS oath works</h1><p className="muted">Everything is public and permanent once submitted. There is no admin wallet or operator override.</p></div></div>
    <section className="steps" aria-label="HORKIOS lifecycle">
      {sections.map(([number, title, body]) => <article className="step" key={number}><span className="step-number">{number}</span><h2>{title}</h2><p>{body}</p></article>)}
    </section>
    <div className="card stack"><h2>Before testing</h2><p>HORKIOS currently runs its development gate on GenLayer Studionet. Use a Studionet-funded wallet and remember that test GEN has no monetary value.</p><div className="notice">Never share a private key, seed phrase, local environment file, or invitation secret in a bug report. A transaction hash and public wallet address are safe diagnostic inputs.</div><Link className="button bronze" href="/create">Create a test oath</Link></div>
  </div>;
}
