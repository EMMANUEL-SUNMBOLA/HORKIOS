import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";

const principles = [
  ["Terms stay visible", "Every demand, deadline, wallet, and decision becomes part of one public record."],
  ["Proof, not promises", "Settlement follows observable public evidence—not a marketplace operator’s opinion."],
  ["Money stays accountable", "See what is locked, paid, charged, or refunded down to each demand."],
];

type PrinciplesProps = { accent?: "copper" | "lavender" };

export function Principles({}: PrinciplesProps) {
  return (
    <section className="pt-20 sm:pt-28">
      <div className="mb-12">
        <SectionLabel label="Why HORKIOS" className="mb-5" />
        <h2 className="m-0 max-w-[700px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-.04em] text-foreground sm:text-[46px]">Trust has a new interface.</h2>
      </div>
      <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
        {principles.map(([title, body], index) => (
          <GlassCard key={title} hover className="flex min-h-[230px] flex-col p-5 sm:p-6">
            <span className="mb-12 block font-mono text-[11px] uppercase tracking-[.14em] text-primary">0{index + 1}</span>
            <h3 className="mb-2.5 font-display text-[19px] font-semibold text-foreground">{title}</h3>
            <p className="m-0 text-[14px] leading-6 text-muted-foreground">{body}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
