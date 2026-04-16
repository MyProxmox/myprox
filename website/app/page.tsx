import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Roadmap from '@/components/Roadmap';
import PricingTable from '@/components/PricingTable';
import Footer from '@/components/Footer';
import styles from './page.module.css';

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
                <a href="#" className="btn btn-primary">
                  🍎 App Store (Bientôt)
                </a>
                <a href="#" className="btn btn-outline">
                  🤖 Google Play (Bientôt)
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
