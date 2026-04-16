import Image from 'next/image';
import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo-horizontal.png" alt="MyProx" width={130} height={36} priority />
        </Link>
        <div className={styles.links}>
          <Link href="/#features">Fonctionnalités</Link>
          <Link href="/#how">Comment ça marche</Link>
          <Link href="/pricing">Tarifs</Link>
          <Link href="/docs">Docs</Link>
        </div>
        <div className={styles.actions}>
          <Link href="/pricing" className="btn btn-outline" style={{ padding: '9px 20px', fontSize: '14px' }}>
            Tarifs
          </Link>
          <Link href="#download" className="btn btn-primary" style={{ padding: '9px 20px', fontSize: '14px' }}>
            Télécharger
          </Link>
        </div>
      </div>
    </nav>
  );
}
