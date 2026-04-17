'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Server, Globe, Home, RefreshCw, X } from 'lucide-react'
import Header from '@/components/Header'
import { useOpsStore, Server as ServerItem } from '@/lib/store'
import { getUser } from '@/lib/auth'
import api from '@/lib/api'

interface AddServerForm {
  name: string
  ip: string
  username: string
  password: string
  mode: 'local' | 'cloud'
  server_type: 'pve' | 'pbs'
}

const defaultForm: AddServerForm = {
  name: '',
  ip: '',
  username: '',
  password: '',
  mode: 'local',
  server_type: 'pve',
}

function AddServerModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState<AddServerForm>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof AddServerForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/v1/servers', form)
      onAdded()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'ajout')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 12px',
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Ajouter un serveur</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nom</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Mon serveur Proxmox" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>IP / Hostname</label>
            <input required value={form.ip} onChange={e => set('ip', e.target.value)} placeholder="192.168.1.100" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Utilisateur</label>
              <input required value={form.username} onChange={e => set('username', e.target.value)} placeholder="root@pam" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mot de passe</label>
              <input required type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Mode</label>
              <select value={form.mode} onChange={e => set('mode', e.target.value)} style={inputStyle}>
                <option value="local">Local</option>
                <option value="cloud">Cloud Relay</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={form.server_type} onChange={e => set('server_type', e.target.value)} style={inputStyle}>
                <option value="pve">PVE (Proxmox VE)</option>
                <option value="pbs">PBS (Backup Server)</option>
              </select>
            </div>
          </div>

          {error && <p style={{ fontSize: 13, color: 'var(--error)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const user = getUser()
  const { servers, fetchServers } = useOpsStore()
  const [showAdd, setShowAdd] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(() => fetchServers(), [fetchServers])
  useEffect(() => { load() }, [load])

  async function deleteServer(id: string, name: string) {
    if (!confirm(`Supprimer le serveur "${name}" ? Cette action est irréversible.`)) return
    setDeletingId(id)
    try {
      await api.delete(`/api/v1/servers/${id}`)
      load()
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleMode(id: string, current: string) {
    const newMode = current === 'local' ? 'cloud' : 'local'
    try {
      await api.put(`/api/v1/servers/${id}/mode`, { mode: newMode })
      load()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      {showAdd && <AddServerModal onClose={() => setShowAdd(false)} onAdded={load} />}

      <Header title="Paramètres" onRefresh={load} />

      <div style={{ padding: 24, maxWidth: 800 }}>
        {/* Profile */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{user?.name || user?.email || 'Utilisateur'}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</p>
            {user?.role && (
              <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: 'var(--accent-light)', textTransform: 'capitalize' as const }}>
                {user.role}
              </span>
            )}
          </div>
        </div>

        {/* Servers */}
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Serveurs ({servers.length})</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <RefreshCw size={13} /> Actualiser
            </button>
            <button onClick={() => setShowAdd(true)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          {servers.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <Server size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p>Aucun serveur. Ajoutez-en un avec le bouton ci-dessus.</p>
            </div>
          ) : (
            servers.map((s: ServerItem) => (
              <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.type === 'PBS' ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Server size={16} style={{ color: s.type === 'PBS' ? 'var(--success)' : 'var(--accent-light)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.name}</p>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: s.type === 'PBS' ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)', color: s.type === 'PBS' ? 'var(--success)' : 'var(--accent-light)', border: `1px solid ${s.type === 'PBS' ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.3)'}`, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{s.type || 'PVE'}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.host}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => toggleMode(s.id, s.mode || 'local')}
                    title={`Mode actuel: ${s.mode || 'local'} — cliquer pour basculer`}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                  >
                    {s.mode === 'cloud' ? <Globe size={12} /> : <Home size={12} />}
                    {s.mode || 'local'}
                  </button>
                  <button
                    onClick={() => deleteServer(s.id, s.name)}
                    disabled={deletingId === s.id}
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--error)', display: 'flex', alignItems: 'center', opacity: deletingId === s.id ? 0.5 : 1 }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 40 }}>
          MyProx Ops Center v0.1.0 · Next.js 15
        </p>
      </div>
    </>
  )
}
