import styles from './Roadmap.module.css';

const released = [
  { icon: '📱', label: 'Application iOS & Android native' },
  { icon: '⌂', label: 'Mode Local (connexion directe LAN)' },
  { icon: '☁', label: 'Cloud Relay (tunnel WebSocket chiffré)' },
  { icon: '⚡', label: 'Contrôle VMs & LXC (Start/Stop/Restart)' },
  { icon: '📊', label: 'Monitoring CPU & RAM en temps réel' },
  { icon: '🖥', label: 'Console VNC mobile (autolandscape)' },
  { icon: '🔄', label: 'CI/CD automatisé · Production live' },
];

const upcoming = [
  { icon: '💾', label: 'Support Proxmox Backup Server (PBS)', badge: 'Phase 7' },
  { icon: '⚙️', label: 'Paramètres & mises à jour APT des noeuds', badge: 'Phase 7' },
  { icon: '🩺', label: 'Diagnostics systèmes (santé disques, VMs)', badge: 'Phase 7' },
  { icon: '🔔', label: 'Notifications Push (alertes temps réel)', badge: 'Phase 7' },
  { icon: '☁', label: 'Synchronisation iCloud (Premium)', badge: 'Phase 7' },
  { icon: '🍎', label: 'Publication App Store & Play Store', badge: 'Phase 8' },
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
                  <span className={styles.itemIcon}>{r.icon}</span>
                  <span className={styles.itemLabel}>{r.label}</span>
                  <span className={styles.checkMark}>✓</span>
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
                  <span className={styles.itemIcon}>{u.icon}</span>
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
