import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import {
  Aref_Ruqaa_Ink,
  Geist,
  Geist_Mono,
  Reem_Kufi,
} from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";
import { Shell } from "@/components/shell";
import { APP_NAME } from "@/lib/version";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const ruqaa = Aref_Ruqaa_Ink({
  variable: "--font-ruqaa",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const reem = Reem_Kufi({
  variable: "--font-reem",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "JIGAR — a sharp, minimal music streaming experience for discovery and uninterrupted listening.",
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  appleWebApp: {
    title: "JIGAR",
    capable: true,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "JIGAR",
    description:
      "A minimal music streaming experience for discovery and uninterrupted listening.",
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "JIGAR",
    description:
      "A minimal music streaming experience for discovery and uninterrupted listening.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jar = await cookies();
  const initialAuthenticated = jar.has("jigar_auth");

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${ruqaa.variable} ${reem.variable}`}
    >
      <body className="min-h-screen bg-page text-fg antialiased">
        <Providers initialAuthenticated={initialAuthenticated}>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}