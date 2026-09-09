import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";

export function ClosingCTA() {
  return (
    <section className="relative mt-20 overflow-hidden rounded-2xl border border-border bg-black/40 p-8 sm:mt-28 sm:p-12">
      {/* Violet glow background */}
      <div className="cta-glow absolute inset-0 opacity-50" />

      {/* Animated background SVG */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="h-full w-full" viewBox="0 0 960 400" fill="none">
          <path
            d="M480 50L520 150H440L480 50Z"
            stroke="white"
            strokeWidth="0.5"
            className="horkios-draw"
          />
          <path
            d="M480 80L510 140H450L480 80Z"
            stroke="white"
            strokeWidth="0.3"
            className="horkios-draw"
            style={{ animationDelay: "0.3s" }}
          />
        </svg>
      </div>

      <div className="relative z-10 grid grid-cols-[1.4fr_0.6fr] items-end gap-20 max-[900px]:grid-cols-1 max-[900px]:gap-10">
        <div>
          <SectionLabel label="Testnet Release" className="mb-6" />
          <h2 className="mt-6 font-display text-[30px] font-semibold leading-[1.13] tracking-[-0.02em] text-foreground sm:text-[42px]">
            Turn the next campaign<br />into a verifiable oath.
          </h2>
        </div>
        <div>
          <p className="text-[15px] leading-[1.5] text-muted-foreground">
            Public testnet GEN has no monetary value. Build, test, and learn how
            programmable agreements behave.
          </p>
          <Link
            className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-[14px] font-medium text-black transition-all duration-200 hover:bg-foreground"
            href="/create"
          >
            Start now <span>↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
