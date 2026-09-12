import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";

export function Manifesto() {
  return (
    <section className="border-y border-border/70 py-20 sm:py-28">
      <SectionLabel label="The oath" className="mb-12" />
      <div className="grid grid-cols-[1.25fr_.75fr] items-end gap-16 max-[900px]:grid-cols-1 max-[900px]:gap-8">
        <h2 className="m-0 max-w-[720px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-.04em] text-foreground sm:text-[48px]">A public agreement should be as clear after the work as it was before it.</h2>
        <div>
          <p className="mb-4 text-[15px] leading-6 text-muted-foreground">Named for Zeus Horkios—the guardian of oaths—HORKIOS replaces private interpretation with explicit terms, visible evidence, and deterministic settlement.</p>
          <p className="mb-6 text-[15px] leading-6 text-muted-foreground">No admin adjudicator. No hidden score. Just the promise and its proof.</p>
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-3 text-[13px] font-semibold text-primary-foreground transition duration-200 hover:-translate-y-0.5 hover:bg-[#005753]" href="/create">Write your first oath <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  );
}
