import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'ניתוח תזרים מזומנים | Cash Flow Analyzer',
  description: 'ניתוח תזרים מזומנים רב-מטבעי לעסקים',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');else document.documentElement.classList.add('light');}catch(e){}` }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
