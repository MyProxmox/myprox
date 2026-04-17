'use client'

import { useEffect, useState } from 'react'
import { ShieldX, Clock, User, Crown, RotateCcw, Trash2, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

interface AppEvent {
  id: string
  event_type: string
  meta: Record<string, unknown>
  created_at: string
  user_email: string | null
  actor_email: string | null
}

const EVENT_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  USER_REGISTERED:   { label: 'Inscription',      icon: <User size={14} />,        color: '#10b981' },
  USER_SUSPENDED:    { label: 'Suspension',        icon: <Clock size={14} />,       color: '#f59e0b' },
  USER_BANNED:       { label: 'Bannissement',      icon: <ShieldX size={14} />,     color: '#ef4444' },
  USER_RESTORED:     { label: 'Réactivation',      icon: <CheckCircle size={14} />, color: '#10b981' },
  USER_UPDATED:      { label: 'Modification',      icon: <User size={14} />,        color: '#7C3AED' },
  USER_DELETED:      { label: 'Suppression',       icon: <Trash2 size={14} />,      color: '#ef4444' },
  USER_PLAN_UPGRADED:  { label: '→ Premium',       icon: <Crown size={14} />,       color: '#a78bfa' },
  USER_PLAN_DOWNGRADED: { label: '→ Free',         icon: <RotateCcw size={14} />,   color: 'var(--text-muted)' },
}

function fmt(d: string) {
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const EVENT_TYPES = ['', ...Object.keys(EVENT_CONFIG)]

export default function ActivityPage() {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (typeFilter) params.set('type', typeFilter)
      const res = await api.get(`/api/v1/admin/events?${params}`)
      setEvents(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [typeFilter])

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Journal d&apos;activité
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Toutes les actions admin et événements clés de l&apos;application
        </p>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 20 }}>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 8, fontSize: 13,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--text)', cursor: 'pointer', outline: 'none',
          }}
        >
          <option value="">Tous les événements</option>
          {Object.entries(EVENT_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Chargement…</div>
        ) : events.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Aucun événement enregistré
          </div>
        ) : events.map((ev, i) => {
          const cfg = EVENT_CONFIG[ev.event_type] || {
            label: ev.event_type.replace(/_/g, ' '), icon: <User size={14} />, color: 'var(--text-muted)',
          }
          return (
            <div
              key={ev.id || i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '14px 20px',
                borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: `${cfg.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: cfg.color,
              }}>
                {cfg.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                  {ev.user_email && (
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>
                      — <strong>{ev.user_email}</strong>
                    </span>
                  )}
                </div>
                {ev.actor_email && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    par {ev.actor_email}
                  </div>
                )}
                {ev.meta && Object.keys(ev.meta).length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'monospace',
                    background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4, display: 'inline-block' }}>
                    {Object.entries(ev.meta)
                      .filter(([, v]) => v !== undefined && v !== '' && v !== null)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                  </div>
                )}
              </div>

              {/* Date */}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {fmt(ev.created_at)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
