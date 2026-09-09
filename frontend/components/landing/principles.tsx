import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";

const principles = [
  ["Terms stay visible", "Every demand, deadline, wallet, and decision becomes part of one public record."],
  ["Proof, not promises", "Settlement follows observable public evidence — not a marketplace operator's opinion."],
  ["Money stays accountable", "See what is locked, paid, charged, or refunded down to each demand."],
];

type PrinciplesProps = {
  accent?: "copper" | "lavender";
};

export function Principles({ accent = "copper" }: PrinciplesProps) {
  return (
    <section className="pt-20 sm:pt-28">
      <div className="mb-14">
        <SectionLabel label="Why HORKIOS" className="mb-6" />
        <h2 className="m-0 max-w-[700px] font-display text-[30px] font-semibold leading-[1.13] tracking-[-0.02em] text-foreground sm:text-[42px]">
          Trust has a new interface.
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
        {principles.map(([title, body], index) => (
          <GlassCard key={title} hover className="flex min-h-[240px] flex-col p-6 sm:p-7">
            <span
              className={`mb-12 block font-mono text-[11px] uppercase tracking-[0.16em] ${
                accent === "lavender" ? "text-lavender" : "text-primary"
              }`}
            >
              0{index + 1}
            </span>
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
