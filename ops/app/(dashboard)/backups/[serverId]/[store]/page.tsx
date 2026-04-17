'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, HardDrive, Calendar, Tag } from 'lucide-react'
import Header from '@/components/Header'
import api from '@/lib/api'

interface Snapshot {
  'backup-id': string
  'backup-time': number
  'backup-type': string
  size?: number
  protected?: boolean
  comment?: string
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '—'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString('fr-FR')
}

export default function StoreDetailPage() {
  const params = useParams()
  const router = useRouter()
  const serverId = params.serverId as string
  const store = decodeURIComponent(params.store as string)

  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/servers/${serverId}/pbs/datastores/${encodeURIComponent(store)}/snapshots`)
      setSnapshots(res.data.snapshots || [])
    } catch {
      setSnapshots([])
    } finally {
      setLoading(false)
    }
  }, [serverId, store])

  useEffect(() => { load() }, [load])

  const filtered = snapshots.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return s['backup-id']?.toLowerCase().includes(q) || s['backup-type']?.toLowerCase().includes(q) || s.comment?.toLowerCase().includes(q)
  })

  const typeColor = (type: string) => {
    switch (type) {
      case 'vm': return { bg: 'rgba(124,58,237,0.1)', color: 'var(--accent-light)', border: 'rgba(124,58,237,0.3)' }
      case 'ct': return { bg: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: 'rgba(16,185,129,0.3)' }
      default: return { bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: 'rgba(245,158,11,0.3)' }
    }
  }

  return (
    <>
      <Header title={store} subtitle={`${snapshots.length} sauvegardes`} onRefresh={load} />

      <div style={{ padding: 24 }}>
        <button onClick={() => router.back()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 24 }}>
          <ArrowLeft size={14} /> Retour
        </button>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filtrer par ID, type, commentaire..."
          style={{ width: '100%', maxWidth: 400, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none', marginBottom: 16, boxSizing: 'border-box' as const }}
        />

        {loading ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, height: 200, animation: 'shimmer 1.5s infinite' }} />
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 48, textAlign: 'center' as const, color: 'var(--text-muted)' }}>
            <HardDrive size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>Aucune sauvegarde</p>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  {['ID', 'Type', 'Date', 'Taille', 'Commentaire'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const tc = typeColor(s['backup-type'])
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {s.protected && <Tag size={12} style={{ color: 'var(--warning)' }} />}
                          <span style={{ fontWeight: 500, color: 'var(--text)' }}>{s['backup-id']}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                          {s['backup-type']}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={12} />
                          {formatDate(s['backup-time'])}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{formatBytes(s.size)}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{s.comment || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        tr:hover td { background: var(--surface-2); }
      `}</style>
    </>
  )
}
