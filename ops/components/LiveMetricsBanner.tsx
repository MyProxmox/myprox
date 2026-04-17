'use client'

import { useState, useCallback } from 'react'
import { Activity, X } from 'lucide-react'
import { useNodeSSE, SSENodeMetric } from '@/lib/useSSE'

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

export default function LiveMetricsBanner({ serverId }: { serverId: string }) {
  const [metric, setMetric] = useState<SSENodeMetric | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [alerts, setAlerts] = useState<string[]>([])

  const handleMetric = useCallback((m: SSENodeMetric) => {
    if (m.error) return
    setMetric(m)

    // Threshold alerts
    const cpuPct = Math.round(m.cpu * 100)
    const memPct = m.memTotal > 0 ? Math.round((m.mem / m.memTotal) * 100) : 0
    const newAlerts: string[] = []
    if (cpuPct > 90) newAlerts.push(`CPU critique : ${cpuPct}%`)
    if (memPct > 90) newAlerts.push(`RAM critique : ${memPct}%`)
    if (newAlerts.length > 0) setAlerts(newAlerts)
  }, [])

  useNodeSSE(serverId, handleMetric)

  if (dismissed || !metric) return null

  const cpuPct = Math.round(metric.cpu * 100)
  const memPct = metric.memTotal > 0 ? Math.round((metric.mem / metric.memTotal) * 100) : 0
  const isCritical = cpuPct > 90 || memPct > 90

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 900,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'flex-end',
    }}>
      {/* Alert toasts */}
      {alerts.map((a, i) => (
        <div key={i} style={{
          background: 'rgba(239,68,68,0.95)',
          color: '#fff',
          borderRadius: 10,
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          ⚠ {a}
          <button onClick={() => setAlerts(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 0, marginLeft: 4, opacity: 0.8 }}>
            <X size={14} />
          </button>
        </div>
      ))}

      {/* Live metrics pill */}
      <div style={{
        background: 'var(--surface)',
        border: `1px solid ${isCritical ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        fontSize: 13,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={14} style={{ color: 'var(--success)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live</span>
        </div>
        <span style={{ color: cpuPct > 90 ? 'var(--error)' : cpuPct > 70 ? 'var(--warning)' : 'var(--text)' }}>
          CPU <strong>{cpuPct}%</strong>
        </span>
        <span style={{ color: memPct > 90 ? 'var(--error)' : memPct > 70 ? 'var(--warning)' : 'var(--text)' }}>
          RAM <strong>{memPct}%</strong>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          ↑ {formatBytes(metric.netout)}/s
        </span>
        <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
          <X size={14} />
        </button>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
