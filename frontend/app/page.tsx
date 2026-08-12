import Link from "next/link";
import { OrbitMark } from "@/components/orbit-mark";

const steps = [
  ["01", "Define", "Set public demands, evidence thresholds, and deadlines."],
  [
    "02",
    "Commit",
    "Fund the oath and invite the exact account expected to deliver.",
  ],
  [
    "03",
    "Verify",
    "GenLayer validators inspect public proof against every term.",
  ],
  [
    "04",
    "Settle",
    "Passing work pays automatically. Expired work returns to you.",
  ],
];

const principles = [
  [
    "Terms stay visible",
    "Every demand, deadline, wallet, and decision becomes part of one public record.",
  ],
  [
    "Proof, not promises",
    "Settlement follows observable public evidence—not a marketplace operator's opinion.",
  ],
  [
    "Money stays accountable",
    "See what is locked, paid, charged, or refunded down to each demand.",
  ],
];

export default function Home() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          {/* <div className="status-pill"><span /> BUILT ON GENLAYER · BRADBURY</div> */}
          <h1>
            Make the promise.
            <br />
            Prove the work.
          </h1>
          <p>
            HORKIOS turns campaign commitments into verifiable oaths funded
            upfront, judged by public evidence, and settled onchain.
          </p>
          <div className="actions">
            <Link className="button primary" href="/create">
              Create an oath <span>↗</span>
            </Link>
            <Link className="button secondary" href="/dashboard">
              Open dashboard
            </Link>
          </div>
        </div>
        <div className="hero-art">
          <OrbitMark />
          <div className="art-caption">
            <span>VERIFIABLE AGREEMENTS</span>
            <span>01 / 04</span>
          </div>
        </div>
      </section>

      <section className="process-section">
        <div className="section-intro">
          <span className="section-index">01 — PROCESS</span>
          <h2>
            From terms to settlement,
            <br />
            without the trust gap.
          </h2>
        </div>
        <div className="steps" aria-label="How HORKIOS works">
          {steps.map(([number, title, body]) => (
            <article className="step" key={number}>
              <span className="step-number">{number}</span>
              <div className="line-icon" aria-hidden="true">
                {number === "01"
                  ? "◇"
                  : number === "02"
                    ? "◎"
                    : number === "03"
                      ? "⌁"
                      : "↗"}
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="manifesto">
        <span className="section-index">02 — THE OATH</span>
        <div className="manifesto-grid">
          <h2>
            A public agreement should be as clear after the work as it was
            before it.
          </h2>
          <div>
            <p>
              Named for Zeus Horkios—the guardian of oaths—HORKIOS replaces
              private interpretation with explicit terms, visible evidence, and
              deterministic settlement.
            </p>
            <p>
              No admin adjudicator. No hidden score. Just the promise and its
              proof.
            </p>
            <Link className="text-link" href="/create">
              WRITE YOUR FIRST OATH <span>↗</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="principles-section">
        <div className="section-intro compact">
          <span className="section-index">03 — WHY HORKIOS</span>
          <h2>Trust has a new interface.</h2>
        </div>
        <div className="principles">
          {principles.map(([title, body], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-cta">
        <div>
          <span className="section-index">TESTNET RELEASE</span>
          <h2>
            Turn the next campaign
            <br />
            into a verifiable oath.
          </h2>
        </div>
        <div className="closing-action">
          <p>
            Public testnet GEN has no monetary value. Build, test, and learn how
            programmable agreements behave.
          </p>
          <Link className="button primary" href="/create">
            Start now <span>↗</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
