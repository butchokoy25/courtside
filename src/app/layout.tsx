import type { Metadata } from "next";
import { DM_Sans, Bebas_Neue } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { NavbarWrapper } from "@/components/public/navbar-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Courtside - Basketball League Stats",
  description: "Basketball league statistics, schedules, box scores, and live scoring",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Courtside",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${bebasNeue.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NavbarWrapper />
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
