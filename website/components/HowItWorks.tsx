import { useTranslations } from 'next-intl';
import { Smartphone, Server, Cloud, Zap } from 'lucide-react';
import styles from './HowItWorks.module.css';

const stepMeta = [
  { num: '01', Icon: Smartphone, iconColor: '#6366F1' },
  { num: '02', Icon: Server,     iconColor: '#818CF8' },
  { num: '03', Icon: Cloud,      iconColor: '#06B6D4' },
  { num: '04', Icon: Zap,        iconColor: '#10B981' },
];

export default function HowItWorks() {
  const t = useTranslations('how');

  return (
    <section className="section" id="how">
      <div className="container">
        <div className="section-header">
          <div className="badge" style={{ marginBottom: 16 }}>{t('badge')}</div>
          <h2>{t('title')} <span className="grad-text">{t('titleGrad')}</span></h2>
          <p>{t('sub')}</p>
        </div>

        <div className={styles.steps}>
          {stepMeta.map((s, i) => (
            <div key={s.num} className={styles.step}>
              <div className={styles.line}>
                <div className={styles.numBadge}>
                  <span className="grad-text">{s.num}</span>
                </div>
                {i < stepMeta.length - 1 && <div className={styles.connector} />}
              </div>
              <div className={`glass ${styles.card}`}>
                <div className={styles.cardIcon} style={{ background: `${s.iconColor}18` }}>
                  <s.Icon size={22} color={s.iconColor} strokeWidth={1.75} />
                </div>
                <h3 className={styles.cardTitle}>{t(`${i}.title`)}</h3>
                <p className={styles.cardDesc}>{t(`${i}.desc`)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`glass ${styles.snippet}`}>
          <div className={styles.snippetHeader}>
            <div className={styles.dot} style={{ background: '#ef4444' }} />
            <div className={styles.dot} style={{ background: '#f59e0b' }} />
            <div className={styles.dot} style={{ background: '#10b981' }} />
            <span className={styles.snippetTitle}>{t('snippetTitle')}</span>
          </div>
          <pre className={styles.code}>{`docker run -d \\
  --name myprox-agent \\
  -e RELAY_URL=wss://relay.myprox.app/agent/connect \\
  -e AGENT_TOKEN=<votre_token> \\
  -e PROXMOX_URL=https://10.0.0.10:8006/api2/json \\
  -e PROXMOX_USER=root@pam \\
  -e PROXMOX_PASS=<motdepasse> \\
  --restart unless-stopped \\
  myprox/agent:latest`}</pre>
        </div>
      </div>
    </section>
  );
}
