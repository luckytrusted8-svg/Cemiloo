import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'Cemiloo - Catat Keuangan & Kasir Jajanan',
  description: 'Aplikasi kasir POS dan pencatatan keuangan bisnis jajanan Cemiloo. Cepat, akurat, dan otomatis sinkron stok.',
  manifest: '/manifest.json',
  icons: {
    icon: '/assets/cemiloo-logo.png',
    apple: '/assets/cemiloo-logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cemiloo',
  },
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/assets/cemiloo-logo.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased text-gray-900 bg-slate-50 min-h-screen">
        <AuthProvider>
          <ToastProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <PWAInstallPrompt />
              <main className="flex-1 pb-28 pt-2 px-3 sm:px-4 max-w-4xl mx-auto w-full">
                {children}
              </main>
              <BottomNav />
            </div>
            {/* Service Worker Registration */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js').then(
                        function(reg) {
                          console.log('Cemiloo PWA SW terdaftar:', reg.scope);
                        },
                        function(err) {
                          console.log('Cemiloo PWA SW gagal:', err);
                        }
                      );
                    });
                  }
                `,
              }}
            />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
