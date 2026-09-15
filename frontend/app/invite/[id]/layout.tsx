import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review your invitation",
  description: "Review campaign demands and acceptance terms for this private HORKIOS invitation.",
  robots: { index: false, follow: false },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) { return children; }
