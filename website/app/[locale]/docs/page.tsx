import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Rocket, Home, Cloud, ShieldCheck, Radio, CreditCard, GitBranch } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './docs.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('docs');
  return { title: t('badge') + ' — MyProx', description: t('sub') };
}

export default async function DocsPage() {
  const t = await getTranslations('docs');

  const sections = [
    {
      id: 'quickstart', Icon: Rocket, iconColor: '#6366F1', title: t('quickstartTitle'),
      content: (
        <>
          <p>{t('quickstartP1')}</p>
          <ol>
            <li>{t('quickstartS0')}</li>
            <li>{t('quickstartS1')}</li>
            <li>{t('quickstartS2')}</li>
          </ol>
          <p>{t('quickstartP2')}</p>
        </>
      ),
    },
    {
      id: 'local-mode', Icon: Home, iconColor: '#10B981', title: t('localTitle'),
      content: (
        <>
          <p>{t('localP1')}</p>
          <div className={styles.codeBlock}>
            <code>IP : 192.168.x.x ou 10.x.x.x</code><br />
            <code>Port : 8006</code><br />
            <code>User : root@pam</code>
          </div>
          <p><strong>{t('localPrereq')}</strong></p>
        </>
      ),
    },
    {
      id: 'cloud-mode', Icon: Cloud, iconColor: '#818CF8', title: t('cloudTitle'),
      content: (
        <>
          <p>{t('cloudP1')}</p>
          <p><strong>{t('cloudArch')}</strong></p>
          <div className={styles.codeBlock}><code>{t('cloudArchCode')}</code></div>
          <p><strong>{t('cloudDeploy')}</strong></p>
          <div className={styles.codeBlock}>
            <code>{`docker run -d \\\n  -e RELAY_URL=wss://relay.myprox.app/agent/connect \\\n  -e AGENT_TOKEN=<token> \\\n  -e PROXMOX_URL=https://10.0.0.10:8006/api2/json \\\n  -e PROXMOX_USER=root@pam \\\n  -e PROXMOX_PASS=<pass> \\\n  myprox/agent:latest`}</code>
          </div>
          <p>{t('cloudP2')}</p>
        </>
      ),
    },
    {
      id: 'security', Icon: ShieldCheck, iconColor: '#F87171', title: t('securityTitle'),
      content: (
        <ul>
          {(['securityI0','securityI1','securityI2','securityI3','securityI4'] as const).map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
      ),
    },
    {
      id: 'api', Icon: Radio, iconColor: '#06B6D4', title: t('apiTitle'),
      content: (
        <>
          <p>{t('apiP1')}</p>
          <div className={styles.table}>
            <table>
              <thead><tr><th>{t('apiMethod')}</th><th>{t('apiRoute')}</th><th>{t('apiDesc')}</th></tr></thead>
              <tbody>
                {[
                  ['GET',  '/api/v1/health',                    t('apiR0')],
                  ['POST', '/api/v1/auth/register',             t('apiR1')],
                  ['POST', '/api/v1/auth/login',                t('apiR2')],
                  ['POST', '/api/v1/auth/logout',               t('apiR3')],
                  ['GET',  '/api/v1/user/profile',              t('apiR4')],
                  ['GET',  '/api/v1/servers',                   t('apiR5')],
                  ['POST', '/api/v1/servers',                   t('apiR6')],
                  ['PUT',  '/api/v1/servers/:id/mode',          t('apiR7')],
                  ['GET',  '/api/v1/servers/:id/vms',           t('apiR8')],
                  ['POST', '/api/v1/servers/:id/vms/:vmid/action', t('apiR9')],
                  ['GET',  '/api/v1/subscriptions/plan',        t('apiR10')],
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
          <p>{t('apiAuthNote')}<br /><code>Authorization: Bearer &lt;access_token&gt;</code></p>
        </>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <p className={styles.sidebarTitle}>{t('onThisPage')}</p>
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
                <span className={styles.sidebarIcon} style={{ color: '#F59E0B' }}><CreditCard size={13} strokeWidth={2} /></span>
                {t('viewPricing')}
              </Link>
              <a href="https://github.com/MyProxmox/myprox" target="_blank" rel="noopener" className={styles.sidebarLink}>
                <span className={styles.sidebarIcon} style={{ color: '#818CF8' }}><GitBranch size={13} strokeWidth={2} /></span>
                GitHub
              </a>
            </aside>
            <div className={styles.content}>
              <div className={styles.header}>
                <div className="badge">{t('badge')}</div>
                <h1>{t('title')}</h1>
                <p>{t('sub')}</p>
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
