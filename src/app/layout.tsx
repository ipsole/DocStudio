import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { GoogleOneTap } from '@/components/auth/GoogleOneTap';

export const metadata: Metadata = {
  title: 'DocStudio | The Software Ecosystem of Docdril',
  description:
    'Discover, access, and manage the software ecosystem of Docdril through one unified account.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-black">
      <body className="min-h-screen flex flex-col bg-black text-white selection:bg-white selection:text-black antialiased">
        <AuthProvider>
          <GoogleOneTap context="signin" onSuccessRedirect="/dashboard" />
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
