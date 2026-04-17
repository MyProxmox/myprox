'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Play, Square, RotateCcw, Monitor, Cpu,
  MemoryStick, HardDrive, Network, Terminal, X,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import Header from '@/components/Header'
import api from '@/lib/api'

interface StatPoint {
  time: number
  cpu?: number
  mem?: number
  netin?: number
  netout?: number
  diskread?: number
  diskwrite?: number
}

interface VMDetail {
  vmid: number
  name: string
  status: string
  cpus?: number
  maxmem?: number
  mem?: number
  maxdisk?: number
  uptime?: number
  node?: string
}

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

function formatUptime(seconds: number) {
  if (!seconds) return '—'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}j ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const TIMEFRAMES = [
  { label: '1h', value: 'hour' },
  { label: '1j', value: 'day' },
  { label: '1sem', value: 'week' },
]

function ChartCard({ title, data, dataKey, color, unit, formatter }: {
  title: string
  data: StatPoint[]
  dataKey: string
  color: string
  unit: string
  formatter?: (v: number) => string
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</p>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="time" tickFormatter={formatTime} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} minTickGap={40} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={formatter || (v => `${v}${unit}`)} />
          <Tooltip
            contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => [formatter ? formatter(v) : `${v.toFixed(1)}${unit}`, title]}
            labelFormatter={v => formatTime(Number(v))}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function VNCModal({ serverId, vmid, node, type, onClose }: {
  serverId: string
  vmid: string
  node: string
  type: string
  onClose: () => void
}) {
  const [vncUrl, setVncUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get(`/api/v1/servers/${serverId}/vnc-ticket`, {
      params: { vmid, node, type },
    }).then(res => {
      const { ticket, port, host } = res.data
      const url = `https://${host}:8006/?console=kvm&novnc=1&vmid=${vmid}&node=${node}&resize=1&ticket=${encodeURIComponent(ticket)}`
      setVncUrl(url)
    }).catch(() => setError('Impossible d\'obtenir le ticket VNC'))
  }, [serverId, vmid, node, type])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', gap: 12 }}>
        <Terminal size={16} style={{ color: 'var(--accent-light)' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1 }}>Console VNC — {type.toUpperCase()} {vmid}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {error ? (
          <p style={{ color: 'var(--error)', fontSize: 14 }}>{error}</p>
        ) : vncUrl ? (
          <iframe src={vncUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="VNC Console" />
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Connexion VNC en cours...</p>
        )}
      </div>
    </div>
  )
}

export default function VMDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const serverId = params.serverId as string
  const vmid = params.vmid as string
  const node = searchParams.get('node') || 'pve'
  const type = searchParams.get('type') || 'qemu'

  const [detail, setDetail] = useState<VMDetail | null>(null)
  const [stats, setStats] = useState<StatPoint[]>([])
  const [timeframe, setTimeframe] = useState('hour')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showVNC, setShowVNC] = useState(false)

  const loadDetail = useCallback(async () => {
    try {
      const res = await api.get(`/api/v1/servers/${serverId}/vms/${vmid}`, { params: { node, type } })
      setDetail(res.data)
    } catch (e) {
      console.error(e)
    }
  }, [serverId, vmid, node, type])

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get(`/api/v1/servers/${serverId}/vms/${vmid}/stats`, { params: { node, type, timeframe } })
      setStats(res.data.stats || [])
    } catch {
      setStats([])
    }
  }, [serverId, vmid, node, type, timeframe])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadDetail(), loadStats()]).finally(() => setLoading(false))
  }, [loadDetail, loadStats])

  async function sendAction(action: string) {
    setActionLoading(true)
    try {
      await api.post(`/api/v1/servers/${serverId}/vms/${vmid}/action/${action}`, { type, node })
      await loadDetail()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const status = detail?.status || '—'
  const cpuPct = useMemo(() => {
    if (!stats.length) return 0
    const last = stats[stats.length - 1]
    return last?.cpu != null ? Math.round(last.cpu * 100) : 0
  }, [stats])

  return (
    <>
      {showVNC && (
        <VNCModal serverId={serverId} vmid={vmid} node={node} type={type} onClose={() => setShowVNC(false)} />
      )}

      <Header
        title={detail?.name || `${type.toUpperCase()}-${vmid}`}
        subtitle={`VMID ${vmid} · ${node}`}
        onRefresh={async () => { await Promise.all([loadDetail(), loadStats()]) }}
      />

      <div style={{ padding: 24 }}>
        {/* Back + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' as const }}>
          <button onClick={() => router.back()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <ArrowLeft size={14} /> Retour
          </button>

          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button onClick={() => setShowVNC(true)} style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
              <Terminal size={14} /> Console VNC
            </button>
            {status !== 'running' && (
              <button onClick={() => sendAction('start')} disabled={actionLoading} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, opacity: actionLoading ? 0.5 : 1 }}>
                <Play size={14} /> Démarrer
              </button>
            )}
            {status === 'running' && (
              <>
                <button onClick={() => sendAction('stop')} disabled={actionLoading} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, opacity: actionLoading ? 0.5 : 1 }}>
                  <Square size={14} /> Arrêter
                </button>
                <button onClick={() => sendAction('restart')} disabled={actionLoading} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, opacity: actionLoading ? 0.5 : 1 }}>
                  <RotateCcw size={14} /> Redémarrer
                </button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, height: 200, animation: 'shimmer 1.5s infinite' }} />
        ) : (
          <>
            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { icon: Monitor, label: 'Statut', value: status, color: status === 'running' ? 'var(--success)' : 'var(--error)' },
                { icon: Cpu, label: 'vCPUs', value: detail?.cpus ? `${detail.cpus} cores` : '—', color: 'var(--accent-light)' },
                { icon: MemoryStick, label: 'RAM max', value: formatBytes(detail?.maxmem || 0), color: 'var(--success)' },
                { icon: HardDrive, label: 'Disque', value: formatBytes(detail?.maxdisk || 0), color: 'var(--warning)' },
                { icon: Monitor, label: 'Uptime', value: formatUptime(detail?.uptime || 0), color: 'var(--text-muted)' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Icon size={15} style={{ color }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{label}</span>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Timeframe selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Période :</span>
              {TIMEFRAMES.map(tf => (
                <button key={tf.value} onClick={() => setTimeframe(tf.value)} style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: timeframe === tf.value ? 600 : 400,
                  background: timeframe === tf.value ? 'rgba(124,58,237,0.15)' : 'var(--surface)',
                  border: `1px solid ${timeframe === tf.value ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                  color: timeframe === tf.value ? 'var(--accent-light)' : 'var(--text-muted)',
                }}>
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Charts */}
            {stats.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
                <ChartCard title="CPU" data={stats} dataKey="cpu" color="var(--accent-light)" unit="%" formatter={v => `${(v * 100).toFixed(1)}%`} />
                <ChartCard title="RAM" data={stats} dataKey="mem" color="var(--success)" unit="" formatter={v => formatBytes(v)} />
                <ChartCard title="Réseau in" data={stats} dataKey="netin" color="#06b6d4" unit="" formatter={v => `${formatBytes(v)}/s`} />
                <ChartCard title="Réseau out" data={stats} dataKey="netout" color="#8b5cf6" unit="" formatter={v => `${formatBytes(v)}/s`} />
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, textAlign: 'center' as const, color: 'var(--text-muted)', fontSize: 13 }}>
                <Network size={28} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>Statistiques non disponibles</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>La VM doit être en cours d'exécution pour collecter les métriques RRD.</p>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </>
  )
}
