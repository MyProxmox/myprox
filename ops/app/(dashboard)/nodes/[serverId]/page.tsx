'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Download, AlertTriangle, CheckCircle, FileText, Cpu, MemoryStick, HardDrive, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Header from '@/components/Header'
import { useOpsStore } from '@/lib/store'
import api from '@/lib/api'

interface Update {
  package: string
  version: string
  old_version?: string
  priority?: string
  section?: string
}

interface LogEntry {
  t: number
  n?: string
  u?: string
  m?: string
  d?: string
  msg?: string
}

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
    <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 8, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: dynamicColor, borderRadius: 8, transition: 'width 0.4s ease' }} />
    </div>
  )
}

const TABS = [
  { id: 'status', label: 'Statut' },
  { id: 'updates', label: 'Mises à jour' },
  { id: 'logs', label: 'Logs' },
]

const TIMEFRAMES = [
  { label: '1h', value: 'hour' },
  { label: '1j', value: 'day' },
  { label: '1sem', value: 'week' },
]

export default function NodeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const serverId = params.serverId as string
  const { nodeStatuses, fetchNodeStatus } = useOpsStore()
  const nodeStatus = nodeStatuses[serverId]

  const [tab, setTab] = useState('status')
  const [timeframe, setTimeframe] = useState('hour')
  const [rrdData, setRrdData] = useState<any[]>([])
  const [updates, setUpdates] = useState<Update[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loadingUpdates, setLoadingUpdates] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeMsg, setUpgradeMsg] = useState('')

  const loadStatus = useCallback(() => fetchNodeStatus(serverId), [serverId, fetchNodeStatus])

  const loadUpdates = useCallback(async () => {
    setLoadingUpdates(true)
    try {
      const res = await api.get(`/api/v1/servers/${serverId}/node/updates`)
      setUpdates(res.data.updates || [])
    } catch {
      setUpdates([])
    } finally {
      setLoadingUpdates(false)
    }
  }, [serverId])

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true)
    try {
      const res = await api.get(`/api/v1/servers/${serverId}/node/logs`)
      setLogs(res.data.logs || [])
    } catch {
      setLogs([])
    } finally {
      setLoadingLogs(false)
    }
  }, [serverId])

  useEffect(() => { loadStatus() }, [loadStatus])
  useEffect(() => { if (tab === 'updates') loadUpdates() }, [tab, loadUpdates])
  useEffect(() => { if (tab === 'logs') loadLogs() }, [tab, loadLogs])

  // Build sparkline data from current node status (repeated for visual)
  const cpuPct = nodeStatus ? Math.round((nodeStatus.status?.cpu || 0) * 100) : 0
  const memTotal = nodeStatus?.status?.memory?.total || 0
  const memUsed = nodeStatus?.status?.memory?.used || 0
  const memPct = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0
  const swapTotal = nodeStatus?.status?.swap?.total || 0
  const swapUsed = nodeStatus?.status?.swap?.used || 0
  const swapPct = swapTotal > 0 ? Math.round((swapUsed / swapTotal) * 100) : 0
  const loadavg = nodeStatus?.status?.loadavg || []

  async function doUpgrade() {
    if (!confirm('Lancer apt dist-upgrade sur ce nœud ? Les services peuvent être redémarrés.')) return
    setUpgrading(true)
    setUpgradeMsg('')
    try {
      const res = await api.post(`/api/v1/servers/${serverId}/node/upgrade`)
      setUpgradeMsg(res.data.message || 'Mise à jour lancée')
      loadUpdates()
    } catch (e: any) {
      setUpgradeMsg(e.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setUpgrading(false)
    }
  }

  function exportLogs() {
    const text = logs.map(l => `[${new Date((l.t || 0) * 1000).toISOString()}] ${l.n || ''} ${l.u || ''}: ${l.m || l.msg || l.d || ''}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `node-logs-${serverId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Header title={nodeStatus?.node || serverId} subtitle="Détail du nœud" onRefresh={loadStatus} />

      <div style={{ padding: 24 }}>
        <button onClick={() => router.back()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft size={14} /> Retour
        </button>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 1 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', fontSize: 14, fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', background: 'none', border: 'none',
              color: tab === t.id ? 'var(--accent-light)' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--accent-light)' : '2px solid transparent',
              marginBottom: -1,
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Status tab */}
        {tab === 'status' && (
          <div>
            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { icon: Cpu, label: 'CPU', value: `${cpuPct}%`, color: cpuPct > 90 ? 'var(--error)' : cpuPct > 70 ? 'var(--warning)' : 'var(--accent-light)' },
                { icon: MemoryStick, label: 'RAM', value: `${memPct}%`, color: memPct > 90 ? 'var(--error)' : 'var(--success)' },
                { icon: HardDrive, label: 'Swap', value: swapTotal > 0 ? `${swapPct}%` : 'N/A', color: 'var(--warning)' },
                { icon: Clock, label: 'Uptime', value: formatUptime(nodeStatus?.status?.uptime || 0), color: 'var(--text-muted)' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Icon size={15} style={{ color }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{label}</span>
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 700, color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Progress bars */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>CPU</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{cpuPct}%</span>
                  </div>
                  <ProgressBar value={cpuPct} color="var(--accent)" />
                  {loadavg.length > 0 && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      Load avg: {loadavg.map((v: number | string) => parseFloat(String(v)).toFixed(2)).join(' / ')}
                    </p>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>RAM — {formatBytes(memUsed)} / {formatBytes(memTotal)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{memPct}%</span>
                  </div>
                  <ProgressBar value={memPct} color="var(--success)" />
                </div>
                {swapTotal > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Swap — {formatBytes(swapUsed)} / {formatBytes(swapTotal)}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{swapPct}%</span>
                    </div>
                    <ProgressBar value={swapPct} color="var(--warning)" />
                  </div>
                )}
              </div>
            </div>

            {/* Storage */}
            {nodeStatus?.storage && nodeStatus.storage.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Stockage</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {nodeStatus.storage.map(st => {
                    const pct = st.total > 0 ? Math.round((st.used / st.total) * 100) : 0
                    return (
                      <div key={st.storage}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--text)' }}>{st.storage} <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{st.type}</span></span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{formatBytes(st.used)} / {formatBytes(st.total)} ({pct}%)</span>
                        </div>
                        <ProgressBar value={pct} color="var(--accent-light)" />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Updates tab */}
        {tab === 'updates' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button onClick={loadUpdates} disabled={loadingUpdates} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <RefreshCw size={14} style={{ animation: loadingUpdates ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
              </button>
              {updates.length > 0 && (
                <button onClick={doUpgrade} disabled={upgrading} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, opacity: upgrading ? 0.5 : 1 }}>
                  <Download size={14} /> Mettre à jour ({updates.length} paquets)
                </button>
              )}
              {upgradeMsg && (
                <span style={{ fontSize: 13, color: upgradeMsg.includes('erreur') || upgradeMsg.includes('Erreur') ? 'var(--error)' : 'var(--success)' }}>
                  {upgradeMsg}
                </span>
              )}
            </div>

            {loadingUpdates ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, height: 160, animation: 'shimmer 1.5s infinite' }} />
            ) : updates.length === 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 48, textAlign: 'center' as const, color: 'var(--text-muted)' }}>
                <CheckCircle size={32} style={{ margin: '0 auto 12px', color: 'var(--success)', opacity: 0.8 }} />
                <p style={{ fontSize: 15, fontWeight: 500 }}>Système à jour</p>
                <p style={{ fontSize: 13, marginTop: 6 }}>Aucun paquet à mettre à jour.</p>
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                      {['Paquet', 'Nouvelle version', 'Ancienne version', 'Section'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {updates.map((u, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{u.package}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--success)' }}>{u.version}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{u.old_version || '—'}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{u.section || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Logs tab */}
        {tab === 'logs' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button onClick={loadLogs} disabled={loadingLogs} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <RefreshCw size={14} style={{ animation: loadingLogs ? 'spin 1s linear infinite' : 'none' }} /> Actualiser
              </button>
              {logs.length > 0 && (
                <button onClick={exportLogs} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <FileText size={14} /> Exporter .txt
                </button>
              )}
            </div>

            {loadingLogs ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, height: 200, animation: 'shimmer 1.5s infinite' }} />
            ) : logs.length === 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 48, textAlign: 'center' as const, color: 'var(--text-muted)', fontSize: 13 }}>
                Aucun log disponible
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ fontFamily: 'monospace', fontSize: 12, maxHeight: 600, overflowY: 'auto' }}>
                  {logs.map((l, i) => {
                    const ts = l.t ? new Date(l.t * 1000).toLocaleString('fr-FR') : '—'
                    const msg = l.m || l.msg || l.d || ''
                    const user = l.u || ''
                    const node = l.n || ''
                    return (
                      <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0, fontSize: 11 }}>{ts}</span>
                        {node && <span style={{ color: 'var(--accent-light)', whiteSpace: 'nowrap', flexShrink: 0 }}>{node}</span>}
                        {user && <span style={{ color: 'var(--warning)', whiteSpace: 'nowrap', flexShrink: 0 }}>{user}</span>}
                        <span style={{ color: 'var(--text)', wordBreak: 'break-word' }}>{msg}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
