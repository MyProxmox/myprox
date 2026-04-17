'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search, ChevronLeft, ChevronRight, ShieldX, Clock, CheckCircle,
  Crown, Trash2, RotateCcw, ChevronDown, ExternalLink
} from 'lucide-react'
import api from '@/lib/api'
import { Suspense } from 'react'

interface User {
  id: string
  email: string
  plan: string
  role: string
  status: string
  created_at: string
  last_login_at: string | null
  suspended_until: string | null
  ban_reason: string | null
  servers_count: number
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  pages: number
}

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Actif',     color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  suspended: { label: 'Suspendu', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  banned:    { label: 'Banni',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  free:    { label: 'Free',    color: 'var(--text-muted)' },
  premium: { label: 'Premium', color: '#a78bfa' },
  admin:   { label: 'Admin',   color: '#7C3AED' },
}

function Badge({ status }: { status: string }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.active
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      color: s.color, background: s.bg,
    }}>
      {s.label}
    </span>
  )
}

function ActionMenu({ user, onAction }: { user: User; onAction: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function act(action: string, body?: object) {
    setLoading(true)
    setOpen(false)
    try {
      if (action === 'delete') {
        if (!confirm(`Supprimer définitivement ${user.email} ?`)) return
        await api.delete(`/api/v1/admin/users/${user.id}`)
      } else if (action === 'premium') {
        await api.patch(`/api/v1/admin/users/${user.id}`, { plan: 'premium' })
      } else if (action === 'free') {
        await api.patch(`/api/v1/admin/users/${user.id}`, { plan: 'free' })
      } else {
        const reason = action === 'ban' || action === 'suspend'
          ? prompt(`Raison (${action === 'ban' ? 'bannissement' : 'suspension'}) :`) || ''
          : ''
        const hours = action === 'suspend' ? parseInt(prompt('Durée (heures) :') || '24') : 24
        await api.post(`/api/v1/admin/users/${user.id}/${action}`, { reason, hours, ...body })
      }
      onAction()
    } catch (e) {
      console.error(e)
      alert('Action échouée')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '5px 10px', borderRadius: 6, fontSize: 12,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          color: 'var(--text)', cursor: 'pointer',
        }}
      >
        Actions <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, overflow: 'hidden', minWidth: 180,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <Link
              href={`/users/${user.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 13, color: 'var(--text)', textDecoration: 'none' }}
            >
              <ExternalLink size={14} /> Voir le profil
            </Link>
            <div style={{ height: 1, background: 'var(--border)' }} />
            {user.plan !== 'premium' && (
              <button onClick={() => act('premium')} style={menuBtnStyle}>
                <Crown size={14} style={{ color: '#a78bfa' }} /> Passer Premium
              </button>
            )}
            {user.plan === 'premium' && (
              <button onClick={() => act('free')} style={menuBtnStyle}>
                <RotateCcw size={14} /> Rétrograder Free
              </button>
            )}
            <div style={{ height: 1, background: 'var(--border)' }} />
            {user.status !== 'active' ? (
              <button onClick={() => act('restore')} style={menuBtnStyle}>
                <CheckCircle size={14} style={{ color: '#10b981' }} /> Réactiver
              </button>
            ) : (
              <>
                <button onClick={() => act('suspend')} style={menuBtnStyle}>
                  <Clock size={14} style={{ color: '#f59e0b' }} /> Suspendre
                </button>
                <button onClick={() => act('ban')} style={menuBtnStyle}>
                  <ShieldX size={14} style={{ color: '#ef4444' }} /> Bannir
                </button>
              </>
            )}
            <div style={{ height: 1, background: 'var(--border)' }} />
            <button onClick={() => act('delete')} style={{ ...menuBtnStyle, color: '#ef4444' }}>
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const menuBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
  padding: '9px 14px', fontSize: 13, color: 'var(--text)',
  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
}

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function UsersPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<UsersResponse | null>(null)
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState(searchParams.get('plan') || 'all')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (plan !== 'all') params.set('plan', plan)
      if (status !== 'all') params.set('status', status)
      const res = await api.get(`/api/v1/admin/users?${params}`)
      setData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, plan, status, page])

  useEffect(() => { load() }, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load()
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Utilisateurs
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {data ? `${data.total.toLocaleString()} utilisateurs au total` : 'Chargement…'}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par email…"
              style={{
                width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <button type="submit" style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13,
            background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer',
          }}>
            Chercher
          </button>
        </form>
        <select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1) }}
          style={selectStyle}>
          <option value="all">Tous les plans</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          style={selectStyle}>
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="suspended">Suspendus</option>
          <option value="banned">Bannis</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Email', 'Plan', 'Statut', 'Inscrit le', 'Dernière co.', 'Serveurs', 'Actions'].map((h) => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chargement…
                </td>
              </tr>
            ) : data?.users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : data?.users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#fff',
                    }}>
                      {u.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{u.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.id.slice(0, 8)}…</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: (PLAN_BADGE[u.plan] || PLAN_BADGE.free).color }}>
                    {(PLAN_BADGE[u.plan] || PLAN_BADGE.free).label}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Badge status={u.status || 'active'} />
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                  {fmt(u.created_at)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                  {fmt(u.last_login_at)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text)' }}>
                  {u.servers_count}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <ActionMenu user={u} onAction={load} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={pageBtn}
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Page {page} / {data.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
            style={pageBtn}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 8, fontSize: 13,
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  color: 'var(--text)', cursor: 'pointer', outline: 'none',
}

const pageBtn: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 8,
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  color: 'var(--text)', cursor: 'pointer',
  display: 'flex', alignItems: 'center',
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: 'var(--text-muted)' }}>Chargement…</div>}>
      <UsersPageInner />
    </Suspense>
  )
}
