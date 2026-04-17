'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Server, Crown, ShieldX, Clock, CheckCircle,
  RotateCcw, Trash2, ExternalLink, User
} from 'lucide-react'
import api from '@/lib/api'

interface UserDetail {
  id: string; email: string; plan: string; role: string; status: string
  created_at: string; last_login_at: string | null
  stripe_customer_id: string | null; stripe_subscription_id: string | null; stripe_period_end: string | null
  suspended_until: string | null; ban_reason: string | null
  servers: { id: string; name: string; local_ip: string; mode: string; verified: boolean; created_at: string }[]
  recentEvents: { event_type: string; meta: object; created_at: string; actor_email: string | null }[]
}

const STATUS_COLORS: Record<string, string> = { active: '#10b981', suspended: '#f59e0b', banned: '#ef4444' }

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )
}

function fmt(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  USER_SUSPENDED: <Clock size={13} style={{ color: '#f59e0b' }} />,
  USER_BANNED:    <ShieldX size={13} style={{ color: '#ef4444' }} />,
  USER_RESTORED:  <CheckCircle size={13} style={{ color: '#10b981' }} />,
  USER_UPDATED:   <User size={13} style={{ color: '#7C3AED' }} />,
  USER_DELETED:   <Trash2 size={13} style={{ color: '#ef4444' }} />,
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await api.get(`/api/v1/admin/users/${id}`)
      setUser(res.data)
    } catch {
      router.push('/users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function act(action: string, body?: object) {
    if (action === 'delete' && !confirm(`Supprimer définitivement ${user?.email} ?`)) return
    setActing(true)
    try {
      if (action === 'delete') {
        await api.delete(`/api/v1/admin/users/${id}`)
        router.push('/users')
        return
      }
      const reason = (action === 'ban' || action === 'suspend')
        ? prompt(`Raison :`) || ''
        : ''
      const hours = action === 'suspend' ? parseInt(prompt('Durée (heures) :') || '24') : 24
      await api.post(`/api/v1/admin/users/${id}/${action}`, { reason, hours, ...body })
      await load()
    } catch {
      alert('Action échouée')
    } finally {
      setActing(false)
    }
  }

  if (loading || !user) {
    return (
      <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
        {loading ? 'Chargement…' : 'Utilisateur introuvable'}
      </div>
    )
  }

  const statusColor = STATUS_COLORS[user.status] || '#10b981'

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Back */}
      <Link href="/users" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 24,
      }}>
        <ArrowLeft size={14} /> Retour aux utilisateurs
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {user.email[0].toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {user.email}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: statusColor,
              background: `${statusColor}20`, padding: '2px 8px', borderRadius: 20 }}>
              {user.status || 'active'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {user.id}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {user.status !== 'active' ? (
            <ActionBtn onClick={() => act('restore')} color="#10b981" disabled={acting}>
              <CheckCircle size={14} /> Réactiver
            </ActionBtn>
          ) : (
            <>
              <ActionBtn onClick={() => act('suspend')} color="#f59e0b" disabled={acting}>
                <Clock size={14} /> Suspendre
              </ActionBtn>
              <ActionBtn onClick={() => act('ban')} color="#ef4444" disabled={acting}>
                <ShieldX size={14} /> Bannir
              </ActionBtn>
            </>
          )}
          {user.plan !== 'premium' ? (
            <ActionBtn onClick={() => api.patch(`/api/v1/admin/users/${id}`, { plan: 'premium' }).then(load)} color="#7C3AED" disabled={acting}>
              <Crown size={14} /> → Premium
            </ActionBtn>
          ) : (
            <ActionBtn onClick={() => api.patch(`/api/v1/admin/users/${id}`, { plan: 'free' }).then(load)} color="var(--text-muted)" disabled={acting}>
              <RotateCcw size={14} /> → Free
            </ActionBtn>
          )}
          <ActionBtn onClick={() => act('delete')} color="#ef4444" disabled={acting} outline>
            <Trash2 size={14} /> Supprimer
          </ActionBtn>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Account info */}
        <Card title="Informations du compte">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Plan" value={<span style={{ fontWeight: 600, color: user.plan === 'premium' ? '#a78bfa' : 'var(--text)' }}>{user.plan}</span>} />
          <InfoRow label="Rôle" value={user.role} />
          <InfoRow label="Statut" value={<span style={{ color: statusColor, fontWeight: 600 }}>{user.status || 'active'}</span>} />
          <InfoRow label="Inscrit le" value={fmt(user.created_at)} />
          <InfoRow label="Dernière connexion" value={fmt(user.last_login_at)} />
          {user.ban_reason && <InfoRow label="Raison ban" value={<span style={{ color: '#ef4444' }}>{user.ban_reason}</span>} />}
          {user.suspended_until && <InfoRow label="Suspendu jusqu'au" value={fmt(user.suspended_until)} />}
        </Card>

        {/* Stripe */}
        <Card title="Abonnement Stripe">
          <InfoRow label="Customer ID" value={
            user.stripe_customer_id
              ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{user.stripe_customer_id}</span>
              : 'Pas de compte Stripe'
          } />
          <InfoRow label="Subscription ID" value={
            user.stripe_subscription_id
              ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{user.stripe_subscription_id}</span>
              : '—'
          } />
          <InfoRow label="Fin de période" value={fmt(user.stripe_period_end)} />
          {user.stripe_customer_id && (
            <a
              href={`https://dashboard.stripe.com/customers/${user.stripe_customer_id}`}
              target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
                fontSize: 12, color: 'var(--accent-light)', textDecoration: 'none' }}
            >
              <ExternalLink size={12} /> Voir dans Stripe Dashboard
            </a>
          )}
        </Card>

        {/* Servers */}
        <Card title={`Serveurs Proxmox (${user.servers.length})`}>
          {user.servers.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Aucun serveur connecté</p>
          ) : user.servers.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <Server size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.local_ip} · {s.mode}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                {fmt(s.created_at)?.slice(0, 11)}
              </span>
            </div>
          ))}
        </Card>

        {/* Events */}
        <Card title="Historique admin">
          {user.recentEvents.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Aucune action admin enregistrée</p>
          ) : user.recentEvents.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ marginTop: 1 }}>{EVENT_ICONS[e.event_type] || <User size={13} style={{ color: 'var(--text-muted)' }} />}</div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{e.event_type.replace(/_/g, ' ')}</div>
                {e.actor_email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>par {e.actor_email}</div>}
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {fmt(e.created_at)?.slice(0, 16)}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>{title}</h2>
      {children}
    </div>
  )
}

function ActionBtn({ children, onClick, color, disabled, outline }: {
  children: React.ReactNode; onClick: () => void; color: string; disabled?: boolean; outline?: boolean
}) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
        background: outline ? 'transparent' : `${color}20`,
        border: `1px solid ${color}50`, color,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}
