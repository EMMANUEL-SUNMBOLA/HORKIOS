import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Track HORKIOS oaths, public evidence, escrow state, and milestone settlement from your connected wallet.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) { return children; }
