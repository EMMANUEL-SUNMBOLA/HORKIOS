import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";

export function Manifesto() {
  return (
    <section className="py-20 sm:py-28">
      <SectionLabel label="The Oath" className="mb-16" />
      <div className="grid grid-cols-[1.35fr_0.65fr] items-end gap-20 max-[900px]:grid-cols-1 max-[900px]:gap-10">
        <h2 className="m-0 font-display text-[30px] font-semibold leading-[1.13] tracking-[-0.02em] text-bone sm:text-[42px]">
          A public agreement should be as clear after the work as it was
          before it.
        </h2>
        <div>
          <p className="mb-4 text-[15px] leading-[1.5] text-fog">
            Named for Zeus Horkios — the guardian of oaths — HORKIOS replaces
            private interpretation with explicit terms, visible evidence, and
            deterministic settlement.
          </p>
          <p className="mb-5 text-[15px] leading-[1.5] text-fog">
            No admin adjudicator. No hidden score. Just the promise and its
            proof.
          </p>
          <Link
            className="glass-input inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.04em] text-bone transition-colors duration-200 hover:bg-white/[0.06]"
            href="/create"
          >
            Write your first oath <span>↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
