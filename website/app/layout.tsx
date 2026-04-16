import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'MyProx — Gérez votre Proxmox depuis votre téléphone',
  description:
    'MyProx est l\'application mobile qui vous permet de gérer vos serveurs Proxmox où que vous soyez. Mode local et cloud sécurisé via tunnel WebSocket chiffré.',
  keywords: 'proxmox, mobile, gestion serveur, virtualisation, iOS, Android, cloud',
  openGraph: {
    title: 'MyProx — Proxmox dans votre poche',
    description: 'Gérez vos VMs et containers Proxmox depuis votre iPhone ou Android.',
    type: 'website',
    url: 'https://myprox.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyProx — Proxmox dans votre poche',
    description: 'Gérez vos VMs et containers Proxmox depuis votre iPhone ou Android.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
