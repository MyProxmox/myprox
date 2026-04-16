import type { Metadata } from 'next';
import Link from 'next/link';
import { Rocket, Home, Cloud, ShieldCheck, Radio, CreditCard, GitBranch } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './docs.module.css';

export const metadata: Metadata = {
  title: 'Documentation — MyProx',
  description: 'Documentation officielle MyProx — guide de démarrage, architecture, mode local, mode cloud et référence API.',
};

const sections = [
  {
    id: 'quickstart',
    Icon: Rocket,
    iconColor: '#6366F1',
    title: 'Démarrage rapide',
    content: (
      <>
        <p>MyProx s&apos;installe en 3 étapes :</p>
        <ol>
          <li>Téléchargez l&apos;app via TestFlight (iOS) ou le Play Store (Android)</li>
          <li>Créez un compte (email + mot de passe)</li>
          <li>Ajoutez votre serveur Proxmox</li>
        </ol>
        <p>Aucune configuration serveur supplémentaire n&apos;est nécessaire pour le mode local.</p>
      </>
    ),
  },
  {
    id: 'local-mode',
    Icon: Home,
    iconColor: '#10B981',
    title: 'Mode Local',
    content: (
      <>
        <p>Le mode local connecte directement l&apos;app à votre Proxmox sur le même réseau Wi-Fi.</p>
        <div className={styles.codeBlock}>
          <code>IP : 192.168.x.x ou 10.x.x.x</code><br />
          <code>Port : 8006 (défaut Proxmox)</code><br />
          <code>User : root@pam (ou votre user)</code>
        </div>
        <p><strong>Prérequis :</strong> Votre téléphone et votre serveur Proxmox doivent être sur le même réseau.</p>
      </>
    ),
  },
  {
    id: 'cloud-mode',
    Icon: Cloud,
    iconColor: '#818CF8',
    title: 'Mode Cloud',
    content: (
      <>
        <p>Le mode cloud vous permet d&apos;accéder à votre Proxmox depuis n&apos;importe où, via un agent Go déployé localement.</p>
        <p><strong>Architecture :</strong></p>
        <div className={styles.codeBlock}>
          <code>App Mobile → API MyProx → Cloud Relay → Agent → Proxmox</code>
        </div>
        <p><strong>Déploiement agent (1 commande) :</strong></p>
        <div className={styles.codeBlock}>
          <code>{`docker run -d \\
  -e RELAY_URL=wss://relay.myprox.app/agent/connect \\
  -e AGENT_TOKEN=<token> \\
  -e PROXMOX_URL=https://10.0.0.10:8006/api2/json \\
  -e PROXMOX_USER=root@pam \\
  -e PROXMOX_PASS=<pass> \\
  myprox/agent:latest`}</code>
        </div>
        <p>Le token agent est fourni automatiquement lors de l&apos;ajout d&apos;un serveur en mode Cloud dans l&apos;app.</p>
      </>
    ),
  },
  {
    id: 'security',
    Icon: ShieldCheck,
    iconColor: '#F87171',
    title: 'Sécurité',
    content: (
      <>
        <ul>
          <li><strong>Authentification :</strong> JWT (access 15min + refresh token)</li>
          <li><strong>Stockage mobile :</strong> expo-secure-store (iOS Keychain / Android Keystore)</li>
          <li><strong>Credentials Proxmox :</strong> chiffrement AES-256-CBC en base de données</li>
          <li><strong>Tunnel cloud :</strong> WebSocket TLS, token JWT par serveur</li>
          <li><strong>Mot de passe :</strong> hashé bcrypt (cost 12)</li>
        </ul>
      </>
    ),
  },
  {
    id: 'api',
    Icon: Radio,
    iconColor: '#06B6D4',
    title: 'API Reference',
    content: (
      <>
        <p>L&apos;API REST tourne sur <code>localhost:3000</code> (local) ou <code>api.myprox.app</code> (cloud).</p>
        <div className={styles.table}>
          <table>
            <thead>
              <tr><th>Méthode</th><th>Route</th><th>Description</th></tr>
            </thead>
            <tbody>
              {[
                ['GET',    '/api/v1/health',                   'Health check'],
                ['POST',   '/api/v1/auth/register',            'Créer un compte'],
                ['POST',   '/api/v1/auth/login',               'Se connecter'],
                ['POST',   '/api/v1/auth/logout',              'Se déconnecter'],
                ['GET',    '/api/v1/user/profile',             'Profil utilisateur'],
                ['GET',    '/api/v1/servers',                  'Lister les serveurs'],
                ['POST',   '/api/v1/servers',                  'Ajouter un serveur'],
                ['PUT',    '/api/v1/servers/:id/mode',         'Changer le mode'],
                ['GET',    '/api/v1/servers/:id/vms',          'Lister VMs + containers'],
                ['POST',   '/api/v1/servers/:id/vms/:vmid/action', 'Action VM (start/stop/restart)'],
                ['GET',    '/api/v1/subscriptions/plan',       'Plan actuel + limites'],
              ].map(([m, route, desc]) => (
                <tr key={route}>
                  <td><span className={styles[`method${m}`] ?? styles.methodGET}>{m}</span></td>
                  <td><code>{route}</code></td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Toutes les routes (sauf <code>/health</code>, <code>/auth/*</code>) nécessitent :<br />
          <code>Authorization: Bearer &lt;access_token&gt;</code>
        </p>
      </>
    ),
  },
];

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
              <p className={styles.sidebarTitle}>Sur cette page</p>
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className={styles.sidebarLink}>
                  <span className={styles.sidebarIcon} style={{ color: s.iconColor }}>
                    <s.Icon size={13} strokeWidth={2} />
                  </span>
                  {s.title}
                </a>
              ))}
              <div className={styles.sidebarDivider} />
              <Link href="/pricing" className={styles.sidebarLink}>
                <span className={styles.sidebarIcon} style={{ color: '#F59E0B' }}>
                  <CreditCard size={13} strokeWidth={2} />
                </span>
                Voir les tarifs
              </Link>
              <a href="https://github.com/MyProxmox/myprox" target="_blank" rel="noopener" className={styles.sidebarLink}>
                <span className={styles.sidebarIcon} style={{ color: '#818CF8' }}>
                  <GitBranch size={13} strokeWidth={2} />
                </span>
                GitHub
              </a>
            </aside>

            {/* Content */}
            <div className={styles.content}>
              <div className={styles.header}>
                <div className="badge">Documentation</div>
                <h1>Documentation MyProx</h1>
                <p>Tout ce que vous devez savoir pour installer, configurer et utiliser MyProx.</p>
              </div>
              {sections.map((s) => (
                <section key={s.id} id={s.id} className={`glass ${styles.section}`}>
                  <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon} style={{ background: `${s.iconColor}18` }}>
                      <s.Icon size={16} color={s.iconColor} strokeWidth={1.75} />
                    </span>
                    {s.title}
                  </h2>
                  <div className={styles.sectionContent}>{s.content}</div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
