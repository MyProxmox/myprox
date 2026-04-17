'use client'

import { useEffect, useCallback } from 'react'
import { Monitor, Play, Square, RotateCcw } from 'lucide-react'
import Header from '@/components/Header'
import { useOpsStore, VMItem, Server } from '@/lib/store'
import api from '@/lib/api'

function statusColor(status: string) {
  switch (status) {
    case 'running':
      return 'var(--success)'
    case 'stopped':
      return 'var(--error)'
    default:
      return 'var(--warning)'
  }
}

function VMRow({
  vm,
  serverId,
  node,
}: {
  vm: VMItem
  serverId: string
  node: string
}) {
  async function sendAction(action: string) {
    try {
      await api.post(`/api/v1/servers/${serverId}/vms/${vm.vmid}/action`, {
        action,
        type: vm.type,
        node,
      })
    } catch (err) {
      console.error('VM action failed', err)
    }
  }

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.1s',
      }}
    >
      <td style={{ padding: '12px 16px', fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Monitor size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>
            {vm.name || `${vm.type.toUpperCase()}-${vm.vmid}`}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 4,
              background:
                vm.type === 'lxc'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(124, 58, 237, 0.1)',
              color:
                vm.type === 'lxc' ? 'var(--success)' : 'var(--accent-light)',
              border: `1px solid ${vm.type === 'lxc' ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.3)'}`,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {vm.type}
          </span>
        </div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: statusColor(vm.status),
              boxShadow: `0 0 5px ${statusColor(vm.status)}`,
            }}
          />
          <span style={{ color: 'var(--text)', textTransform: 'capitalize' }}>
            {vm.status}
          </span>
        </div>
      </td>
      <td
        style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}
      >
        {vm.vmid}
      </td>
      <td
        style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}
      >
        {vm.node}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {vm.status !== 'running' && (
            <button
              onClick={() => sendAction('start')}
              title="Démarrer"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 6,
                padding: '4px 8px',
                cursor: 'pointer',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
              }}
            >
              <Play size={12} />
              Start
            </button>
          )}
          {vm.status === 'running' && (
            <>
              <button
                onClick={() => sendAction('stop')}
                title="Arrêter"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  color: 'var(--error)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <Square size={12} />
                Stop
              </button>
              <button
                onClick={() => sendAction('restart')}
                title="Redémarrer"
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <RotateCcw size={12} />
                Restart
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function VMsPage() {
  const { servers, vms, isLoadingServers, fetchServers, fetchVMs } =
    useOpsStore()

  const loadAll = useCallback(async () => {
    await fetchServers()
    const currentServers = useOpsStore.getState().servers
    await Promise.all(currentServers.map((s: Server) => fetchVMs(s.id)))
  }, [fetchServers, fetchVMs])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const allVMs = servers.flatMap((s: Server) =>
    (vms[s.id] || []).map((vm) => ({ ...vm, serverId: s.id, serverName: s.name }))
  )

  const nodeForServer = (serverId: string) => {
    const server = servers.find((s: Server) => s.id === serverId)
    return server?.node || 'pve'
  }

  return (
    <>
      <Header title="VMs & LXC" onRefresh={loadAll} />

      <div style={{ padding: 24 }}>
        {isLoadingServers ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              height: 200,
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ) : allVMs.length === 0 ? (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 48,
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Monitor size={36} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>Aucune VM ou container</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>
              Créez des VMs depuis Proxmox, elles apparaîtront ici automatiquement.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                  }}
                >
                  {['Nom', 'Statut', 'VMID', 'Nœud', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allVMs.map((vm) => (
                  <VMRow
                    key={`${vm.serverId}-${vm.vmid}`}
                    vm={vm}
                    serverId={vm.serverId}
                    node={nodeForServer(vm.serverId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
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
