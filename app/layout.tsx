import type { Metadata, Viewport } from "next";
import "./globals.css";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const basePath = process.env.GITHUB_ACTIONS === "true" && repositoryName
  ? `/${repositoryName}`
  : "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Austria 2026 | Family Trip",
    template: "%s | Austria 2026",
  },
  description:
    "Weather-aware plans, attractions, events, maps and an editable family itinerary for Austria.",
  manifest: `${basePath}/manifest.webmanifest`,
  openGraph: {
    title: "Austria 2026 Family Trip",
    description: "Weather-aware plans, 67 curated places and an editable family itinerary.",
    type: "website",
    images: [{ url: `${basePath}/og.png`, width: 1730, height: 982 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Austria 2026 Family Trip",
    description: "Weather-aware plans, 67 curated places and an editable family itinerary.",
    images: [`${basePath}/og.png`],
  },
};

export const viewport: Viewport = {
  themeColor: "#174f42",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
