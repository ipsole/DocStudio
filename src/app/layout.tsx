import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { GoogleOneTap } from '@/components/auth/GoogleOneTap';

export const metadata: Metadata = {
  title: 'DocStudio | The Software Ecosystem of Docdril',
  description:
    'Discover, access, and manage the software ecosystem of Docdril through one unified account.',
  icons: {
    icon: [
      { url: '/favicon.svg?v=3', type: 'image/svg+xml' },
      { url: '/icon.svg?v=3', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg?v=3',
    apple: '/favicon.svg?v=3',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3" />
        <link rel="shortcut icon" href="/favicon.svg?v=3" />
        <link rel="apple-touch-icon" href="/favicon.svg?v=3" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('docstudio-theme');
                  if (t === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    document.documentElement.style.colorScheme = 'light';
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    document.documentElement.style.colorScheme = 'dark';
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-neutral-900 dark:bg-black dark:text-white selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black antialiased transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <GoogleOneTap context="signin" onSuccessRedirect="/" />
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
