import type { Metadata } from 'next';
import Link from 'next/link';
import { Rocket, Home, Cloud, ShieldCheck, Radio, CreditCard, GitBranch } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '../docs.module.css';

export const metadata: Metadata = {
  title: 'Documentation — MyProx',
  description: 'Official MyProx documentation — quickstart guide, architecture, local mode, cloud mode and API reference.',
};

const sections = [
  {
    id: 'quickstart',
    Icon: Rocket,
    iconColor: '#6366F1',
    title: 'Quickstart',
    content: (
      <>
        <p>MyProx installs in 3 steps:</p>
        <ol>
          <li>Download the app via TestFlight (iOS) or the Play Store (Android)</li>
          <li>Create an account (email + password)</li>
          <li>Add your Proxmox server</li>
        </ol>
        <p>No additional server configuration is needed for local mode.</p>
      </>
    ),
  },
  {
    id: 'local-mode',
    Icon: Home,
    iconColor: '#10B981',
    title: 'Local Mode',
    content: (
      <>
        <p>Local mode directly connects the app to your Proxmox on the same Wi-Fi network.</p>
        <div className={styles.codeBlock}>
          <code>IP: 192.168.x.x or 10.x.x.x</code><br />
          <code>Port: 8006 (Proxmox default)</code><br />
          <code>User: root@pam (or your user)</code>
        </div>
        <p><strong>Requirement:</strong> Your phone and your Proxmox server must be on the same network.</p>
      </>
    ),
  },
  {
    id: 'cloud-mode',
    Icon: Cloud,
    iconColor: '#818CF8',
    title: 'Cloud Mode',
    content: (
      <>
        <p>Cloud mode allows you to access your Proxmox from anywhere, via a Go agent deployed locally.</p>
        <p><strong>Architecture:</strong></p>
        <div className={styles.codeBlock}>
          <code>Mobile App → MyProx API → Cloud Relay → Agent → Proxmox</code>
        </div>
        <p><strong>Deploy the agent (1 command):</strong></p>
        <div className={styles.codeBlock}>
          <code>{`docker run -d \\
  -e RELAY_URL=wss://relay.myprox.app/agent/connect \\
  -e AGENT_TOKEN=<token> \\
  -e PROXMOX_URL=https://10.0.0.10:8006/api2/json \\
  -e PROXMOX_USER=root@pam \\
  -e PROXMOX_PASS=<password> \\
  myprox/agent:latest`}</code>
        </div>
        <p>The agent token is automatically provided when you add a server in Cloud mode in the app.</p>
      </>
    ),
  },
  {
    id: 'security',
    Icon: ShieldCheck,
    iconColor: '#F87171',
    title: 'Security',
    content: (
      <>
        <ul>
          <li><strong>Authentication:</strong> JWT (15-minute access token + refresh token)</li>
          <li><strong>Mobile storage:</strong> expo-secure-store (iOS Keychain / Android Keystore)</li>
          <li><strong>Proxmox credentials:</strong> AES-256-CBC encryption in database</li>
          <li><strong>Cloud tunnel:</strong> WebSocket TLS, per-server JWT token</li>
          <li><strong>Password:</strong> bcrypt hashed (cost 12)</li>
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
        <p>The REST API runs on <code>localhost:3000</code> (local) or <code>api.myprox.app</code> (cloud).</p>
        <div className={styles.table}>
          <table>
            <thead>
              <tr><th>Method</th><th>Route</th><th>Description</th></tr>
            </thead>
            <tbody>
              {[
                ['GET',    '/api/v1/health',                    'Health check'],
                ['POST',   '/api/v1/auth/register',             'Create account'],
                ['POST',   '/api/v1/auth/login',                'Sign in'],
                ['POST',   '/api/v1/auth/logout',               'Sign out'],
                ['GET',    '/api/v1/user/profile',              'User profile'],
                ['GET',    '/api/v1/servers',                   'List servers'],
                ['POST',   '/api/v1/servers',                   'Add server'],
                ['PUT',    '/api/v1/servers/:id/mode',          'Switch mode'],
                ['GET',    '/api/v1/servers/:id/vms',           'List VMs + containers'],
                ['POST',   '/api/v1/servers/:id/vms/:vmid/action', 'VM action (start/stop/restart)'],
                ['GET',    '/api/v1/subscriptions/plan',        'Current plan + limits'],
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
        <p>All routes (except <code>/health</code>, <code>/auth/*</code>) require:<br />
          <code>Authorization: Bearer &lt;access_token&gt;</code>
        </p>
      </>
    ),
  },
];

export default function DocsEnPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
              {/* Language switcher */}
              <div className={styles.langSwitcher}>
                <Link href="/docs" className={styles.langBtn}>FR</Link>
                <span className={styles.langBtnActive}>EN</span>
              </div>

              <p className={styles.sidebarTitle}>On this page</p>
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
                View pricing
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
                {/* Mobile language switcher */}
                <div className={styles.langSwitcherMobile}>
                  <Link href="/docs" className={styles.langBtn}>FR</Link>
                  <span className={styles.langBtnActive}>EN</span>
                </div>
                <div className="badge">Documentation</div>
                <h1>MyProx Documentation</h1>
                <p>Everything you need to install, configure, and use MyProx.</p>
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
