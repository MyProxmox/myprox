import {
  Smartphone, Server, Cloud, Zap,
  HardDrive, Settings, Activity, Bell, CloudCog, Check
} from 'lucide-react';
import styles from './Roadmap.module.css';

const released = [
  { Icon: Smartphone, color: '#6366F1', label: 'Application iOS & Android native' },
  { Icon: Server,     color: '#818CF8', label: 'Mode Local (connexion directe LAN)' },
  { Icon: Cloud,      color: '#06B6D4', label: 'Cloud Relay (tunnel WebSocket chiffré)' },
  { Icon: Zap,        color: '#10B981', label: 'Contrôle VMs & LXC (Start/Stop/Restart)' },
  { Icon: Activity,   color: '#F59E0B', label: 'Monitoring CPU & RAM en temps réel' },
  { Icon: Server,     color: '#67E8F9', label: 'Console VNC mobile (autolandscape)' },
  { Icon: CloudCog,   color: '#A78BFA', label: 'CI/CD automatisé — Production live' },
];

const upcoming = [
  { Icon: HardDrive, color: '#06B6D4', label: 'Support Proxmox Backup Server (PBS)', badge: 'Phase 7' },
  { Icon: Settings,  color: '#6366F1', label: 'Paramètres & mises à jour APT des nœuds', badge: 'Phase 7' },
  { Icon: Activity,  color: '#10B981', label: 'Diagnostics systèmes (santé disques, VMs)', badge: 'Phase 7' },
  { Icon: Bell,      color: '#F59E0B', label: 'Notifications Push (alertes temps réel)', badge: 'Phase 7' },
  { Icon: Cloud,     color: '#818CF8', label: 'Synchronisation iCloud (Premium)', badge: 'Phase 7' },
  { Icon: Smartphone,color: '#A78BFA', label: 'Publication App Store & Play Store', badge: 'Phase 8' },
];

export default function Roadmap() {
  return (
    <section className="section glow-bg" id="roadmap">
      <div className="container">
        <div className="section-header">
          <div className="badge badge-cyan" style={{ marginBottom: 16 }}>Roadmap</div>
          <h2>Ce qui est prêt, <span className="grad-text">ce qui arrive</span></h2>
          <p>MyProx évolue rapidement. Voici notre avancement transparent.</p>
        </div>

        <div className={styles.grid}>
          {/* Left: Released */}
          <div className={`glass ${styles.column}`}>
            <div className={styles.colHeader}>
              <div className={styles.colDot} style={{ background: '#10B981' }} />
              <h3 className={styles.colTitle}>Disponible maintenant</h3>
            </div>
            <ul className={styles.list}>
              {released.map((r) => (
                <li key={r.label} className={styles.item}>
                  <div className={styles.itemIcon} style={{ background: `${r.color}18` }}>
                    <r.Icon size={14} color={r.color} strokeWidth={2} />
                  </div>
                  <span className={styles.itemLabel}>{r.label}</span>
                  <div className={styles.checkMark}>
                    <Check size={11} color="#10B981" strokeWidth={2.5} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Upcoming */}
          <div className={`glass ${styles.column}`}>
            <div className={styles.colHeader}>
              <div className={styles.colDot} style={{ background: '#F59E0B' }} />
              <h3 className={styles.colTitle}>En cours de développement</h3>
            </div>
            <ul className={styles.list}>
              {upcoming.map((u) => (
                <li key={u.label} className={styles.item}>
                  <div className={styles.itemIcon} style={{ background: `${u.color}18` }}>
                    <u.Icon size={14} color={u.color} strokeWidth={2} />
                  </div>
                  <span className={styles.itemLabel}>{u.label}</span>
                  <span
                    className={styles.badge}
                    style={{
                      color: u.badge === 'Phase 7' ? '#06B6D4' : '#A78BFA',
                      background: u.badge === 'Phase 7' ? 'rgba(6,182,212,0.1)' : 'rgba(124,58,237,0.1)',
                      borderColor: u.badge === 'Phase 7' ? 'rgba(6,182,212,0.25)' : 'rgba(124,58,237,0.25)',
                    }}
                  >
                    {u.badge}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
