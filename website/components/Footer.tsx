import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { GitBranch } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logoMark}>M</div>
          <div>
            <div className={styles.logoText}>MyProx</div>
            <div className={styles.tagline}>{t('tagline')}</div>
          </div>
        </div>

        {/* Links */}
        <div className={styles.links}>
          <div className={styles.group}>
            <div className={styles.groupTitle}>{t('product')}</div>
            <Link href="/#features">{t('features')}</Link>
            <Link href="/#how">{t('how')}</Link>
            <Link href="/pricing">{t('pricing')}</Link>
            <Link href="/#roadmap">{t('roadmap')}</Link>
          </div>
          <div className={styles.group}>
            <div className={styles.groupTitle}>{t('developers')}</div>
            <Link href="/docs">{t('docs')}</Link>
            <a href="https://github.com/MyProxmox/myprox" target="_blank" rel="noopener noreferrer" className={styles.extLink}>
              GitHub
              <GitBranch size={12} />
            </a>
            <Link href="/docs#agent">{t('deployAgent')}</Link>
          </div>
          <div className={styles.group}>
            <div className={styles.groupTitle}>{t('legal')}</div>
            <Link href="/legal/privacy">{t('privacy')}</Link>
            <Link href="/legal/terms">{t('terms')}</Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={`container ${styles.bottom}`}>
        <span>{t('copyright')}</span>
        <div className={styles.status}>
          <span className="status-dot" style={{ background: '#10B981' }} />
          <span>{t('statusLabel')}</span>
        </div>
      </div>
    </footer>
  );
}
