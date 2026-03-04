import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/client";
import { Providers } from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Momentum - Life Management Platform",
  description: "Track your habits, journal your thoughts, plan your days, and achieve your goals with AI assistance.",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${syne.variable} ${dmSans.className}`}>
        <Providers>
          <TRPCProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </TRPCProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

