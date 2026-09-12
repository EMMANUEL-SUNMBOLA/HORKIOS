import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";

type Step = [string, string, string];

type ProcessStepsProps = { steps: Step[]; accent?: "copper" | "lavender" };

const icon = (n: string) => n === "01" ? "◇" : n === "02" ? "◎" : n === "03" ? "⌁" : "↗";

export function ProcessSteps({ steps }: ProcessStepsProps) {
  return (
    <section className="py-20 sm:py-28">
      <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <SectionLabel label="The lifecycle" className="mb-5" />
          <h2 className="m-0 max-w-[700px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-.04em] text-foreground sm:text-[46px]">From terms to settlement,<br />without the trust gap.</h2>
        </div>
        <p className="max-w-[280px] text-[14px] leading-6 text-muted-foreground">Every step is visible to both parties, and every payout follows the contract.</p>
      </div>
      <div className="grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1" aria-label="How HORKIOS works">
        {steps.map(([number, title, body], index) => (
          <GlassCard key={number} hover className="group relative flex min-h-[270px] flex-col overflow-hidden p-5 sm:p-6">
            <div className="absolute right-5 top-5 h-2 w-2 rounded-full bg-primary/25 transition group-hover:bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-[.14em] text-primary">{number}</span>
            <div className="my-10 text-[32px] font-light text-primary transition duration-300 group-hover:scale-110 group-hover:text-[#00837d]" aria-hidden="true">{icon(number)}</div>
            <h3 className="mb-2.5 font-display text-[19px] font-semibold text-foreground">{title}</h3>
            <p className="m-0 text-[14px] leading-6 text-muted-foreground">{body}</p>
            {index < steps.length - 1 && <div className="absolute -right-2 top-1/2 hidden h-px w-4 bg-primary/30 min-[901px]:block" aria-hidden="true" />}
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
