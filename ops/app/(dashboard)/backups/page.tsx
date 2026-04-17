'use client'

import { useEffect, useState, useCallback } from 'react'
import { Database, HardDrive, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import { useOpsStore, Server } from '@/lib/store'
import api from '@/lib/api'

interface Datastore {
  store: string
  total?: number
  used?: number
  avail?: number
  'gc-status'?: string
}

interface PBSTask {
  upid?: string
  type: string
  status?: string
  starttime?: number
  endtime?: number
  node?: string
  worker_id?: string
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

function formatDate(ts?: number): string {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleString('fr-FR')
}

function statusIcon(status?: string) {
  if (!status) return null
  if (status === 'OK' || status.toLowerCase().includes('ok')) return <CheckCircle size={14} style={{ color: 'var(--success)' }} />
  if (status.toLowerCase().includes('err') || status.toLowerCase().includes('fail')) return <XCircle size={14} style={{ color: 'var(--error)' }} />
  return <Clock size={14} style={{ color: 'var(--warning)' }} />
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  const color = pct > 90 ? 'var(--error)' : pct > 70 ? 'var(--warning)' : 'var(--accent)'
  return (
    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 6, transition: 'width 0.4s ease' }} />
    </div>
  )
}

export default function BackupsPage() {
  const { servers, fetchServers } = useOpsStore()
  const [datastores, setDatastores] = useState<Record<string, Datastore[]>>({})
  const [tasks, setTasks] = useState<Record<string, PBSTask[]>>({})
  const [loading, setLoading] = useState(true)

  const pbsServers = servers.filter(s => s.type === 'PBS')

  const loadAll = useCallback(async () => {
    setLoading(true)
    await fetchServers()
    const currentServers = useOpsStore.getState().servers.filter(s => s.type === 'PBS')
    const results = await Promise.allSettled(
      currentServers.map(async s => {
        const [dsRes, taskRes] = await Promise.allSettled([
          api.get(`/api/v1/servers/${s.id}/pbs/datastores`),
          api.get(`/api/v1/servers/${s.id}/pbs/tasks`),
        ])
        return {
          id: s.id,
          datastores: dsRes.status === 'fulfilled' ? (dsRes.value.data.datastores || []) : [],
          tasks: taskRes.status === 'fulfilled' ? (taskRes.value.data.tasks || []) : [],
        }
      })
    )
    const ds: Record<string, Datastore[]> = {}
    const tk: Record<string, PBSTask[]> = {}
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        ds[r.value.id] = r.value.datastores
        tk[r.value.id] = r.value.tasks
      }
    })
    setDatastores(ds)
    setTasks(tk)
    setLoading(false)
  }, [fetchServers])

  useEffect(() => { loadAll() }, [loadAll])

  const hasPBS = pbsServers.length > 0

  return (
    <>
      <Header title="Sauvegardes PBS" subtitle={hasPBS ? `${pbsServers.length} serveur PBS` : 'Aucun serveur PBS'} onRefresh={loadAll} />

      <div style={{ padding: 24 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2].map(i => <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, height: 200, animation: 'shimmer 1.5s infinite' }} />)}
          </div>
        ) : !hasPBS ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Database size={36} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>Aucun serveur PBS configuré</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Ajoutez un serveur Proxmox Backup Server depuis l'application mobile.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {pbsServers.map((server: Server) => {
              const stores = datastores[server.id] || []
              const serverTasks = tasks[server.id] || []

              return (
                <div key={server.id}>
                  {/* Server header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Database size={16} style={{ color: 'var(--accent-light)' }} />
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{server.name}</h2>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{server.host}</span>
                  </div>

                  {/* Datastores */}
                  {stores.length === 0 ? (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                      Aucun datastore trouvé
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
                      {stores.map((ds: Datastore) => {
                        const usedPct = ds.total && ds.used ? Math.round((ds.used / ds.total) * 100) : 0
                        return (
                          <div key={ds.store} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <HardDrive size={15} style={{ color: 'var(--accent-light)' }} />
                                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{ds.store}</span>
                              </div>
                              <Link href={`/backups/${server.id}/${encodeURIComponent(ds.store)}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                                Voir <ArrowRight size={12} />
                              </Link>
                            </div>
                            {ds.total ? (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{formatBytes(ds.used || 0)} utilisés</span>
                                  <span style={{ fontWeight: 600 }}>{usedPct}%</span>
                                </div>
                                <ProgressBar value={usedPct} />
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Total : {formatBytes(ds.total)} · Libre : {formatBytes(ds.avail || 0)}</p>
                              </>
                            ) : (
                              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Capacité inconnue</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Recent tasks */}
                  {serverTasks.length > 0 && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tâches récentes</p>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Type', 'Statut', 'Début', 'Fin', 'Worker'].map(h => (
                              <th key={h} style={{ padding: '8px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {serverTasks.slice(0, 10).map((t, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t.type}</td>
                              <td style={{ padding: '10px 16px', fontSize: 13 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {statusIcon(t.status)}
                                  <span style={{ color: 'var(--text)' }}>{t.status || '—'}</span>
                                </div>
                              </td>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(t.starttime)}</td>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(t.endtime)}</td>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{t.worker_id || t.node || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </>
  )
}
