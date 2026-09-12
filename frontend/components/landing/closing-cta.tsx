import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";

export function ClosingCTA() {
  return (
    <section className="relative mt-20 overflow-hidden rounded-[28px] border border-[#9fc3bf] bg-[#d8f2ef] p-7 sm:mt-28 sm:p-12">
      <div className="cta-glow absolute inset-0 opacity-80" aria-hidden="true" />
      <div className="absolute right-10 top-8 hidden h-32 w-32 rounded-full border border-primary/20 sm:block" aria-hidden="true"><div className="m-5 h-20 w-20 rounded-full border border-primary/20 horkios-float" /></div>
      <div className="relative z-10 grid grid-cols-[1.2fr_.8fr] items-end gap-16 max-[900px]:grid-cols-1 max-[900px]:gap-8">
        <div>
          <SectionLabel label="Testnet release" className="mb-5" />
          <h2 className="m-0 max-w-[620px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-.04em] text-[#003c39] sm:text-[48px]">Turn the next campaign into a verifiable oath.</h2>
        </div>
        <div>
          <p className="text-[15px] leading-6 text-[#245b58]">Build, test, and learn how programmable agreements behave. Test GEN has no monetary value.</p>
          <Link className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-semibold text-primary-foreground transition duration-200 hover:-translate-y-0.5 hover:bg-[#005753]" href="/create">Start with an oath <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  );
}
