'use client'

import { useEffect, useState } from 'react'
import { CreditCard, TrendingUp, Users, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

interface RevenueData {
  mrr: string; arr: string; premiumUsers: number; pricePerUser: number
  events: { event_type: string; month: string; count: string }[]
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

export default function SubscriptionsPage() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/v1/admin/stats/revenue').then((r) => {
      setData(r.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  // Group events by month for chart
  const monthlyData = (() => {
    if (!data?.events) return []
    const map: Record<string, { month: string; upgrades: number; cancellations: number; failed: number }> = {}
    for (const e of data.events) {
      const key = e.month
      if (!map[key]) map[key] = { month: fmt(e.month), upgrades: 0, cancellations: 0, failed: 0 }
      if (e.event_type === 'checkout.session.completed') map[key].upgrades += parseInt(e.count)
      if (e.event_type === 'customer.subscription.deleted') map[key].cancellations += parseInt(e.count)
      if (e.event_type === 'invoice.payment_failed') map[key].failed += parseInt(e.count)
    }
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
  })()

  if (loading) {
    return <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>Chargement…</div>
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Abonnements & Revenus
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Données Stripe et métriques financières
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <KpiCard label="MRR" value={`€${data?.mrr || '0'}`} sub="Revenu mensuel récurrent" icon={TrendingUp} />
        <KpiCard label="ARR" value={`€${data?.arr || '0'}`} sub="Revenu annuel récurrent" icon={CreditCard} />
        <KpiCard label="Abonnés Premium" value={data?.premiumUsers || 0} sub={`${data?.pricePerUser}€/mois/utilisateur`} icon={Users} />
        <KpiCard
          label="Paiements échoués"
          value={data?.events.filter(e => e.event_type === 'invoice.payment_failed').reduce((a, e) => a + parseInt(e.count), 0) || 0}
          sub="Sur les 12 derniers mois" icon={AlertTriangle} accent="rgba(239,68,68,0.2)"
        />
      </div>

      {/* Chart */}
      {monthlyData.length > 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 20px' }}>
            Activité Stripe (12 mois)
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}
                itemStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="upgrades" name="Nouveaux abonnés" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cancellations" name="Annulations" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" name="Paiements échoués" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
          padding: 40, textAlign: 'center', color: 'var(--text-muted)',
        }}>
          <CreditCard size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 14, margin: 0 }}>
            Aucune activité Stripe enregistrée.<br />
            Les données apparaîtront dès les premiers abonnements.
          </p>
        </div>
      )}

      {/* Note */}
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, textAlign: 'center' }}>
        MRR calculé sur la base de {data?.premiumUsers} × €{data?.pricePerUser}/mois · Données mises à jour via webhooks Stripe
      </p>
    </div>
  )
}

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub: string; icon: React.ElementType; accent?: string
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: accent || 'rgba(124,58,237,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} style={{ color: 'var(--accent)' }} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}
