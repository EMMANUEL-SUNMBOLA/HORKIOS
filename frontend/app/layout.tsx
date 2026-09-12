import type { Metadata } from "next";
import { Montserrat, Roboto, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HORKIOS — Programmable oaths",
  description: "Verifiable work and trustless settlement on GenLayer.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(montserrat.variable, roboto.variable, jetbrainsMono.variable, "font-sans")}
    >
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <MobileHeader />
            <main className="mx-auto w-full max-w-[1180px] flex-1 px-5 pt-28 pb-40 sm:px-8 sm:pt-36 md:pt-44">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
