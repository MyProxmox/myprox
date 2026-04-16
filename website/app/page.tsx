import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
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
        <PricingTable compact />
        <div className="divider" />

        {/* Download CTA */}
        <section className={`section glow-bg ${styles.download}`} id="download">
          <div className="container">
            <div className={`glass ${styles.ctaBox}`}>
              <h2>Prêt à gérer votre Proxmox <span className="grad-text">depuis votre téléphone ?</span></h2>
              <p>Rejoignez la beta et commencez gratuitement. Disponible bientôt sur l&apos;App Store et le Play Store.</p>
              <div className={styles.ctaBtns}>
                <a href="#" className={`btn btn-primary ${styles.storeBtnApple}`}>
                  🍎 App Store — Bientôt
                </a>
                <a href="#" className={`btn btn-outline`}>
                  🤖 Google Play — Bientôt
                </a>
              </div>
              <p className={styles.betaNote}>
                Accès beta via TestFlight disponible — <a href="/docs">voir la doc</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
