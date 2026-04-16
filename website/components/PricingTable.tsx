import { useTranslations } from 'next-intl';
import { Check, X } from 'lucide-react';
import styles from './PricingTable.module.css';

export default function PricingTable({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('pricing');

  const plans = [
    {
      name: t('freeName'),
      price: '0€',
      period: t('freePeriod'),
      desc: t('freeDesc'),
      popular: false,
      cta: t('freeCta'),
      ctaHref: '#download',
      external: false,
      features: [
        { label: t('freeF0'), ok: true },
        { label: t('freeF1'), ok: true },
        { label: t('freeF2'), ok: true },
        { label: t('freeF3'), ok: true },
        { label: t('freeF4'), ok: true },
        { label: t('freeF5'), ok: true },
        { label: t('freeF6'), ok: true },
        { label: t('freeF7'), ok: false },
        { label: t('freeF8'), ok: false },
        { label: t('freeF9'), ok: false },
      ],
    },
    {
      name: t('premiumName'),
      price: t('premiumPrice'),
      period: t('premiumPeriod'),
      desc: t('premiumDesc'),
      popular: true,
      cta: t('premiumCta'),
      ctaHref: 'https://api.myprox.app/api/v1/stripe/checkout',
      external: true,
      features: [
        { label: t('premiumF0'), ok: true },
        { label: t('premiumF1'), ok: true },
        { label: t('premiumF2'), ok: true },
        { label: t('premiumF3'), ok: true },
        { label: t('premiumF4'), ok: true },
        { label: t('premiumF5'), ok: true },
        { label: t('premiumF6'), ok: true },
        { label: t('premiumF7'), ok: true },
        { label: t('premiumF8'), ok: true },
        { label: t('premiumF9'), ok: true },
      ],
    },
  ];

  return (
    <section className={`section ${!compact ? 'glow-bg' : ''}`} id="pricing">
      <div className="container">
        {!compact && (
          <div className="section-header">
            <div className="badge" style={{ marginBottom: 16 }}>{t('badge')}</div>
            <h2>{t('title')} <span className="grad-text">{t('titleGrad')}</span></h2>
            <p>{t('sub')}</p>
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
                    <span className={styles.freeBadge}>{t('freeBadge')}</span>
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
                      {f.ok
                        ? <Check size={12} color="#10B981" strokeWidth={2.5} />
                        : <X size={12} color="#6B7280" strokeWidth={2.5} />
                      }
                    </span>
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {!compact && (
          <p className={styles.note}>{t('note')}</p>
        )}
      </div>
    </section>
  );
}
