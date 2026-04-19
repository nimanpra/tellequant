import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Tellequant — AI Call Center",
    template: "%s · Tellequant",
  },
  description:
    "Tellequant is the AI call-center for every business. Upload your docs, shape a persona, and answer every inbound call or run autonomous outbound campaigns in minutes.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Tellequant — AI Call Center",
    description:
      "Answer every call with a branded AI agent backed by your own knowledge base. Outbound campaigns, inbound routing, full transcripts.",
    url: "/",
    siteName: "Tellequant",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(23, 28, 40, 0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fafafa",
            },
          }}
        />
      </body>
    </html>
  );
}
