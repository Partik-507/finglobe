import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FINGLOBE — Verifiable Financial Proof Engine",
  description:
    "Institutional-grade cryptographic proof infrastructure. SHA-256 hashing, AES-256-GCM encryption, IPFS storage, and blockchain anchoring for tamper-proof financial and ESG disclosures.",
  keywords: [
    "FINGLOBE",
    "blockchain",
    "financial verification",
    "ESG compliance",
    "cryptographic proof",
    "Polygon",
    "IPFS",
    "tamper-proof",
  ],
  authors: [{ name: "FINGLOBE Network" }],
  openGraph: {
    title: "FINGLOBE — Verifiable Financial Proof Engine",
    description: "Cryptographically verifiable, tamper-proof financial & ESG proof infrastructure",
    type: "website",
    locale: "en_US",
  },
};

export const viewport = {
  themeColor: "#030304",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased bg-bg-base text-white`}
        suppressHydrationWarning
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: "#14141f",
              color: "#e8e8ef",
              border: "1px solid rgba(212,160,23,0.2)",
              borderRadius: "0",
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "13px",
            },
            success: {
              iconTheme: { primary: "#00e5a0", secondary: "#14141f" },
            },
            error: {
              iconTheme: { primary: "#ff3366", secondary: "#14141f" },
            },
          }}
        />
      </body>
    </html>
  );
}
