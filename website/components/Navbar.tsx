'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();

  return (
    <nav className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoMark}>M</div>
          <span className={styles.logoText}>MyProx</span>
        </Link>

        {/* Links */}
        <div className={styles.links}>
          <Link href="/#features">{t('features')}</Link>
          <Link href="/#how">{t('how')}</Link>
          <Link href="/#roadmap">{t('roadmap')}</Link>
          <Link href="/pricing">{t('pricing')}</Link>
          <Link href="/docs">{t('docs')}</Link>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Language switcher */}
          <div className={styles.langSwitch}>
            <Link
              href="/"
              locale="fr"
              className={locale === 'fr' ? styles.langActive : styles.langBtn}
            >
              <span className={styles.flag}>🇫🇷</span> FR
            </Link>
            <span className={styles.langSep} />
            <Link
              href="/"
              locale="en"
              className={locale === 'en' ? styles.langActive : styles.langBtn}
            >
              <span className={styles.flag}>🇬🇧</span> EN
            </Link>
          </div>

          <Link href="/#download" className="btn btn-primary btn-sm">
            {t('cta')}
          </Link>
        </div>
      </div>
    </nav>
  );
}
