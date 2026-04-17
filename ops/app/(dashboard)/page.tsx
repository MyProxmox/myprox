'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, CreditCard, TrendingUp, TrendingDown,
  Server, ShieldX, Clock, Activity,
  ArrowUpRight, RefreshCw
} from 'lucide-react'
import api from '@/lib/api'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts'

interface OverviewStats {
  totalUsers: number
  newThisWeek: number
  newThisMonth: number
  growthRate: number | null
  premiumUsers: number
  bannedUsers: number
  suspendedUsers: number
  totalServers: number
  activeUsers30d: number
}

interface SignupPoint { period: string; count: number }

function KpiCard({
  label, value, sub, icon: Icon, accent, href,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; accent?: string; href?: string
}) {
  const card = (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'border-color 0.2s',
        cursor: href ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => href && (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={(e) => href && (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
        <div
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: accent || 'rgba(124,58,237,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon size={18} style={{ color: accent ? '#fff' : 'var(--accent)' }} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{card}</Link> : card
}

const PLAN_COLORS = ['#6366f1', '#7C3AED', '#10b981']

export default function DashboardPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [signups, setSignups] = useState<SignupPoint[]>([])
  const [period, setPeriod] = useState<'30d' | '90d' | '12m'>('30d')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const [overviewRes, signupsRes] = await Promise.all([
        api.get('/api/v1/admin/stats/overview'),
        api.get(`/api/v1/admin/stats/signups?period=${period}`),
      ])
      setStats(overviewRes.data)
      setSignups(signupsRes.data)
    } catch (e) {
      console.error('Dashboard load error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Activity size={32} style={{ animation: 'pulse 1.5s infinite' }} />
          <p style={{ marginTop: 12, fontSize: 14 }}>Chargement…</p>
        </div>
      </div>
    )
  }

  const planData = stats ? [
    { name: 'Free', value: stats.totalUsers - stats.premiumUsers },
    { name: 'Premium', value: stats.premiumUsers },
  ].filter(d => d.value > 0) : []

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Vue d&apos;ensemble de MyProx
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, fontSize: 13,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Actualiser
        </button>
      </div>

      {/* KPI Grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <KpiCard
            label="Utilisateurs total" value={stats.totalUsers.toLocaleString()}
            sub={`${stats.activeUsers30d} actifs (30j)`} icon={Users} href="/users"
          />
          <KpiCard
            label="Nouveaux ce mois" value={`+${stats.newThisMonth}`}
            sub={stats.growthRate !== null
              ? stats.growthRate >= 0
                ? `↑ +${stats.growthRate}% vs mois précédent`
                : `↓ ${stats.growthRate}% vs mois précédent`
              : `+${stats.newThisWeek} cette semaine`
            }
            icon={stats.growthRate !== null && stats.growthRate >= 0 ? TrendingUp : TrendingDown}
          />
          <KpiCard
            label="Abonnés Premium" value={stats.premiumUsers}
            sub={`MRR estimé : €${(stats.premiumUsers * 8).toFixed(0)}/mois`}
            icon={CreditCard} href="/subscriptions"
          />
          <KpiCard
            label="Serveurs connectés" value={stats.totalServers}
            sub="Nx toutes les proxmox" icon={Server}
          />
          <KpiCard
            label="Comptes bannis" value={stats.bannedUsers}
            sub={`${stats.suspendedUsers} suspendu${stats.suspendedUsers > 1 ? 's' : ''}`}
            icon={ShieldX} href="/users?status=banned"
          />
          <KpiCard
            label="Suspensions actives" value={stats.suspendedUsers}
            sub="Accès temporairement bloqué" icon={Clock} href="/users?status=suspended"
          />
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 32 }}>
        {/* Signups chart */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Inscriptions
            </h2>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['30d', '90d', '12m'] as const).map((p) => (
                <button
                  key={p} onClick={() => setPeriod(p)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12,
                    background: period === p ? 'var(--accent)' : 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: period === p ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {p === '30d' ? '30 jours' : p === '90d' ? '3 mois' : '12 mois'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={signups}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="period"
                tickFormatter={(v) => v?.toString().slice(5, 10) || v}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--text)', fontSize: 12 }}
                itemStyle={{ color: 'var(--accent-light)', fontSize: 12 }}
              />
              <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution donut */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 16px', alignSelf: 'flex-start' }}>
            Plans
          </h2>
          <PieChart width={180} height={180}>
            <Pie data={planData} cx={90} cy={90} innerRadius={55} outerRadius={80} dataKey="value">
              {planData.map((_, i) => (
                <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}
              itemStyle={{ color: 'var(--text)', fontSize: 12 }}
            />
          </PieChart>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 12 }}>
            {planData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: PLAN_COLORS[i] }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{d.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {d.value} ({stats ? Math.round((d.value / stats.totalUsers) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { href: '/users', label: 'Gérer les utilisateurs', sub: 'Ban, suspension, plans' },
          { href: '/subscriptions', label: 'Abonnements Stripe', sub: 'Revenus et paiements' },
          { href: '/activity', label: "Journal d'activité", sub: 'Logs admin et système' },
          { href: '/analytics', label: 'Analytics détaillées', sub: 'Rétention, fréquence' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              textDecoration: 'none', color: 'var(--text)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.background = 'rgba(124,58,237,0.06)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'var(--surface)'
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.sub}</div>
            </div>
            <ArrowUpRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </Link>
        ))}
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  )
}
