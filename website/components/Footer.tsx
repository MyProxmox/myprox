import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="divider" />
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <Image src="/logo-horizontal.png" alt="MyProx" width={110} height={30} />
          <p className={styles.tagline}>Gérez votre Proxmox depuis votre poche.</p>
          <p className={styles.legal}>© {new Date().getFullYear()} MyProx. Tous droits réservés.</p>
        </div>
        <div className={styles.cols}>
          <div className={styles.col}>
            <h4>Produit</h4>
            <Link href="/#features">Fonctionnalités</Link>
            <Link href="/pricing">Tarifs</Link>
            <Link href="/docs">Documentation</Link>
          </div>
          <div className={styles.col}>
            <h4>Légal</h4>
            <Link href="/privacy">Confidentialité</Link>
            <Link href="/terms">CGU</Link>
          </div>
          <div className={styles.col}>
            <h4>Communauté</h4>
            <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
            <a href="https://discord.com" target="_blank" rel="noopener">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
