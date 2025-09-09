import type { Metadata, Viewport } from 'next';
import { useEffect } from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: 'PennyPincher PWA',
  description: 'A personal expense tracker that works offline.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#228B22',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <PwaSetup />
      </head>
      <body className="font-body antialiased">
        <div className="flex min-h-screen w-full flex-col">
          <Navbar />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}

const PwaSetup = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
        .catch((error) => console.error('Service Worker registration failed:', error));
    }
  }, []);

  return null;
};
