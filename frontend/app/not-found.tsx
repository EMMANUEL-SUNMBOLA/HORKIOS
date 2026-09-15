import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[58vh] items-center justify-center py-16">
      <div className="relative w-full max-w-[680px] overflow-hidden rounded-[28px] border border-[#9fc3bf] bg-[#d8f2ef] p-8 sm:p-12">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-primary/20" aria-hidden="true"><div className="m-6 h-32 w-32 rounded-full border border-primary/20" /></div>
        <div className="relative z-10">
          <p className="section-label mb-6"><span className="section-label-slash">/</span> Oath not found</p>
          <div className="mb-4 font-mono text-[72px] font-semibold leading-none tracking-[-.08em] text-primary sm:text-[100px]">404</div>
          <h1 className="max-w-[500px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-.04em] text-[#003c39] sm:text-[46px]">This path did not hold up.</h1>
          <p className="mt-5 max-w-[470px] text-[16px] leading-7 text-[#245b58]">The page may have moved, or this oath link is no longer available. Start from a public route and continue from there.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#005753]" href="/">Back to Horkios</Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#9fc3bf] bg-white/70 px-6 py-3 text-[14px] font-semibold text-[#003c39] transition hover:bg-white" href="/how-it-works">See how it works</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
