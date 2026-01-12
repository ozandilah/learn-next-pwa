import type { Metadata } from "next";
import "./globals.css";
import { TanstackQueryProvider } from '@/providers/tanstack-query-provider'

export const metadata: Metadata = {
  title: "Next.js PWA Tutorial",
  description: "Progressive Web App built with Next.js featuring push notifications, offline support, and installability",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NextPWA",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
