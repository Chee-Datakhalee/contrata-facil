import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Contrata Fácil',
  description: 'Encontre. Contrate. Cresça.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Contrata Fácil', statusBarStyle: 'default' },
  other: { 'mobile-web-app-capable': 'yes' },
};

export const viewport: Viewport = {
  themeColor: '#4A22AE',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="https://sophsctlnwdbidpzgquh.supabase.co/storage/v1/object/public/logos/empe.png" />
      </head>
      <body>
        <div className="relative mx-auto min-h-[100dvh] w-full max-w-md overflow-x-hidden bg-gradient-to-b from-white via-brand-50 to-brand-100/60 shadow-2xl">
          {children}
        </div>
      </body>
    </html>
  );
}
