'use client'

import { useEffect, useCallback } from 'react'
import { Server, Monitor, MemoryStick, Activity, Info, AlertTriangle, XCircle, ExternalLink } from 'lucide-react'
import Header from '@/components/Header'
import StatCard from '@/components/StatCard'
import LiveMetricsBanner from '@/components/LiveMetricsBanner'
import { useOpsStore, NodeStatus, Server as ServerItem } from '@/lib/store'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

function formatUptime(seconds: number): string {
  if (!seconds) return '—'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  if (days > 0) return `${days}j ${hours}h`
  const mins = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

function ProgressBar({
  value,
  color = 'var(--accent)',
  height = 6,
}: {
  value: number
  color?: string
  height?: number
}) {
  const pct = Math.min(100, Math.max(0, value))
  const dynamicColor =
    pct > 90
      ? 'var(--error)'
      : pct > 70
      ? 'var(--warning)'
      : color

  return (
    <div
      style={{
        height,
        background: 'var(--surface-2)',
        borderRadius: height,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: dynamicColor,
          borderRadius: height,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  )
}

// ─── Server card ─────────────────────────────────────────────────────────────

function ServerCard({
  server,
  nodeStatus,
}: {
  server: ServerItem
  nodeStatus?: NodeStatus
}) {
  const isOnline = !!nodeStatus
  const cpuPct = nodeStatus ? Math.round((nodeStatus.status?.cpu || 0) * 100) : 0
  const memTotal = nodeStatus?.status?.memory?.total || 0
  const memUsed = nodeStatus?.status?.memory?.used || 0
  const memPct = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'border-color 0.15s',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              {server.name}
            </span>
            {/* Status badge */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 20,
                background: isOnline
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(239, 68, 68, 0.12)',
                color: isOnline ? 'var(--success)' : 'var(--error)',
                border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {server.host}
            {server.mode && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {server.mode}
              </span>
            )}
            {server.type && (
              <span
                style={{
                  marginLeft: 4,
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'rgba(124, 58, 237, 0.1)',
                  border: '1px solid rgba(124, 58, 237, 0.25)',
                  color: 'var(--accent-light)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {server.type}
              </span>
            )}
          </p>
        </div>
        <a
          href={`/servers/${server.id}`}
          style={{
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            textDecoration: 'none',
            padding: '4px 8px',
            borderRadius: 6,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            transition: 'all 0.15s',
          }}
        >
          <ExternalLink size={12} />
          Détails
        </a>
      </div>

      {/* Metrics — only if online */}
      {isOnline && nodeStatus ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* CPU */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>CPU</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                {cpuPct}%
              </span>
            </div>
            <ProgressBar value={cpuPct} color="var(--accent)" />
          </div>

          {/* RAM */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>RAM</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                {formatBytes(memUsed)} / {formatBytes(memTotal)} ({memPct}%)
              </span>
            </div>
            <ProgressBar value={memPct} color="var(--success)" />
          </div>

          {/* Uptime */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 4,
              borderTop: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Uptime</span>
            <span style={{ fontSize: 12, color: 'var(--text)' }}>
              {formatUptime(nodeStatus.status?.uptime || 0)}
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '8px 0',
          }}
        >
          Métriques indisponibles
        </div>
      )}
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function severityIcon(severity: string) {
  switch (severity) {
    case 'error':
      return <XCircle size={14} style={{ color: 'var(--error)', flexShrink: 0 }} />
    case 'warning':
      return <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
    default:
      return <Info size={14} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
  }
}

function ActivityFeed() {
  const events = useOpsStore((s) => s.clusterEvents)

  if (!events.length) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        Aucun événement récent disponible.
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {events.map((event, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '12px 16px',
            borderBottom: idx < events.length - 1 ? '1px solid var(--border)' : 'none',
            transition: 'background 0.1s',
          }}
        >
          {severityIcon(event.severity)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {event.description}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {event.node}
              {event.user ? ` · ${event.user}` : ''}
            </p>
          </div>
          <span
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {event.time
              ? new Date(event.time * 1000).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const {
    servers,
    vms,
    nodeStatuses,
    isLoadingServers,
    fetchServers,
    fetchVMs,
    fetchNodeStatus,
    fetchClusterEvents,
  } = useOpsStore()

  const loadAll = useCallback(async () => {
    await fetchServers()
    const currentServers = useOpsStore.getState().servers
    await Promise.all(
      currentServers.map((s: ServerItem) =>
        Promise.all([fetchNodeStatus(s.id), fetchVMs(s.id)])
      )
    )
    if (currentServers.length > 0) {
      await fetchClusterEvents(currentServers[0].id)
    }
  }, [fetchServers, fetchVMs, fetchNodeStatus, fetchClusterEvents])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Computed stats
  const totalServers = servers.length
  const onlineServers = servers.filter((s: ServerItem) => !!nodeStatuses[s.id]).length

  const totalVMs = Object.values(vms).reduce((acc, list) => acc + list.length, 0)

  const totalMemUsed = Object.values(nodeStatuses).reduce(
    (acc: number, ns: NodeStatus) => acc + (ns.status?.memory?.used || 0),
    0
  )
  const totalMemTotal = Object.values(nodeStatuses).reduce(
    (acc: number, ns: NodeStatus) => acc + (ns.status?.memory?.total || 0),
    0
  )
  const memUsageStr =
    totalMemTotal > 0
      ? `${formatBytes(totalMemUsed)} / ${formatBytes(totalMemTotal)}`
      : '—'

  const firstOnlineServer = servers.find((s: ServerItem) => nodeStatuses[s.id])

  return (
    <>
      <Header title="Tableau de bord" onRefresh={loadAll} />
      {firstOnlineServer && <LiveMetricsBanner serverId={firstOnlineServer.id} />}

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* ── Stat cards ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <StatCard
            title="Serveurs"
            value={totalServers}
            subtitle={`${onlineServers} en ligne`}
            icon={Server}
            iconColor="var(--accent)"
            loading={isLoadingServers}
          />
          <StatCard
            title="VMs & Containers"
            value={totalVMs}
            subtitle="Toutes instances"
            icon={Monitor}
            iconColor="var(--success)"
            loading={isLoadingServers}
          />
          <StatCard
            title="RAM globale"
            value={totalMemTotal > 0 ? `${Math.round((totalMemUsed / totalMemTotal) * 100)}%` : '—'}
            subtitle={memUsageStr}
            icon={MemoryStick}
            iconColor="var(--warning)"
            loading={isLoadingServers}
          />
          <StatCard
            title="Activité"
            value={useOpsStore.getState().clusterEvents.length}
            subtitle="Événements récents"
            icon={Activity}
            iconColor="var(--accent-light)"
            loading={isLoadingServers}
          />
        </div>

        {/* ── Server grid ── */}
        <section>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 14,
            }}
          >
            Infrastructure
          </h2>
          {isLoadingServers ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
              }}
            >
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    height: 180,
                    animation: 'shimmer 1.5s infinite',
                  }}
                />
              ))}
            </div>
          ) : servers.length === 0 ? (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 40,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              <Server
                size={32}
                style={{ margin: '0 auto 12px', opacity: 0.4 }}
              />
              <p>Aucun serveur configuré.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>
                Ajoutez un serveur Proxmox depuis l&apos;application mobile.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
              }}
            >
              {servers.map((server: ServerItem) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  nodeStatus={nodeStatuses[server.id]}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Activity feed ── */}
        <section>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 14,
            }}
          >
            Activité récente
          </h2>
          <ActivityFeed />
        </section>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  )
}
