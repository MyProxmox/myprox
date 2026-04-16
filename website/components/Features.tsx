import styles from './Features.module.css';

const features = [
  {
    icon: '⌂',
    iconBg: 'rgba(76,175,80,0.15)',
    iconColor: '#4CAF50',
    title: 'Mode Local',
    desc: 'Connectez-vous directement à votre Proxmox sur votre réseau local. Pas de cloud, pas de latence — accès direct.',
    tags: ['LAN', 'Zéro latence', 'Sans compte'],
  },
  {
    icon: '☁',
    iconBg: 'rgba(37,99,235,0.15)',
    iconColor: '#60A5FA',
    title: 'Cloud Relay',
    desc: 'Accédez à vos serveurs depuis n\'importe où grâce au tunnel WebSocket chiffré. Votre IP ne sort jamais.',
    tags: ['AES-256', 'WebSocket', 'Partout'],
  },
  {
    icon: '⚡',
    iconBg: 'rgba(124,58,237,0.15)',
    iconColor: '#A78BFA',
    title: 'Contrôle total',
    desc: 'Start, Stop, Restart vos VMs et Containers LXC. Monitoring CPU & RAM en temps réel avec alertes couleur.',
    tags: ['VM', 'LXC', 'Monitoring'],
  },
  {
    icon: '🔒',
    iconBg: 'rgba(239,68,68,0.1)',
    iconColor: '#F87171',
    title: 'Sécurisé',
    desc: 'JWT 15min, stockage sécurisé iOS/Android avec expo-secure-store, chiffrement AES-256-CBC des credentials.',
    tags: ['JWT', 'SecureStore', 'Zero trust'],
  },
  {
    icon: '📊',
    iconBg: 'rgba(249,115,22,0.15)',
    iconColor: '#FB923C',
    title: 'Monitoring live',
    desc: 'Barres de progression CPU et RAM colorées en temps réel. Vert → Orange → Rouge selon la charge.',
    tags: ['CPU', 'RAM', 'Temps réel'],
  },
  {
    icon: '📱',
    iconBg: 'rgba(236,72,153,0.15)',
    iconColor: '#F472B6',
    title: 'iOS & Android',
    desc: 'Application native React Native / Expo. Disponible TestFlight et bientôt sur l\'App Store et Play Store.',
    tags: ['iOS', 'Android', 'Native'],
  },
];

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-header">
          <div className="badge" style={{ marginBottom: 16 }}>Fonctionnalités</div>
          <h2>Tout ce dont vous avez besoin pour<br /><span className="grad-text">gérer Proxmox en mobilité</span></h2>
          <p>Une interface simple et puissante pour vos serveurs de virtualisation, accessible depuis votre téléphone.</p>
        </div>
        <div className={styles.grid}>
          {features.map((f) => (
            <div key={f.title} className={`glass ${styles.card}`}>
              <div className={styles.iconBox} style={{ background: f.iconBg }}>
                <span style={{ fontSize: 28, color: f.iconColor }}>{f.icon}</span>
              </div>
              <h3 className={styles.title}>{f.title}</h3>
              <p className={styles.desc}>{f.desc}</p>
              <div className={styles.tags}>
                {f.tags.map((t) => (
                  <span key={t} className={styles.tag}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
