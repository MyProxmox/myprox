'use client'

import { useEffect, useCallback, useState, useMemo } from 'react'
import { Monitor, Play, Square, RotateCcw, Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import { useOpsStore, VMItem, Server } from '@/lib/store'
import api from '@/lib/api'

function statusColor(status: string) {
  switch (status) {
    case 'running': return 'var(--success)'
    case 'stopped': return 'var(--error)'
    default: return 'var(--warning)'
  }
}

function formatMem(bytes?: number) {
  if (!bytes) return '—'
  const gb = bytes / 1024 / 1024 / 1024
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1024 / 1024).toFixed(0)} MB`
}

function VMRow({
  vm,
  serverId,
  serverName,
  node,
}: {
  vm: VMItem
  serverId: string
  serverName: string
  node: string
}) {
  const [loading, setLoading] = useState(false)

  async function sendAction(action: string) {
    setLoading(true)
    try {
      await api.post(`/api/v1/servers/${serverId}/vms/${vm.vmid}/action/${action}`, {
        type: vm.type,
        node,
      })
    } catch (err) {
      console.error('VM action failed', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <tr style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>
        <Link
          href={`/vms/${serverId}/${vm.vmid}?node=${encodeURIComponent(node)}&type=${vm.type}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
        >
          <Monitor size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>
            {vm.name || `${vm.type.toUpperCase()}-${vm.vmid}`}
          </span>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 4,
            background: vm.type === 'lxc' ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)',
            color: vm.type === 'lxc' ? 'var(--success)' : 'var(--accent-light)',
            border: `1px solid ${vm.type === 'lxc' ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.3)'}`,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.06em',
          }}>
            {vm.type}
          </span>
        </Link>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: statusColor(vm.status),
            boxShadow: `0 0 5px ${statusColor(vm.status)}`,
          }} />
          <span style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{vm.status}</span>
        </div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{vm.vmid}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{vm.node}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{serverName}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{formatMem(vm.maxmem)}</td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {vm.status !== 'running' && (
            <button onClick={() => sendAction('start')} disabled={loading} title="Démarrer" style={{
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--success)',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, opacity: loading ? 0.5 : 1,
            }}>
              <Play size={12} /> Start
            </button>
          )}
          {vm.status === 'running' && (
            <>
              <button onClick={() => sendAction('stop')} disabled={loading} title="Arrêter" style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--error)',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, opacity: loading ? 0.5 : 1,
              }}>
                <Square size={12} /> Stop
              </button>
              <button onClick={() => sendAction('restart')} disabled={loading} title="Redémarrer" style={{
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--warning)',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, opacity: loading ? 0.5 : 1,
              }}>
                <RotateCcw size={12} /> Restart
              </button>
            </>
          )}
          <Link href={`/vms/${serverId}/${vm.vmid}?node=${encodeURIComponent(node)}&type=${vm.type}`} style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '4px 8px', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, textDecoration: 'none',
          }}>
            <ExternalLink size={12} /> Détails
          </Link>
        </div>
      </td>
    </tr>
  )
}

export default function VMsPage() {
  const { servers, vms, isLoadingServers, fetchServers, fetchVMs } = useOpsStore()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterServer, setFilterServer] = useState<string>('all')

  const loadAll = useCallback(async () => {
    await fetchServers()
    const currentServers = useOpsStore.getState().servers
    await Promise.all(currentServers.map((s: Server) => fetchVMs(s.id)))
  }, [fetchServers, fetchVMs])

  useEffect(() => { loadAll() }, [loadAll])

  const allVMs = useMemo(() =>
    servers.flatMap((s: Server) =>
      (vms[s.id] || []).map(vm => ({ ...vm, serverId: s.id, serverName: s.name }))
    ),
    [servers, vms]
  )

  const filtered = useMemo(() => {
    return allVMs.filter(vm => {
      if (filterStatus !== 'all' && vm.status !== filterStatus) return false
      if (filterType !== 'all' && vm.type !== filterType) return false
      if (filterServer !== 'all' && vm.serverId !== filterServer) return false
      if (search) {
        const q = search.toLowerCase()
        if (!vm.name?.toLowerCase().includes(q) && !String(vm.vmid).includes(q) && !vm.node?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [allVMs, search, filterStatus, filterType, filterServer])

  const nodeForServer = (serverId: string) => {
    const server = servers.find((s: Server) => s.id === serverId)
    return server?.node || 'pve'
  }

  const filterStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '6px 12px',
    color: 'var(--text)',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none',
  }

  return (
    <>
      <Header title="VMs & LXC" subtitle={`${allVMs.length} instances`} onRefresh={loadAll} />

      <div style={{ padding: 24 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' as const, alignItems: 'center' }}>
          <div style={{ position: 'relative' as const, flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, VMID, nœud..."
              style={{ ...filterStyle, width: '100%', paddingLeft: 32, boxSizing: 'border-box' as const }}
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={filterStyle}>
            <option value="all">Tous les statuts</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={filterStyle}>
            <option value="all">VM & LXC</option>
            <option value="vm">VM seulement</option>
            <option value="lxc">LXC seulement</option>
          </select>
          <select value={filterServer} onChange={e => setFilterServer(e.target.value)} style={filterStyle}>
            <option value="all">Tous les serveurs</option>
            {servers.map((s: Server) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {isLoadingServers ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, height: 200, animation: 'shimmer 1.5s infinite' }} />
        ) : filtered.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 48, textAlign: 'center' as const, color: 'var(--text-muted)' }}>
            <Monitor size={36} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>Aucune VM ou container</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>
              {allVMs.length > 0 ? 'Aucun résultat pour ces filtres.' : 'Créez des VMs depuis Proxmox, elles apparaîtront ici.'}
            </p>
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' as const }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                    {['Nom', 'Statut', 'VMID', 'Nœud', 'Serveur', 'RAM', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', whiteSpace: 'nowrap' as const }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(vm => (
                    <VMRow
                      key={`${vm.serverId}-${vm.vmid}`}
                      vm={vm}
                      serverId={vm.serverId}
                      serverName={vm.serverName}
                      node={nodeForServer(vm.serverId)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
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
