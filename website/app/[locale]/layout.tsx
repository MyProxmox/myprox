import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'MyProx — Gérez votre Proxmox depuis votre téléphone',
  description: "MyProx est l'application mobile qui vous permet de gérer vos serveurs Proxmox où que vous soyez.",
  keywords: 'proxmox, mobile, gestion serveur, virtualisation, iOS, Android, cloud',
  icons: {
    icon: 'https://cdn.myprox.app/img/logos/myprox-logo-notext-purple-nobg.png',
    apple: 'https://cdn.myprox.app/img/logos/myprox-logo-notext-purple-nobg.png',
  },
  openGraph: {
    title: 'MyProx — Proxmox dans votre poche',
    description: 'Gérez vos VMs et containers Proxmox depuis votre iPhone ou Android.',
    type: 'website',
    url: 'https://myprox.app',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#080B14',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'fr' | 'en')) {
    notFound();
  }
  const messages = await getMessages();
  return (
    <html lang={locale} className={inter.variable}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
