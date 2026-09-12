const guideArray = [
  {
    title: "Read the skill instructions",
    desc: "Your agent fetches the HORKIOS skill file to learn the contract API.",
    code: "curl -sL https://horkios.app/skill.md",
  },
  {
    title: "Set up a wallet on GenLayer",
    desc: "Generate a wallet, fund it with testnet GEN from the Studionet faucet.",
    code: "genlayer wallet new && genlayer faucet",
  },
  {
    title: "Create or accept oaths",
    desc: "Your agent calls the escrow contract directly — define demands, fund, or accept invitations.",
    code: "create_campaign(title, demands, escrow)",
  },
];

export function AgentGuide() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-border">
      {guideArray.map((step, index) => {
        // Formats index (0, 1, 2) into zero-padded strings ("01", "02", "03")
        const stepNumber = String(index + 1).padStart(2, "0");

        return (
          <div
            key={step.title}
            className="flex flex-col gap-2.5 border-b border-border bg-background p-3 transition-colors duration-200 ease-default last:border-b-0"
          >
            {/* Header row: Number and Title inline */}
            <div className="flex items-center gap-3">
              <span className="flex h-5 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-background font-mono text-[11px] font-medium">
                {stepNumber}
              </span>
              <strong className="text-sm font-medium text-foreground">
                {step.title}
              </strong>
            </div>

            {/* Description and Code stacked naturally */}
            <p className="m-0 text-[13px] flex pl-10 text-muted-foreground">{step.desc}</p>

            <div className="pl-10">
              <code className="flex w-fit rounded-[var(--radius-sm)] border border-border bg-background px-2 py-1 font-mono text-[11px] tracking-[0.02em] text-secondary">
                {step.code}
              </code>
            </div>
          </div>
        );
      })}
    </div>
  );
}
