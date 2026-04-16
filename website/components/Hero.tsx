import { useTranslations } from 'next-intl';
import { Monitor } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import styles from './Hero.module.css';

const stats = [
  { value: '100%', color: '#10B981', key: 'statOpensource' as const },
  { value: 'AES-256', color: '#6366F1', key: 'statEncryption' as const },
  { value: 'Live', color: '#06B6D4', key: 'statStatus' as const },
];

const liveVMs = [
  { name: 'k3s-master', status: 'running', cpu: 28 },
  { name: 'plex-media', status: 'running', cpu: 8 },
  { name: 'win-gaming', status: 'stopped', cpu: 0 },
];

import { HardDrive, Cloud } from 'lucide-react';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section className={`section glow-bg glow-bg-b ${styles.hero}`}>
      <div className={`container ${styles.inner}`}>
        {/* Left Copy */}
        <div className={styles.copy}>
          <div className="badge badge-green animate-fade-up">
            <span className="status-dot" style={{ background: '#10B981' }} />
            {t('badge')}
          </div>

          <h1 className={`animate-fade-up-1 ${styles.headline}`}>
            {t('headline1')}<br />
            <span className="grad-text">{t('headline2')}</span>
          </h1>

          <p className={`animate-fade-up-2 ${styles.sub}`}>{t('sub')}</p>

          <div className={`animate-fade-up-3 ${styles.ctas}`}>
            <a href="#download" className="btn btn-primary">{t('ctaPrimary')}</a>
            <Link href="/docs" className="btn btn-outline">{t('ctaSecondary')} →</Link>
          </div>

          <div className={`animate-fade-up-4 ${styles.stats}`}>
            {stats.map((s) => (
              <div key={s.key} className={styles.stat}>
                <span className={styles.statValue} style={{ color: s.color }}>{s.value}</span>
                <span className={styles.statLabel}>{t(s.key)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Visual */}
        <div className={`animate-float ${styles.visual}`}>
          <div className={styles.phone}>
            <div className={styles.phoneNotch} />
            <div className={styles.phoneScreen}>
              <div className={styles.appHeader}>
                <div>
                  <div className={styles.appTitle}>{t('appTitle')}</div>
                  <div className={styles.appSub}>{t('appSub')}</div>
                </div>
                <div className={styles.appPill}>
                  <span className="status-dot" style={{ background: '#10B981' }} />
                  {t('appOnline')}
                </div>
              </div>
              <div className={styles.vmList}>
                {liveVMs.map((vm) => (
                  <div key={vm.name} className={styles.vmRow}>
                    <div className={styles.vmLeft}>
                      <span className={styles.vmDot} style={{ background: vm.status === 'running' ? '#10B981' : '#6B7280' }} />
                      <span className={styles.vmName}>{vm.name}</span>
                    </div>
                    <div className={styles.vmRight}>
                      {vm.status === 'running' ? (
                        <>
                          <div className={styles.metricBar}>
                            <div className={styles.barFill} style={{ width: `${vm.cpu}%`, background: vm.cpu > 60 ? '#EF4444' : vm.cpu > 30 ? '#F59E0B' : '#10B981' }} />
                          </div>
                          <span className={styles.metricText}>{vm.cpu}%</span>
                        </>
                      ) : (
                        <span className={styles.statusBadgeStopped}>{t('vmStopped')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.vncBadge}>
                <Monitor size={16} color="#6366F1" strokeWidth={2} />
                <div>
                  <div className={styles.vncTitle}>{t('vnc')}</div>
                  <div className={styles.vncSub}>{t('vncSub')}</div>
                </div>
                <div className={styles.vncArrow}>›</div>
              </div>
            </div>
          </div>
          <div className={`glass ${styles.floatCard} ${styles.floatCard1}`}>
            <div className={styles.floatIconBox} style={{ background: 'rgba(245,158,11,0.15)' }}>
              <HardDrive size={16} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <div>
              <div className={styles.floatTitle}>{t('floatPBSTitle')}</div>
              <div className={styles.floatSub}>{t('floatPBSSub')}</div>
            </div>
          </div>
          <div className={`glass ${styles.floatCard} ${styles.floatCard2}`}>
            <div className={styles.floatIconBox} style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Cloud size={16} color="#818CF8" strokeWidth={1.75} />
            </div>
            <div>
              <div className={styles.floatTitle}>{t('floatRelayTitle')}</div>
              <div className={styles.floatSub}>{t('floatRelaySub')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
