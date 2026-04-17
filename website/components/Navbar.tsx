'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  // Close menu on route change / resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav className={styles.nav}>
        <div className={`container ${styles.inner}`}>

          {/* Logo */}
          <Link href="/" className={styles.logo} onClick={close}>
            <img
              src="https://cdn.myprox.app/img/logos/myprox-logo-purple.png"
              alt="MyProx"
              className={styles.logoImg}
            />
          </Link>

          {/* Desktop Links */}
          <div className={styles.links}>
            <Link href="/#features">{t('features')}</Link>
            <Link href="/#how">{t('how')}</Link>
            <Link href="/#roadmap">{t('roadmap')}</Link>
            <Link href="/pricing">{t('pricing')}</Link>
            <Link href="/docs">{t('docs')}</Link>
          </div>

          {/* Desktop Actions */}
          <div className={styles.actions}>
            <div className={styles.langSwitch}>
              <Link href="/" locale="fr" className={locale === 'fr' ? styles.langActive : styles.langBtn}>
                <span className={styles.flag}>🇫🇷</span> FR
              </Link>
              <span className={styles.langSep} />
              <Link href="/" locale="en" className={locale === 'en' ? styles.langActive : styles.langBtn}>
                <span className={styles.flag}>🇬🇧</span> EN
              </Link>
            </div>
            <Link href="/#download" className={`btn btn-primary btn-sm ${styles.desktopCta}`}>
              {t('cta')}
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${open ? styles.mobileMenuOpen : ''}`} aria-hidden={!open}>
        <nav className={styles.mobileNav}>
          <Link href="/#features" className={styles.mobileLink} onClick={close}>{t('features')}</Link>
          <Link href="/#how" className={styles.mobileLink} onClick={close}>{t('how')}</Link>
          <Link href="/#roadmap" className={styles.mobileLink} onClick={close}>{t('roadmap')}</Link>
          <Link href="/pricing" className={styles.mobileLink} onClick={close}>{t('pricing')}</Link>
          <Link href="/docs" className={styles.mobileLink} onClick={close}>{t('docs')}</Link>
        </nav>

        {/* Mobile Lang + CTA */}
        <div className={styles.mobileLang}>
          <Link href="/" locale="fr" className={locale === 'fr' ? styles.langActive : styles.langBtn} onClick={close}>
            <span className={styles.flag}>🇫🇷</span> Français
          </Link>
          <Link href="/" locale="en" className={locale === 'en' ? styles.langActive : styles.langBtn} onClick={close}>
            <span className={styles.flag}>🇬🇧</span> English
          </Link>
        </div>

        <Link href="/#download" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={close}>
          {t('cta')}
        </Link>
      </div>

      {/* Overlay backdrop */}
      {open && <div className={styles.overlay} onClick={close} aria-hidden />}
    </>
  );
}
