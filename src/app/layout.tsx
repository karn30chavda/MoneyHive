import type { Metadata, Viewport } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { PwaSetup } from '@/components/PwaSetup';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans',
});


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
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <PwaSetup />
      </head>
      <body className={`${ptSans.variable} font-sans antialiased`}>
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
