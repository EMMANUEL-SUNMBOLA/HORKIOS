import Link from "next/link";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type NoOathProps = {
  variant: "disconnected" | "empty";
  onConnect?: () => void;
};

export function NoOath({ variant, onConnect }: NoOathProps) {
  if (variant === "disconnected") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </EmptyMedia>
          <EmptyTitle>Connect your working wallet.</EmptyTitle>
          <EmptyDescription>
            Use the account you act with as a creator or KOL to reveal its oath
            records.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-[14px] font-medium text-black transition-all duration-200 hover:bg-bone"
            onClick={onConnect}
          >
            Connect wallet <span>↗</span>
          </button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M8 12l2 2 4-4" />
          </svg>
        </EmptyMedia>
        <EmptyTitle>No oaths yet.</EmptyTitle>
        <EmptyDescription>
          Your funded or accepted campaigns will appear here as permanent
          records.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-[14px] font-medium text-black transition-all duration-200 hover:bg-bone"
          href="/create"
        >
          Create your first oath <span>↗</span>
        </Link>
      </EmptyContent>
    </Empty>
  );
}
