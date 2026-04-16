import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
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
          <Link href="/#features">Fonctionnalités</Link>
          <Link href="/#how">Comment ça marche</Link>
          <Link href="/#roadmap">Roadmap</Link>
          <Link href="/pricing">Tarifs</Link>
          <Link href="/docs">Docs</Link>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Status indicator */}
          <div className={styles.status}>
            <span className="status-dot" style={{ background: '#10B981' }} />
            <span>Production</span>
          </div>
          <Link href="#download" className="btn btn-primary btn-sm">
            🚀 Accès Bêta
          </Link>
        </div>
      </div>
    </nav>
  );
}
