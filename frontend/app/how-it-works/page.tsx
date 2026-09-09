import Link from "next/link";

const sections: [string, string, string][] = [
  ["01", "Write public terms", "The creator defines up to ten weighted demands, measurable X thresholds, acceptance and delivery deadlines, then locks native test GEN."],
  ["02", "Share the private invitation", "The URL carries a one-time secret in its fragment. Only its SHA-256 commitment reaches the chain; the first matching wallet becomes the KOL."],
  ["03", "Accept or counter", "The KOL accepts each demand or proposes a strictly later deadline. Any counteroffer needs creator approval before the oath activates."],
  ["04", "Submit canonical proof", "The KOL submits an exact public X status URL. GenLayer validators independently render it and compare authorship, status ID, content, time, and enabled metrics."],
  ["05", "Settle each milestone", "A passing demand releases its allocation minus the 1% platform fee. An expired demand receives one final check before an unfee'd creator refund."],
  ["06", "Handle exceptional termination", "Either party may open a public case. Past payouts stay final, the other party gets 48 hours to respond, and GenLayer rules on remaining escrow."],
];

const icons: Record<string, string> = {
  "01": "◇",
  "02": "◎",
  "03": "⌁",
  "04": "↗",
  "05": "↗",
  "06": "↗",
};

export default function HowItWorksPage() {
  return (
    <div className="grid gap-4">
      <div>
        <div className="text-[13px] font-semibold uppercase tracking-[-0.02em] text-steel">
          Protocol guide
        </div>
        <h1 className="mt-3 font-display text-[clamp(40px,5.5vw,64px)] font-normal leading-none tracking-[0.01em] text-paper">
          How a HORKIOS oath works
        </h1>
        <p className="mt-3.5 max-w-[600px] text-fog">
          Everything is public and permanent once submitted. There is no admin
          wallet or operator override.
        </p>
      </div>

      <section
        className="grid grid-cols-3 overflow-hidden rounded-[var(--radius-md)] border border-graphite max-[900px]:grid-cols-1"
        aria-label="HORKIOS lifecycle"
      >
        {sections.map(([number, title, body]) => (
          <article
            key={number}
            className="flex min-h-[300px] flex-col border-r border-graphite bg-onyx p-8 transition-colors duration-200 ease-default last:border-r-0 hover:bg-carbon max-[900px]:border-r-0 max-[900px]:border-b max-[900px]:last:border-b-0"
          >
            <span className="font-mono text-[13px] font-medium text-steel">
              {number}
            </span>
            <div
              className="my-12 text-[32px] font-light text-copper max-[600px]:my-8"
              aria-hidden="true"
            >
              {icons[number]}
            </div>
            <h3 className="mb-2.5 font-body text-base font-medium text-paper">
              {title}
            </h3>
            <p className="m-0 text-[15px] leading-[1.5] text-fog">{body}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 rounded-[var(--radius-md)] border border-graphite bg-onyx p-6">
        <h2 className="mt-0 font-display text-xl font-normal tracking-[0.01em] text-paper">
          Before testing
        </h2>
        <p className="m-0 text-fog">
          HORKIOS currently runs its development gate on GenLayer Studionet.
          Use a Studionet-funded wallet and remember that test GEN has no
          monetary value.
        </p>
        <div className="rounded-[0_var(--radius-sm)_var(--radius-sm)_0] border border-graphite border-l-[3px] border-l-copper bg-copper-dim p-3 text-[14px] leading-[1.5] text-fog">
          Never share a private key, seed phrase, local environment file, or
          invitation secret in a bug report. A transaction hash and public
          wallet address are safe diagnostic inputs.
        </div>
        <Link
          className="mt-1 inline-flex w-fit min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-paper bg-paper px-[22px] py-2 text-[14px] font-medium text-obsidian transition-all duration-200 ease-default hover:border-bone hover:bg-bone"
          href="/create"
        >
          Create a test oath
        </Link>
      </div>
    </div>
  );
}
