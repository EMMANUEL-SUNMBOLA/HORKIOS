import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";

type Step = [string, string, string];

type ProcessStepsProps = {
  steps: Step[];
  accent?: "copper" | "lavender";
};

const icon = (n: string) =>
  n === "01" ? "◇" : n === "02" ? "◎" : n === "03" ? "⌁" : "↗";

export function ProcessSteps({ steps, accent = "copper" }: ProcessStepsProps) {
  return (
    <section className="py-20 sm:py-28">
      <div className="mb-14">
        <SectionLabel label="Process" className="mb-6" />
        <h2 className="m-0 max-w-[700px] font-display text-[30px] font-semibold leading-[1.13] tracking-[-0.02em] text-foreground sm:text-[42px]">
          From terms to settlement,<br />without the trust gap.
        </h2>
      </div>
      <div
        className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1"
        aria-label="How HORKIOS works"
      >
        {steps.map(([number, title, body]) => (
          <GlassCard key={number} hover className="flex min-h-[300px] flex-col p-6 sm:p-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {number}
            </span>
            <div
              className={`my-12 text-[32px] font-light ${
                accent === "lavender" ? "text-lavender" : "text-primary"
              } max-[600px]:my-8`}
              aria-hidden="true"
            >
              {icon(number)}
            </div>
            <h3 className="mb-2.5 font-display text-[18px] font-semibold text-foreground">
              {title}
            </h3>
            <p className="m-0 text-[14px] leading-[1.5] text-muted-foreground">{body}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
