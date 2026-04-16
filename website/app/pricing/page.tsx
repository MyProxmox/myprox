import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import PricingTable from '@/components/PricingTable';
import Footer from '@/components/Footer';
import styles from './pricing.module.css';

export const metadata: Metadata = {
  title: 'Tarifs — MyProx',
  description: 'Découvrez les plans MyProx. Commencez gratuitement, passez en Premium à 4,99€/mois pour un accès illimité.',
};

const faq = [
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, sans engagement. Votre abonnement reste actif jusqu\'à la fin de la période facturée.',
  },
  {
    q: 'Est-ce que mes données Proxmox sont stockées sur vos serveurs ?',
    a: 'Non. Vos credentials sont chiffrés AES-256 en base de données. En mode cloud, le trafic passe par notre relay sans être stocké.',
  },
  {
    q: 'Le mode cloud est-il sécurisé ?',
    a: 'Oui. L\'agent local établit une connexion WebSocket chiffrée vers notre relay. Votre IP Proxmox ne sort jamais sur internet.',
  },
  {
    q: 'Combien de serveurs puis-je ajouter en Premium ?',
    a: 'Un nombre illimité de serveurs locaux et cloud. Gérez votre homelab complet depuis une seule app.',
  },
  {
    q: 'Quelle est la différence entre mode Local et Cloud ?',
    a: 'Le mode Local se connecte directement à votre Proxmox sur votre réseau WiFi. Le mode Cloud utilise notre agent Go pour un accès depuis n\'importe quel réseau.',
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 100 }}>
        <PricingTable />

        {/* FAQ */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2>Questions <span className="grad-text">fréquentes</span></h2>
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
