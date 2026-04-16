import { useTranslations } from 'next-intl';
import {
  Home, Cloud, Monitor, Zap, HardDrive,
  ShieldCheck, Bell, RefreshCw,
} from 'lucide-react';
import styles from './Features.module.css';

const featureMeta = [
  { Icon: Home,       iconBg: 'rgba(16,185,129,0.12)',  iconColor: '#10B981', badgeColor: '#10B981' },
  { Icon: Cloud,      iconBg: 'rgba(99,102,241,0.12)',   iconColor: '#818CF8', badgeColor: '#818CF8' },
  { Icon: Monitor,    iconBg: 'rgba(6,182,212,0.12)',    iconColor: '#06B6D4', badgeColor: '#06B6D4' },
  { Icon: Zap,        iconBg: 'rgba(124,58,237,0.12)',   iconColor: '#A78BFA', badgeColor: '#10B981' },
  { Icon: HardDrive,  iconBg: 'rgba(245,158,11,0.12)',  iconColor: '#F59E0B', badgeColor: '#F59E0B' },
  { Icon: ShieldCheck,iconBg: 'rgba(239,68,68,0.1)',    iconColor: '#F87171', badgeColor: '#10B981' },
  { Icon: Bell,       iconBg: 'rgba(6,182,212,0.1)',    iconColor: '#67E8F9', badgeColor: '#F59E0B' },
  { Icon: RefreshCw,  iconBg: 'rgba(99,102,241,0.08)',  iconColor: '#6366F1', badgeColor: '#818CF8' },
];

export default function Features() {
  const t = useTranslations('features');

  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-header">
          <div className="badge" style={{ marginBottom: 16 }}>{t('badge')}</div>
          <h2>{t('title')}<br /><span className="grad-text">{t('titleGrad')}</span></h2>
          <p>{t('sub')}</p>
        </div>
        <div className={styles.grid}>
          {featureMeta.map((f, i) => {
            const key = String(i) as '0';
            const tags = [t(`${key}.t0`), t(`${key}.t1`), t(`${key}.t2`)];
            return (
              <div key={i} className={`glass ${styles.card}`}>
                <div className={styles.cardTop}>
                  <div className={styles.iconBox} style={{ background: f.iconBg }}>
                    <f.Icon size={22} color={f.iconColor} strokeWidth={1.75} />
                  </div>
                  <span
                    className={styles.featureBadge}
                    style={{ color: f.badgeColor, background: `${f.badgeColor}18`, borderColor: `${f.badgeColor}35` }}
                  >
                    {t(`${key}.badge`)}
                  </span>
                </div>
                <h3 className={styles.title}>{t(`${key}.title`)}</h3>
                <p className={styles.desc}>{t(`${key}.desc`)}</p>
                <div className={styles.tags}>
                  {tags.map((tag) => <span key={tag} className={styles.tag}>{tag}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
