import {
  Home, Cloud, Monitor, Zap, HardDrive,
  ShieldCheck, Bell, RefreshCw, CheckCircle2
} from 'lucide-react';
import styles from './Features.module.css';

const features = [
  {
    Icon: Home,
    iconBg: 'rgba(16,185,129,0.12)',
    iconColor: '#10B981',
    title: 'Mode Local',
    badge: 'Gratuit',
    badgeColor: '#10B981',
    desc: 'Connectez-vous directement à votre Proxmox sur votre réseau LAN. Zéro latence, zéro intermédiaire.',
    tags: ['LAN', 'Zéro latence', 'Sans compte'],
  },
  {
    Icon: Cloud,
    iconBg: 'rgba(99,102,241,0.12)',
    iconColor: '#818CF8',
    title: 'Cloud Relay',
    badge: 'Premium',
    badgeColor: '#818CF8',
    desc: 'Accédez depuis n\'importe où via notre tunnel WebSocket chiffré. Votre IP Proxmox reste privée.',
    tags: ['AES-256', 'WebSocket', 'Partout'],
  },
  {
    Icon: Monitor,
    iconBg: 'rgba(6,182,212,0.12)',
    iconColor: '#06B6D4',
    title: 'Console VNC',
    badge: 'Nouveau',
    badgeColor: '#06B6D4',
    desc: 'Pilotez la console graphique de vos VMs directement depuis votre téléphone. Mode paysage auto.',
    tags: ['NoVNC', 'WebView', 'Natif'],
  },
  {
    Icon: Zap,
    iconBg: 'rgba(124,58,237,0.12)',
    iconColor: '#A78BFA',
    title: 'Contrôle total',
    badge: 'Gratuit',
    badgeColor: '#10B981',
    desc: 'Start, Stop, Restart vos VMs et containers LXC. Monitoring CPU & RAM en temps réel.',
    tags: ['VM', 'LXC', 'Monitoring'],
  },
  {
    Icon: HardDrive,
    iconBg: 'rgba(245,158,11,0.12)',
    iconColor: '#F59E0B',
    title: 'Proxmox Backup Server',
    badge: 'Bientôt',
    badgeColor: '#F59E0B',
    desc: 'Ajoutez vos serveurs PBS, consultez vos Datastores, suivez les jobs de backup et de Prune.',
    tags: ['PBS', 'Datastores', 'Logs'],
  },
  {
    Icon: ShieldCheck,
    iconBg: 'rgba(239,68,68,0.1)',
    iconColor: '#F87171',
    title: 'Sécurité maximale',
    badge: 'Gratuit',
    badgeColor: '#10B981',
    desc: 'JWT 15min, stockage iOS/Android sécurisé (Keychain), chiffrement AES-256-CBC des credentials.',
    tags: ['JWT', 'Keychain', 'Zero trust'],
  },
  {
    Icon: Bell,
    iconBg: 'rgba(6,182,212,0.1)',
    iconColor: '#67E8F9',
    title: 'Notifications Push',
    badge: 'Bientôt',
    badgeColor: '#F59E0B',
    desc: 'Alertes intelligentes si un nœud tombe, si un backup échoue ou si une mise à jour critique est disponible.',
    tags: ['APNs', 'Firebase', 'Alert'],
  },
  {
    Icon: RefreshCw,
    iconBg: 'rgba(99,102,241,0.08)',
    iconColor: '#6366F1',
    title: 'Sync iCloud',
    badge: 'Premium',
    badgeColor: '#818CF8',
    desc: 'Vos serveurs et identifiants se synchronisent automatiquement sur tous vos appareils Apple.',
    tags: ['iCloud KVS', 'Multi-device', 'Chiffré'],
  },
];

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-header">
          <div className="badge" style={{ marginBottom: 16 }}>Fonctionnalités</div>
          <h2>
            Tout ce qu&apos;il faut pour<br />
            <span className="grad-text">gérer Proxmox en mobilité</span>
          </h2>
          <p>
            Une interface native, rapide et sécurisée. Tout ce que vous faites sur l&apos;interface web Proxmox,
            disponible depuis votre téléphone.
          </p>
        </div>
        <div className={styles.grid}>
          {features.map((f) => (
            <div key={f.title} className={`glass ${styles.card}`}>
              <div className={styles.cardTop}>
                <div className={styles.iconBox} style={{ background: f.iconBg }}>
                  <f.Icon size={22} color={f.iconColor} strokeWidth={1.75} />
                </div>
                <span
                  className={styles.featureBadge}
                  style={{ color: f.badgeColor, background: `${f.badgeColor}18`, borderColor: `${f.badgeColor}35` }}
                >
                  {f.badge}
                </span>
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
