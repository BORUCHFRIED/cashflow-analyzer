import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ניתוח תזרים מזומנים | Cash Flow Analyzer',
  description: 'ניתוח תזרים מזומנים רב-מטבעי לעסקים',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
