const plans = [
  {
    name: 'Free',
    price: '0€',
    period: '/mois',
    desc: 'Parfait pour piloter votre homelab personnel.',
    popular: false,
    cta: 'Commencer gratuitement',
    ctaHref: '#download',
    external: false,
    features: [
      { label: '1 serveur Proxmox (PVE)', ok: true },
      { label: '1 serveur Backup (PBS)', ok: true },
      { label: 'Gestion VMs & LXC', ok: true },
      { label: 'Monitoring CPU/RAM temps réel', ok: true },
      { label: 'Console VNC locale', ok: true },
      { label: 'Diagnostics systèmes', ok: true },
      { label: 'Notifications Push', ok: true },
      { label: 'Cloud Relay (accès distant)', ok: false },
      { label: 'Serveurs illimités', ok: false },
      { label: 'Synchronisation iCloud', ok: false },
    ],
  },
  {
    name: 'Premium',
    price: '4,99€',
    period: '/mois',
    desc: 'Pour les pros et les homelabers sérieux.',
    popular: true,
    cta: '⚡ Passer à Premium',
    ctaHref: 'https://api.myprox.app/api/v1/stripe/checkout',
    external: true,
    features: [
      { label: 'Serveurs PVE illimités', ok: true },
      { label: 'Serveurs PBS illimités', ok: true },
      { label: 'Gestion VMs & LXC', ok: true },
      { label: 'Monitoring CPU/RAM temps réel', ok: true },
      { label: 'Console VNC (local + cloud)', ok: true },
      { label: 'Diagnostics systèmes avancés', ok: true },
      { label: 'Notifications Push prioritaires', ok: true },
      { label: 'Cloud Relay (tunnel sécurisé)', ok: true },
      { label: 'Accès multi-serveurs simultané', ok: true },
      { label: 'Synchronisation iCloud', ok: true },
    ],
  },
];

import styles from './PricingTable.module.css';

export default function PricingTable({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`section ${!compact ? 'glow-bg' : ''}`} id="pricing">
      <div className="container">
        {!compact && (
          <div className="section-header">
            <div className="badge" style={{ marginBottom: 16 }}>Tarifs</div>
            <h2>Simple et <span className="grad-text">transparent</span></h2>
            <p>Commencez gratuitement, passez Premium quand vous avez besoin de plus.</p>
          </div>
        )}
        <div className={styles.grid}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass ${styles.card} ${plan.popular ? 'pricing-popular' : ''}`}
            >
              <div className={styles.top}>
                <div className={styles.planRow}>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  {!plan.popular && (
                    <span className={styles.freeBadge}>Gratuit pour toujours</span>
                  )}
                </div>
                <div className={styles.priceRow}>
                  <span className={`grad-text ${styles.price}`}>{plan.price}</span>
                  <span className={styles.period}>{plan.period}</span>
                </div>
                <p className={styles.desc}>{plan.desc}</p>
              </div>

              <a
                href={plan.ctaHref}
                target={plan.external ? '_blank' : undefined}
                rel={plan.external ? 'noopener noreferrer' : undefined}
                className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} ${styles.cta}`}
              >
                {plan.cta}
              </a>

              <ul className={styles.features}>
                {plan.features.map((f) => (
                  <li key={f.label} className={`${styles.feature} ${!f.ok ? styles.featureOff : ''}`}>
                    <span className={f.ok ? styles.checkOk : styles.checkNo}>
                      {f.ok ? '✓' : '✗'}
                    </span>
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {!compact && (
          <p className={styles.note}>
            Paiement sécurisé via Stripe. Sans engagement. Annulez à tout moment depuis l&apos;application.
          </p>
        )}
      </div>
    </section>
  );
}
