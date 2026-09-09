import Link from "next/link";

type EmptyStateProps = {
  symbol: string;
  heading: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

export function EmptyState({
  symbol,
  heading,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="glass rounded-2xl px-6 py-20 text-center">
      <div className="text-[36px] text-copper">{symbol}</div>
      <h2 className="mt-4 mb-2 font-display text-[22px] font-semibold text-bone">
        {heading}
      </h2>
      <p className="mx-auto mb-6 max-w-[420px] text-[14px] leading-[1.5] text-fog">
        {description}
      </p>
      {actionLabel &&
        (actionHref ? (
          <Link
            className="glass-input inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-[14px] font-medium text-bone transition-colors duration-200 hover:bg-white/[0.06]"
            href={actionHref}
          >
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-[14px] font-medium text-black transition-all duration-200 hover:bg-bone"
            onClick={onAction}
          >
            {actionLabel} <span>↗</span>
          </button>
        ) : null)}
    </div>
  );
}
