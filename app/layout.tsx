import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CardMint ID Studio',
  description:
    'Create, store, manage, and export digital employee ID cards from one deployable dashboard.',
  openGraph: {
    title: 'CardMint ID Studio',
    description:
      'Create, store, manage, and export digital employee ID cards from one deployable dashboard.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CardMint ID Studio',
    description:
      'Create, store, manage, and export digital employee ID cards from one deployable dashboard.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
