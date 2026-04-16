import Link from 'next/link';
import { Monitor, Cloud, Activity, HardDrive, Server } from 'lucide-react';
import styles from './Hero.module.css';

const stats = [
  { value: '100%', label: 'Open Source', color: '#10B981' },
  { value: 'AES-256', label: 'Chiffrement End-to-End', color: '#6366F1' },
  { value: 'Live', label: 'Production mondiale', color: '#06B6D4' },
];

const liveVMs = [
  { name: 'k3s-master',  status: 'running', cpu: 28, ram: 52 },
  { name: 'plex-media',  status: 'running', cpu: 8,  ram: 34 },
  { name: 'win-gaming',  status: 'stopped', cpu: 0,  ram: 0  },
];

export default function Hero() {
  return (
    <section className={`section glow-bg glow-bg-b ${styles.hero}`}>
      <div className={`container ${styles.inner}`}>

        {/* ── Left Copy ── */}
        <div className={styles.copy}>
          <div className={`badge badge-green animate-fade-up`}>
            <span className="status-dot" style={{ background: '#10B981' }} />
            v1.0 · Disponible en Bêta
          </div>

          <h1 className={`animate-fade-up-1 ${styles.headline}`}>
            Pilotez Proxmox<br />
            <span className="grad-text">depuis votre poche</span>
          </h1>

          <p className={`animate-fade-up-2 ${styles.sub}`}>
            Gérez vos VMs et containers LXC dans le creux de votre main. En local ou via notre cloud relay sécurisé.
          </p>

          <div className={`animate-fade-up-3 ${styles.ctas}`}>
            <a href="#download" className="btn btn-primary">
              Télécharger la Bêta
            </a>
            <Link href="/docs" className="btn btn-outline">
              Voir la doc →
            </Link>
          </div>

          <div className={`animate-fade-up-4 ${styles.stats}`}>
            {stats.map((s) => (
              <div key={s.label} className={styles.stat}>
                <span className={styles.statValue} style={{ color: s.color }}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Visual: App Mockup ── */}
        <div className={`animate-float ${styles.visual}`}>
          {/* Phone frame */}
          <div className={styles.phone}>
            <div className={styles.phoneNotch} />
            <div className={styles.phoneScreen}>
              {/* Header */}
              <div className={styles.appHeader}>
                <div>
                  <div className={styles.appTitle}>Mes Serveurs</div>
                  <div className={styles.appSub}>Proxmox Home Lab</div>
                </div>
                <div className={styles.appPill}>
                  <span className="status-dot" style={{ background: '#10B981' }} />
                  En ligne
                </div>
              </div>

              {/* VM List */}
              <div className={styles.vmList}>
                {liveVMs.map((vm) => (
                  <div key={vm.name} className={styles.vmRow}>
                    <div className={styles.vmLeft}>
                      <span
                        className={styles.vmDot}
                        style={{ background: vm.status === 'running' ? '#10B981' : '#6B7280' }}
                      />
                      <span className={styles.vmName}>{vm.name}</span>
                    </div>
                    <div className={styles.vmRight}>
                      {vm.status === 'running' ? (
                        <>
                          <div className={styles.metricBar}>
                            <div className={styles.barFill} style={{
                              width: `${vm.cpu}%`,
                              background: vm.cpu > 60 ? '#EF4444' : vm.cpu > 30 ? '#F59E0B' : '#10B981'
                            }} />
                          </div>
                          <span className={styles.metricText}>{vm.cpu}%</span>
                        </>
                      ) : (
                        <span className={styles.statusBadgeStopped}>Arrêtée</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* VNC Console Badge */}
              <div className={styles.vncBadge}>
                <Monitor size={16} color="#6366F1" strokeWidth={2} />
                <div>
                  <div className={styles.vncTitle}>Console VNC</div>
                  <div className={styles.vncSub}>Accès direct — k3s-master</div>
                </div>
                <div className={styles.vncArrow}>›</div>
              </div>
            </div>
          </div>

          {/* Floating decorations */}
          <div className={`glass ${styles.floatCard} ${styles.floatCard1}`}>
            <div className={styles.floatIconBox} style={{ background: 'rgba(245,158,11,0.15)' }}>
              <HardDrive size={16} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <div>
              <div className={styles.floatTitle}>PBS Backup</div>
              <div className={styles.floatSub}>Hier · Succès</div>
            </div>
          </div>

          <div className={`glass ${styles.floatCard} ${styles.floatCard2}`}>
            <div className={styles.floatIconBox} style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Cloud size={16} color="#818CF8" strokeWidth={1.75} />
            </div>
            <div>
              <div className={styles.floatTitle}>Cloud Relay</div>
              <div className={styles.floatSub}>Paris — 12ms</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
