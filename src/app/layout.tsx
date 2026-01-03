import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/client";
import { Providers } from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Momentum - Life Management Platform",
  description: "Track your habits, journal your thoughts, plan your days, and achieve your goals with AI assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
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

