import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FREEZBY Player",
  description: "Аудиоплеер с поддержкой плейлистов и поиска треков.",
  themeColor: "#ff5500",
  icons: [
    { rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { rel: 'manifest', url: '/manifest.json' },
  ],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta name="theme-color" content="#ff5500" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" sizes="192x192" type="image/png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="Аудиоплеер с поддержкой плейлиста и поиска треков." />
        <meta property="og:title" content="FREEZBY Player" />
        <meta property="og:description" content="Аудиоплеер с поддержкой плейлиста и поиска треков." />
        <meta property="og:image" content="/icon-512.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FREEZBY Player" />
        <meta name="twitter:description" content="Аудиоплеер с поддержкой плейлиста и поиска треков." />
        <meta name="twitter:image" content="/icon-512.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div id="burger-root"></div>
        {children}
      </body>
    </html>
  );
}
