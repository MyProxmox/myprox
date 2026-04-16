import styles from './page.module.css';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Roadmap from '@/components/Roadmap';
import PricingTable from '@/components/PricingTable';
import Footer from '@/components/Footer';
import { Smartphone } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <div className="divider" />
        <Features />
        <div className="divider" />
        <HowItWorks />
        <div className="divider" />
        <Roadmap />
        <div className="divider" />
        <PricingTable compact />
        <div className="divider" />

        {/* Download CTA */}
        <section className={`section glow-bg glow-bg-b ${styles.download}`} id="download">
          <div className="container">
            <div className={`glass ${styles.ctaBox}`}>
              <div className="badge badge-green" style={{ marginBottom: 20 }}>
                <span className="status-dot" style={{ background: '#10B981' }} />
                Bêta ouverte
              </div>
              <h2>
                Prêt à maîtriser<br />
                <span className="grad-text">votre infra Proxmox ?</span>
              </h2>
              <p>
                Rejoignez la bêta et commencez gratuitement. iOS via TestFlight, Android bientôt disponible.
              </p>
              <div className={styles.ctaBtns}>
                <a href="#" className={`btn btn-primary ${styles.storeBtn}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  App Store — Bientôt
                </a>
                <a href="#" className={`btn btn-outline ${styles.storeBtn}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.18 23.76c.37.21.8.21 1.17 0l10.89-6.29L12 14.24l-8.82 9.52zM.54 1.49C.2 1.91.02 2.49.02 3.16v17.69c0 .67.18 1.25.52 1.67l.09.09 9.9-9.9v-.23L.54 1.49zM21 10.38l-2.55-1.47-3.1 3.1 3.1 3.1 2.57-1.49c.73-.42.73-1.1 0-1.52L21 10.38z M4.35.24L15.24 6.53 12 9.77.54 1.49C.91.63 1.92.15 4.35.24z"/>
                  </svg>
                  Google Play — Bientôt
                </a>
              </div>
              <p className={styles.betaNote}>
                Accès bêta via TestFlight disponible maintenant —{' '}
                <a href="/docs">voir la documentation</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
