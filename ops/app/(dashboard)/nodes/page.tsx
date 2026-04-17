'use client'

import { useEffect, useCallback } from 'react'
import { Server, Cpu, MemoryStick, HardDrive, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import Header from '@/components/Header'
import { useOpsStore, NodeStatus, Server as ServerItem } from '@/lib/store'

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
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}j ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function ProgressBar({ value, color = 'var(--accent)' }: { value: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, value))
  const dynamicColor = pct > 90 ? 'var(--error)' : pct > 70 ? 'var(--warning)' : color
  return (
    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: dynamicColor, borderRadius: 6, transition: 'width 0.4s ease' }} />
    </div>
  )
}

function SparkLine({ data, color }: { data: number[]; color: string }) {
  const points = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={points}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Tooltip contentStyle={{ display: 'none' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function NodeCard({ server, nodeStatus }: { server: ServerItem; nodeStatus?: NodeStatus }) {
  const isOnline = !!nodeStatus
  const cpuPct = nodeStatus ? Math.round((nodeStatus.status?.cpu || 0) * 100) : 0
  const memTotal = nodeStatus?.status?.memory?.total || 0
  const memUsed = nodeStatus?.status?.memory?.used || 0
  const memPct = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0
  const swapTotal = nodeStatus?.status?.swap?.total || 0
  const swapUsed = nodeStatus?.status?.swap?.used || 0
  const swapPct = swapTotal > 0 ? Math.round((swapUsed / swapTotal) * 100) : 0
  const loadavg = nodeStatus?.status?.loadavg || []

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Server size={18} style={{ color: 'var(--accent-light)' }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{server.name}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{nodeStatus?.node || server.host}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: isOnline ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: isOnline ? 'var(--success)' : 'var(--error)', border: `1px solid ${isOnline ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <Link href={`/nodes/${server.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)' }}>
            Détails <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ padding: '20px' }}>
        {isOnline && nodeStatus ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Cpu size={14} style={{ color: 'var(--accent-light)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>CPU</span>
                <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600 }}>{cpuPct}%</span>
              </div>
              <ProgressBar value={cpuPct} color="var(--accent)" />
              {loadavg.length > 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Load avg: {loadavg.map((v: number | string) => parseFloat(String(v)).toFixed(2)).join(' / ')}
                </p>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MemoryStick size={14} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>RAM</span>
                <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600 }}>{formatBytes(memUsed)} / {formatBytes(memTotal)}</span>
              </div>
              <ProgressBar value={memPct} color="var(--success)" />
            </div>

            {swapTotal > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <HardDrive size={14} style={{ color: 'var(--warning)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Swap</span>
                  <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600 }}>{formatBytes(swapUsed)} / {formatBytes(swapTotal)}</span>
                </div>
                <ProgressBar value={swapPct} color="var(--warning)" />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0 0', borderTop: '1px solid var(--border)' }}>
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Uptime</span>
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text)' }}>{formatUptime(nodeStatus.status?.uptime || 0)}</span>
            </div>

            {nodeStatus.storage && nodeStatus.storage.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Stockage</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {nodeStatus.storage.map(st => {
                    const pct = st.total > 0 ? Math.round((st.used / st.total) * 100) : 0
                    return (
                      <div key={st.storage}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{st.storage}</span>
                          <span style={{ fontSize: 12, color: 'var(--text)' }}>{formatBytes(st.used)} / {formatBytes(st.total)} ({pct}%)</span>
                        </div>
                        <ProgressBar value={pct} color="var(--accent-light)" />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Nœud hors ligne ou données indisponibles
          </div>
        )}
      </div>
    </div>
  )
}

export default function NodesPage() {
  const { servers, nodeStatuses, isLoadingServers, fetchServers, fetchNodeStatus } = useOpsStore()

  const loadAll = useCallback(async () => {
    await fetchServers()
    const currentServers = useOpsStore.getState().servers
    await Promise.all(currentServers.map((s: ServerItem) => fetchNodeStatus(s.id)))
  }, [fetchServers, fetchNodeStatus])

  useEffect(() => { loadAll() }, [loadAll])

  return (
    <>
      <Header title="Nœuds" subtitle={`${servers.length} serveur${servers.length > 1 ? 's' : ''}`} onRefresh={loadAll} />

      <div style={{ padding: 24 }}>
        {isLoadingServers ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
            {[1, 2].map(i => <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, height: 280, animation: 'shimmer 1.5s infinite' }} />)}
          </div>
        ) : servers.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Server size={36} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>Aucun nœud disponible</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Ajoutez un serveur Proxmox pour voir ses nœuds ici.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
            {servers.map((server: ServerItem) => (
              <NodeCard key={server.id} server={server} nodeStatus={nodeStatuses[server.id]} />
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </>
  )
}
