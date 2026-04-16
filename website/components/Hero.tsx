import Image from 'next/image';
import Link from 'next/link';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={`section glow-bg ${styles.hero}`}>
      <div className={`container ${styles.inner}`}>
        {/* Left: copy */}
        <div className={styles.copy}>
          <div className="badge animate-fade-up">✦ Nouveauté — Mode Cloud disponible</div>

          <h1 className={`animate-fade-up-1 ${styles.headline}`}>
            Votre Proxmox,<br />
            <span className="grad-text">dans votre poche</span>
          </h1>

          <p className={`animate-fade-up-2 ${styles.sub}`}>
            Gérez vos VMs, containers LXC et nodes Proxmox directement depuis votre iPhone ou Android.
            En local ou via tunnel cloud sécurisé — partout, tout le temps.
          </p>

          <div className={`animate-fade-up-3 ${styles.ctas}`}>
            <a href="#download" className="btn btn-primary">
              📱 Télécharger l'app
            </a>
            <Link href="/docs" className="btn btn-outline">
              Voir la doc →
            </Link>
          </div>

          <div className={`animate-fade-up-3 ${styles.stats}`}>
            {[
              { value: '100%', label: 'Open Source' },
              { value: 'AES-256', label: 'Chiffrement' },
              { value: '0€', label: 'Pour commencer' },
            ].map((s) => (
              <div key={s.label} className={styles.stat}>
                <span className={`grad-text ${styles.statValue}`}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: logo flottant */}
        <div className={`animate-float ${styles.visual}`}>
          <div className={styles.logoWrap}>
            <Image src="/logo.png" alt="MyProx" width={300} height={300} priority />
            <div className={styles.glow} />
          </div>

          {/* Floating badges */}
          <div className={`glass ${styles.floatBadge} ${styles.floatBadge1}`}>
            <span className={styles.dot} style={{ background: '#4CAF50' }} />
            3 VMs running
          </div>
          <div className={`glass ${styles.floatBadge} ${styles.floatBadge2}`}>
            ☁ Cloud connecté
          </div>
        </div>
      </div>
    </section>
  );
}
