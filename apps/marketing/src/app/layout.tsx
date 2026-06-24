import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://q-os.io"),
  title: {
    default: "Q-OS — The Spatial Compute Protocol",
    template: "%s | Q-OS",
  },
  description:
    "Zero-latency edge execution. Serverless physical infrastructure. Real-time CRDT synchronization. Q-OS turns any venue into a programmable compute surface.",
  keywords: [
    "edge computing",
    "WASM",
    "local-first",
    "serverless",
    "Rust",
    "spatial compute",
    "restaurant tech",
    "QR code",
    "real-time",
    "CRDT",
  ],
  authors: [{ name: "Q-OS" }],
  creator: "Q-OS",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://q-os.io",
    siteName: "Q-OS",
    title: "Q-OS — The Spatial Compute Protocol",
    description:
      "Zero-latency edge execution. Serverless physical infrastructure. Deploy WASM payloads to physical space via QR codes.",
    images: [
      {
        url: "/og?title=Q-OS%20Protocol",
        width: 1200,
        height: 630,
        alt: "Q-OS — The Spatial Compute Protocol",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Q-OS — The Spatial Compute Protocol",
    description: "Zero-latency edge execution. Serverless physical infrastructure.",
    images: ["/og?title=Q-OS%20Protocol"],
    creator: "@qos_protocol",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0a] text-gray-200 antialiased">
        {/* Scanline overlay */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[999] mix-blend-overlay scanlines opacity-40"
        />
        <SiteNav />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
