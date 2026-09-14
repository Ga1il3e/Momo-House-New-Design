import { Be_Vietnam_Pro, Epilogue, Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import "./globals.css";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Momo House — Streetfood Himalayenne à Paris",
    template: "%s · Momo House Paris",
  },
  description:
    "Momos faits main, thukpa fumant et achar maison — Maison Montmartre (2e) & Maison Poissonnière (10e).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${epilogue.variable} ${spaceGrotesk.variable} ${beVietnam.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-body bg-paper text-ink"
        suppressHydrationWarning
      >
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
