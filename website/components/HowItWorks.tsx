import styles from './HowItWorks.module.css';

const steps = [
  {
    num: '01',
    title: 'Téléchargez MyProx',
    desc: 'Installez l\'application depuis TestFlight (iOS) ou le Play Store (Android). Créez votre compte en 30 secondes.',
    icon: '📲',
  },
  {
    num: '02',
    title: 'Ajoutez votre serveur',
    desc: 'Entrez l\'IP de votre Proxmox, vos identifiants et choisissez le mode : Local (réseau LAN) ou Cloud (accès distant).',
    icon: '🖥',
  },
  {
    num: '03',
    title: 'Mode Cloud ? Déployez l\'agent',
    desc: 'Lancez notre agent Go sur votre réseau local (Docker en une commande). Il établit le tunnel sécurisé automatiquement.',
    icon: '☁',
  },
  {
    num: '04',
    title: 'Gérez depuis partout',
    desc: 'Start, Stop, Restart. Monitoring CPU et RAM. Suppression de VMs. Tout depuis votre téléphone où que vous soyez.',
    icon: '⚡',
  },
];

export default function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="container">
        <div className="section-header">
          <div className="badge" style={{ marginBottom: 16 }}>Comment ça marche</div>
          <h2>Opérationnel en <span className="grad-text">moins de 5 minutes</span></h2>
          <p>Setup simple, résultat immédiat. Pas de configuration réseau complexe, pas de VPN.</p>
        </div>

        <div className={styles.steps}>
          {steps.map((s, i) => (
            <div key={s.num} className={styles.step}>
              <div className={styles.line}>
                <div className={styles.numBadge}>
                  <span className="grad-text">{s.num}</span>
                </div>
                {i < steps.length - 1 && <div className={styles.connector} />}
              </div>
              <div className={`glass ${styles.card}`}>
                <div className={styles.cardIcon}>{s.icon}</div>
                <h3 className={styles.cardTitle}>{s.title}</h3>
                <p className={styles.cardDesc}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Code snippet */}
        <div className={`glass ${styles.snippet}`}>
          <div className={styles.snippetHeader}>
            <div className={styles.dot} style={{ background: '#f44336' }} />
            <div className={styles.dot} style={{ background: '#FF9800' }} />
            <div className={styles.dot} style={{ background: '#4CAF50' }} />
            <span className={styles.snippetTitle}>Déploiement agent — 1 commande</span>
          </div>
          <pre className={styles.code}>{`docker run -d \\
  --name myprox-agent \\
  -e RELAY_URL=wss://relay.myprox.app/agent/connect \\
  -e AGENT_TOKEN=<votre_token> \\
  -e PROXMOX_URL=https://10.0.0.10:8006/api2/json \\
  -e PROXMOX_USER=root@pam \\
  -e PROXMOX_PASS=<motdepasse> \\
  --restart unless-stopped \\
  myprox/agent:latest`}</pre>
        </div>
      </div>
    </section>
  );
}
