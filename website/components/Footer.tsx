import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logoMark}>M</div>
          <div>
            <div className={styles.logoText}>MyProx</div>
            <div className={styles.tagline}>Proxmox dans votre poche.</div>
          </div>
        </div>

        {/* Links */}
        <div className={styles.links}>
          <div className={styles.group}>
            <div className={styles.groupTitle}>Produit</div>
            <Link href="/#features">Fonctionnalités</Link>
            <Link href="/#how">Comment ça marche</Link>
            <Link href="/pricing">Tarifs</Link>
            <Link href="/#roadmap">Roadmap</Link>
          </div>
          <div className={styles.group}>
            <div className={styles.groupTitle}>Développeurs</div>
            <Link href="/docs">Documentation</Link>
            <a href="https://github.com/MyProxmox" target="_blank" rel="noopener noreferrer">GitHub</a>
            <Link href="/docs#agent">Déployer l&apos;agent</Link>
          </div>
          <div className={styles.group}>
            <div className={styles.groupTitle}>Légal</div>
            <Link href="/legal/privacy">Confidentialité</Link>
            <Link href="/legal/terms">CGU</Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={`container ${styles.bottom}`}>
        <span>© 2024–2026 MyProx. Tous droits réservés.</span>
        <div className={styles.status}>
          <span className="status-dot" style={{ background: '#10B981' }} />
          <span>api.myprox.app · Opérationnel</span>
        </div>
      </div>
    </footer>
  );
}
