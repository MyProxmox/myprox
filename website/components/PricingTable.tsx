import styles from './PricingTable.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.myprox.app';

const plans = [
  {
    name: 'Free',
    price: '0€',
    period: '/mois',
    desc: 'Parfait pour débuter avec votre homelab.',
    popular: false,
    cta: 'Commencer gratuitement',
    ctaHref: '#download',
    external: false,
    features: [
      { label: '1 serveur local', ok: true },
      { label: 'Gestion VMs & LXC', ok: true },
      { label: 'Monitoring CPU/RAM', ok: true },
      { label: 'Mode Cloud', ok: false },
      { label: 'Accès simultané multi-serveurs', ok: false },
      { label: 'Support prioritaire', ok: false },
    ],
  },
  {
    name: 'Premium',
    price: '4,99€',
    period: '/mois',
    desc: 'Pour les power users et professionnels.',
    popular: true,
    cta: '⚡ Passer à Premium',
    // Redirects to Stripe Checkout (user must be logged in on mobile first)
    ctaHref: `${API_URL}/api/v1/stripe/checkout`,
    external: true,
    features: [
      { label: 'Serveurs locaux illimités', ok: true },
      { label: 'Gestion VMs & LXC', ok: true },
      { label: 'Monitoring CPU/RAM', ok: true },
      { label: 'Mode Cloud (tunnel sécurisé)', ok: true },
      { label: 'Accès simultané multi-serveurs', ok: true },
      { label: 'Support prioritaire', ok: true },
    ],
  },
];

export default function PricingTable({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`section ${!compact ? 'glow-bg' : ''}`} id="pricing">
      <div className="container">
        {!compact && (
          <div className="section-header">
            <div className="badge" style={{ marginBottom: 16 }}>Tarifs</div>
            <h2>Simple et <span className="grad-text">transparent</span></h2>
            <p>Commencez gratuitement. Passez en Premium quand vous êtes prêt.</p>
          </div>
        )}
        <div className={styles.grid}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`glass ${styles.card} ${plan.popular ? 'pricing-popular' : ''}`}
            >
              <div className={styles.top}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.priceRow}>
                  <span className={`grad-text ${styles.price}`}>{plan.price}</span>
                  <span className={styles.period}>{plan.period}</span>
                </div>
                <p className={styles.desc}>{plan.desc}</p>
              </div>
              <ul className={styles.features}>
                {plan.features.map((f) => (
                  <li key={f.label} className={`${styles.feature} ${!f.ok ? styles.featureOff : ''}`}>
                    <span className={styles.check}>{f.ok ? '✓' : '✗'}</span>
                    {f.label}
                  </li>
                ))}
              </ul>
              <a
                href={plan.ctaHref}
                target={plan.external ? '_blank' : undefined}
                rel={plan.external ? 'noopener noreferrer' : undefined}
                className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} ${styles.cta}`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
        {!compact && (
          <p className={styles.note}>
            Paiement sécurisé via Stripe. Sans engagement. Annulez à tout moment.
          </p>
        )}
      </div>
    </section>
  );
}
