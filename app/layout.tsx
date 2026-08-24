import type { Metadata } from 'next';
import './globals.css';

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
