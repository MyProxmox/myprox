import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/Navbar';
import PricingTable from '@/components/PricingTable';
import Footer from '@/components/Footer';
import styles from './pricing.module.css';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pricingPage');
  return { title: t('metaTitle'), description: t('metaDesc') };
}

export default async function PricingPage() {
  const t = await getTranslations('pricingPage');

  const faq = [
    { q: t('faq0Q'), a: t('faq0A') },
    { q: t('faq1Q'), a: t('faq1A') },
    { q: t('faq2Q'), a: t('faq2A') },
    { q: t('faq3Q'), a: t('faq3A') },
    { q: t('faq4Q'), a: t('faq4A') },
  ];

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 100 }}>
        <PricingTable />
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2><span className="grad-text">{t('faqTitle')}</span></h2>
            </div>
            <div className={styles.faq}>
              {faq.map((item) => (
                <div key={item.q} className={`glass ${styles.faqItem}`}>
                  <h3 className={styles.faqQ}>{item.q}</h3>
                  <p className={styles.faqA}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
