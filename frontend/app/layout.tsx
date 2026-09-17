import type { Metadata } from "next";
import { Montserrat, Roboto, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";

const aeonikFallback = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-aeonik-fallback", display: "swap" });
const bodyFallback = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-body-fallback", display: "swap" });
const inputFallback = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-input-fallback", display: "swap" });

const baseUrl = "https://horkios.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: "HORKIOS — Programmable oaths", template: "%s · HORKIOS" },
  description: "Create funded campaign agreements, verify public work with GenLayer, and settle milestones without a centralized adjudicator.",
  applicationName: "HORKIOS",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  openGraph: {
    type: "website",
    siteName: "HORKIOS",
    title: "HORKIOS — Programmable oaths",
    description: "Verifiable work and trustless settlement on GenLayer.",
    url: baseUrl,
    images: [{ url: "/opengraph-image.png", width: 1200, height: 900, alt: "HORKIOS programmable oaths interface" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HORKIOS — Programmable oaths",
    description: "Verifiable work and trustless settlement on GenLayer.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(aeonikFallback.variable, bodyFallback.variable, inputFallback.variable)}>
      <body>
        <Providers>
          <TooltipProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <MobileHeader />
            <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 pt-24 pb-24 sm:px-8 sm:pt-32 md:pt-36">{children}</main>
            <Footer />
          </div>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
