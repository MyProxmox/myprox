import { useTranslations } from 'next-intl';
import {
  Smartphone, Server, Cloud, Zap,
  HardDrive, Settings, Activity, Bell, CloudCog, Check
} from 'lucide-react';
import styles from './Roadmap.module.css';

const releasedMeta = [
  { Icon: Smartphone, color: '#6366F1' },
  { Icon: Server,     color: '#818CF8' },
  { Icon: Cloud,      color: '#06B6D4' },
  { Icon: Zap,        color: '#10B981' },
  { Icon: Activity,   color: '#F59E0B' },
  { Icon: Server,     color: '#67E8F9' },
  { Icon: CloudCog,   color: '#A78BFA' },
];

const upcomingMeta = [
  { Icon: HardDrive, color: '#06B6D4', badge: 'Phase 7' },
  { Icon: Settings,  color: '#6366F1', badge: 'Phase 7' },
  { Icon: Activity,  color: '#10B981', badge: 'Phase 7' },
  { Icon: Bell,      color: '#F59E0B', badge: 'Phase 7' },
  { Icon: Cloud,     color: '#818CF8', badge: 'Phase 7' },
  { Icon: Smartphone,color: '#A78BFA', badge: 'Phase 8' },
];

export default function Roadmap() {
  const t = useTranslations('roadmap');

  return (
    <section className="section glow-bg" id="roadmap">
      <div className="container">
        <div className="section-header">
          <div className="badge badge-cyan" style={{ marginBottom: 16 }}>{t('badge')}</div>
          <h2>{t('title')} <span className="grad-text">{t('titleGrad')}</span></h2>
          <p>{t('sub')}</p>
        </div>

        <div className={styles.grid}>
          <div className={`glass ${styles.column}`}>
            <div className={styles.colHeader}>
              <div className={styles.colDot} style={{ background: '#10B981' }} />
              <h3 className={styles.colTitle}>{t('releasedTitle')}</h3>
            </div>
            <ul className={styles.list}>
              {releasedMeta.map((r, i) => (
                <li key={i} className={styles.item}>
                  <div className={styles.itemIcon} style={{ background: `${r.color}18` }}>
                    <r.Icon size={14} color={r.color} strokeWidth={2} />
                  </div>
                  <span className={styles.itemLabel}>{t(`r${i}`)}</span>
                  <div className={styles.checkMark}>
                    <Check size={11} color="#10B981" strokeWidth={2.5} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className={`glass ${styles.column}`}>
            <div className={styles.colHeader}>
              <div className={styles.colDot} style={{ background: '#F59E0B' }} />
              <h3 className={styles.colTitle}>{t('upcomingTitle')}</h3>
            </div>
            <ul className={styles.list}>
              {upcomingMeta.map((u, i) => (
                <li key={i} className={styles.item}>
                  <div className={styles.itemIcon} style={{ background: `${u.color}18` }}>
                    <u.Icon size={14} color={u.color} strokeWidth={2} />
                  </div>
                  <span className={styles.itemLabel}>{t(`u${i}`)}</span>
                  <span
                    className={styles.badge}
                    style={{
                      color: u.badge === 'Phase 7' ? '#06B6D4' : '#A78BFA',
                      background: u.badge === 'Phase 7' ? 'rgba(6,182,212,0.1)' : 'rgba(124,58,237,0.1)',
                      borderColor: u.badge === 'Phase 7' ? 'rgba(6,182,212,0.25)' : 'rgba(124,58,237,0.25)',
                    }}
                  >
                    {u.badge}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
